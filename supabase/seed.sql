-- Simple seed: create demo board/list/task for current user
insert into boards (id, name, user_id, position)
values (gen_random_uuid(), 'Demo Board', auth.uid(), 1);
