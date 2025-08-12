-- Schema and policies for TasksMint

create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version int not null default 1
);
create index boards_user_id_idx on boards(user_id);
create index boards_updated_at_idx on boards(updated_at);

create table lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards on delete cascade,
  user_id uuid references auth.users not null,
  name text not null,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version int not null default 1
);
create index lists_board_id_idx on lists(board_id);
create index lists_user_id_idx on lists(user_id);
create index lists_updated_at_idx on lists(updated_at);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards on delete cascade,
  list_id uuid references lists on delete cascade,
  user_id uuid references auth.users not null,
  title text not null,
  description text default '',
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version int not null default 1
);
create index tasks_board_id_idx on tasks(board_id);
create index tasks_list_id_idx on tasks(list_id);
create index tasks_user_id_idx on tasks(user_id);
create index tasks_updated_at_idx on tasks(updated_at);

create table task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks on delete cascade,
  user_id uuid references auth.users not null,
  title text not null,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  version int not null default 1
);
create index task_subtasks_task_id_idx on task_subtasks(task_id);
create index task_subtasks_user_id_idx on task_subtasks(user_id);
create index task_subtasks_updated_at_idx on task_subtasks(updated_at);

create table history (
  id bigserial primary key,
  table_name text not null,
  row_id uuid not null,
  user_id uuid,
  data jsonb not null,
  created_at timestamptz default now()
);
create index history_user_id_idx on history(user_id);

-- trigger helpers
create or replace function set_user_id() returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;$$;

create or replace function handle_version() returns trigger language plpgsql as $$
begin
  if new.version = old.version then
    new.version := old.version + 1;
    new.updated_at := now();
    return new;
  else
    raise exception 'version mismatch';
  end if;
end;$$;

create or replace function store_history() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into history(table_name,row_id,user_id,data)
  values (TG_TABLE_NAME, old.id, old.user_id, to_jsonb(old));
  return new;
end;$$;

-- apply triggers
create trigger trg_set_user_boards before insert on boards for each row execute function set_user_id();
create trigger trg_set_user_lists before insert on lists for each row execute function set_user_id();
create trigger trg_set_user_tasks before insert on tasks for each row execute function set_user_id();
create trigger trg_set_user_subtasks before insert on task_subtasks for each row execute function set_user_id();

create trigger trg_version_boards before update on boards for each row execute function handle_version();
create trigger trg_version_lists before update on lists for each row execute function handle_version();
create trigger trg_version_tasks before update on tasks for each row execute function handle_version();
create trigger trg_version_subtasks before update on task_subtasks for each row execute function handle_version();

create trigger trg_history_boards after update on boards for each row when (old.version <> new.version) execute function store_history();
create trigger trg_history_lists after update on lists for each row when (old.version <> new.version) execute function store_history();
create trigger trg_history_tasks after update on tasks for each row when (old.version <> new.version) execute function store_history();
create trigger trg_history_subtasks after update on task_subtasks for each row when (old.version <> new.version) execute function store_history();

-- RLS policies
alter table profiles enable row level security;
alter table boards enable row level security;
alter table lists enable row level security;
alter table tasks enable row level security;
alter table task_subtasks enable row level security;
alter table history enable row level security;

create policy profiles_rw on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy boards_rw on boards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy lists_rw on lists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tasks_rw on tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy subtasks_rw on task_subtasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy history_select on history for select using (user_id = auth.uid());

-- function to upgrade guest data after sign-in
create or replace function upgrade_guest_to_user(new_user uuid, old_user uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update boards set user_id = new_user where user_id = old_user;
  update lists set user_id = new_user where user_id = old_user;
  update tasks set user_id = new_user where user_id = old_user;
  update task_subtasks set user_id = new_user where user_id = old_user;
end;$$;
