import { supabase } from '../supabaseClient';

export interface Board {
  id: string;
  name: string;
  user_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface List {
  id: string;
  board_id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Task {
  id: string;
  list_id: string;
  board_id: string;
  user_id: string;
  title: string;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
  version: number;
}

export async function getBoards() {
  const { data, error } = await supabase.from('boards').select('*').order('position');
  if (error) throw error;
  return data as Board[];
}

export async function getLists(boardId: string) {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', boardId)
    .order('position');
  if (error) throw error;
  return data as List[];
}

export async function getTasks(listId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('list_id', listId)
    .order('position');
  if (error) throw error;
  return data as Task[];
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(task: Task) {
  const { id, ...values } = task;
  const { data, error } = await supabase
    .from('tasks')
    .update(values)
    .eq('id', id)
    .eq('version', task.version)
    .select()
    .single();
  if (!error) return { task: data as Task, merged: false };

  // Version mismatch -> merge last-writer-wins
  if (error.code === '409' || error.details?.includes('version')) {
    const { data: remote } = await supabase.from('tasks').select('*').eq('id', id).single();
    const merged: any = { ...remote, ...values };
    merged.version = (remote?.version ?? 0) + 1;
    const { data: final, error: err2 } = await supabase
      .from('tasks')
      .update(merged)
      .eq('id', id)
      .select()
      .single();
    if (err2) throw err2;
    return { task: final as Task, merged: true };
  }
  throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkReorder(table: 'lists' | 'tasks', updates: { id: string; position: number }[]) {
  const { error } = await supabase.from(table).upsert(updates, { onConflict: 'id', ignoreDuplicates: false });
  if (error) throw error;
}

export async function upgradeGuestToUser(newUserId: string, oldUserId: string) {
  const { error } = await supabase.rpc('upgrade_guest_to_user', {
    new_user: newUserId,
    old_user: oldUserId,
  });
  if (error) throw error;
}

export const db = {
  getBoards,
  getLists,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkReorder,
  upgradeGuestToUser,
};
