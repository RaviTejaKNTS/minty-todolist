import create from 'zustand';
import localforage from 'localforage';
import { Board, List, Task, createTask, updateTask, deleteTask, getBoards, getLists, getTasks } from '../services/db';

interface State {
  boards: Board[];
  lists: Record<string, List[]>;
  tasks: Record<string, Task[]>;
  conflict: boolean;
  load: () => Promise<void>;
  addTask: (listId: string, title: string) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  boards: [],
  lists: {},
  tasks: {},
  conflict: false,
  load: async () => {
    const boards = await getBoards();
    const lists: Record<string, List[]> = {};
    const tasks: Record<string, Task[]> = {};
    for (const b of boards) {
      lists[b.id] = await getLists(b.id);
      for (const l of lists[b.id]) {
        tasks[l.id] = await getTasks(l.id);
      }
    }
    set({ boards, lists, tasks });
    await localforage.setItem('cache', { boards, lists, tasks });
  },
  addTask: async (listId, title) => {
    const newTask: Partial<Task> = {
      id: crypto.randomUUID(),
      list_id: listId,
      board_id: get().boards.find(b => get().lists[b.id]?.some(l => l.id === listId))?.id ?? '',
      title,
      description: '',
      position: (get().tasks[listId]?.length || 0) + 1,
    };
    const created = await createTask(newTask);
    set((s) => ({ tasks: { ...s.tasks, [listId]: [...(s.tasks[listId] || []), created] } }));
  },
  saveTask: async (task) => {
    const res = await updateTask(task);
    set((s) => ({
      conflict: res.merged,
      tasks: {
        ...s.tasks,
        [task.list_id]: (s.tasks[task.list_id] || []).map((t) => (t.id === task.id ? res.task : t)),
      },
    }));
  },
  removeTask: async (id) => {
    for (const listId of Object.keys(get().tasks)) {
      if (get().tasks[listId].some((t) => t.id === id)) {
        await deleteTask(id);
        set((s) => ({
          tasks: { ...s.tasks, [listId]: s.tasks[listId].filter((t) => t.id !== id) },
        }));
        break;
      }
    }
  },
}));
