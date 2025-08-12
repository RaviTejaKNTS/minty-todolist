import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/database.types'

type Tables = Database['public']['Tables']
type Board = Tables['boards']['Row']
type List = Tables['lists']['Row']
type Task = Tables['tasks']['Row']

export interface SyncState {
  boards: Board[]
  lists: List[]
  tasks: Task[]
  loading: boolean
  syncing: boolean
  offline: boolean
  lastSync: Date | null
}

export interface ConflictNotification {
  id: string
  type: 'board' | 'list' | 'task'
  itemId: string
  message: string
  timestamp: Date
}

export function useSync() {
  const { profile, isGuest } = useAuth()
  const [syncState, setSyncState] = useState<SyncState>({
    boards: [],
    lists: [],
    tasks: [],
    loading: true,
    syncing: false,
    offline: !navigator.onLine,
    lastSync: null
  })
  const [conflicts, setConflicts] = useState<ConflictNotification[]>([])
  const subscriptionsRef = useRef<any[]>([])

  // Get user ID (guest or authenticated)
  const userId = profile?.id

  // Load data from localStorage (offline cache)
  const loadFromCache = useCallback(() => {
    if (!userId) return

    try {
      const cached = localStorage.getItem(`tasksmint_data_${userId}`)
      if (cached) {
        const data = JSON.parse(cached)
        setSyncState(prev => ({
          ...prev,
          boards: data.boards || [],
          lists: data.lists || [],
          tasks: data.tasks || [],
          loading: false
        }))
      }
    } catch (error) {
      console.error('Error loading from cache:', error)
    }
  }, [userId])

  // Save data to localStorage (offline cache)
  const saveToCache = useCallback((data: Partial<SyncState>) => {
    if (!userId) return

    try {
      const cacheData = {
        boards: data.boards || syncState.boards,
        lists: data.lists || syncState.lists,
        tasks: data.tasks || syncState.tasks,
        lastSync: new Date().toISOString()
      }
      localStorage.setItem(`tasksmint_data_${userId}`, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }, [userId, syncState])

  // Sync data from server
  const syncFromServer = useCallback(async () => {
    if (!userId || isGuest) {
      loadFromCache()
      return
    }

    try {
      setSyncState(prev => ({ ...prev, syncing: true }))

      // Fetch all data
      const [boardsResult, listsResult, tasksResult] = await Promise.all([
        supabase.from('boards').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('lists').select('*').eq('user_id', userId).order('position'),
        supabase.from('tasks').select('*').eq('user_id', userId).order('position')
      ])

      if (boardsResult.error) throw boardsResult.error
      if (listsResult.error) throw listsResult.error
      if (tasksResult.error) throw tasksResult.error

      const newState = {
        boards: boardsResult.data || [],
        lists: listsResult.data || [],
        tasks: tasksResult.data || [],
        loading: false,
        syncing: false,
        lastSync: new Date()
      }

      setSyncState(prev => ({ ...prev, ...newState }))
      saveToCache(newState)
    } catch (error) {
      console.error('Error syncing from server:', error)
      setSyncState(prev => ({ ...prev, syncing: false, loading: false }))
      loadFromCache()
    }
  }, [userId, isGuest, loadFromCache, saveToCache])

  // Handle conflicts with last-write-wins strategy
  const handleConflict = useCallback((type: string, itemId: string, localVersion: number, serverVersion: number) => {
    const conflict: ConflictNotification = {
      id: `${type}-${itemId}-${Date.now()}`,
      type: type as 'board' | 'list' | 'task',
      itemId,
      message: `Your ${type} was updated on another device. Latest changes have been applied.`,
      timestamp: new Date()
    }

    setConflicts(prev => [...prev, conflict])

    // Auto-remove conflict notification after 10 seconds
    setTimeout(() => {
      setConflicts(prev => prev.filter(c => c.id !== conflict.id))
    }, 10000)
  }, [])

  // Optimistic update with conflict detection
  const optimisticUpdate = useCallback(async <T extends { id: string; version: number }>(
    table: 'boards' | 'lists' | 'tasks',
    item: T,
    updateFn: (items: T[]) => T[]
  ) => {
    if (!userId) return

    // Apply optimistic update
    setSyncState(prev => ({
      ...prev,
      [table]: updateFn(prev[table] as T[])
    }))

    // If guest, just save to cache
    if (isGuest) {
      saveToCache({ [table]: syncState[table] })
      return
    }

    try {
      // Increment version for conflict detection
      const updatedItem = { ...item, version: item.version + 1, updated_at: new Date().toISOString() }

      const { data, error } = await supabase
        .from(table)
        .upsert(updatedItem)
        .select()
        .single()

      if (error) throw error

      // Update with server response
      setSyncState(prev => ({
        ...prev,
        [table]: (prev[table] as T[]).map(i => i.id === data.id ? data : i)
      }))

      saveToCache({ [table]: syncState[table] })
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      
      // Revert optimistic update on error
      setSyncState(prev => ({
        ...prev,
        [table]: (prev[table] as T[]).filter(i => i.id !== item.id)
      }))
    }
  }, [userId, isGuest, saveToCache, syncState])

  // CRUD operations
  const createBoard = useCallback(async (board: Omit<Board, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>) => {
    if (!userId) return

    const newBoard: Board = {
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      ...board
    }

    await optimisticUpdate('boards', newBoard, (boards) => [...boards, newBoard])
  }, [userId, optimisticUpdate])

  const updateBoard = useCallback(async (id: string, updates: Partial<Board>) => {
    if (!userId) return

    const board = syncState.boards.find(b => b.id === id)
    if (!board) return

    const updatedBoard = { ...board, ...updates, updated_at: new Date().toISOString() }
    await optimisticUpdate('boards', updatedBoard, (boards) => 
      boards.map(b => b.id === id ? updatedBoard : b)
    )
  }, [userId, syncState.boards, optimisticUpdate])

  const deleteBoard = useCallback(async (id: string) => {
    if (!userId) return

    // Also delete associated lists and tasks
    const boardLists = syncState.lists.filter(l => l.board_id === id)
    const boardTasks = syncState.tasks.filter(t => boardLists.some(l => l.id === t.list_id))

    setSyncState(prev => ({
      ...prev,
      boards: prev.boards.filter(b => b.id !== id),
      lists: prev.lists.filter(l => l.board_id !== id),
      tasks: prev.tasks.filter(t => !boardLists.some(l => l.id === t.list_id))
    }))

    if (!isGuest) {
      try {
        await Promise.all([
          supabase.from('tasks').delete().in('list_id', boardLists.map(l => l.id)),
          supabase.from('lists').delete().eq('board_id', id),
          supabase.from('boards').delete().eq('id', id)
        ])
      } catch (error) {
        console.error('Error deleting board:', error)
      }
    }

    saveToCache({})
  }, [userId, isGuest, syncState.lists, syncState.tasks, saveToCache])

  // Similar CRUD operations for lists and tasks...
  const createList = useCallback(async (list: Omit<List, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>) => {
    if (!userId) return

    const newList: List = {
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      ...list
    }

    await optimisticUpdate('lists', newList, (lists) => [...lists, newList])
  }, [userId, optimisticUpdate])

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'version'>) => {
    if (!userId) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      completed: false,
      priority: 'medium',
      labels: [],
      description: null,
      due_date: null,
      ...task
    }

    await optimisticUpdate('tasks', newTask, (tasks) => [...tasks, newTask])
  }, [userId, optimisticUpdate])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId || isGuest) return

    const setupSubscriptions = () => {
      // Clean up existing subscriptions
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
      subscriptionsRef.current = []

      // Subscribe to boards
      const boardsSub = supabase
        .channel('boards')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'boards', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setSyncState(prev => ({
                ...prev,
                boards: [...prev.boards, payload.new as Board]
              }))
            } else if (payload.eventType === 'UPDATE') {
              setSyncState(prev => ({
                ...prev,
                boards: prev.boards.map(b => 
                  b.id === payload.new.id ? payload.new as Board : b
                )
              }))
            } else if (payload.eventType === 'DELETE') {
              setSyncState(prev => ({
                ...prev,
                boards: prev.boards.filter(b => b.id !== payload.old.id)
              }))
            }
          }
        )
        .subscribe()

      subscriptionsRef.current.push(boardsSub)

      // Similar subscriptions for lists and tasks...
    }

    setupSubscriptions()

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
    }
  }, [userId, isGuest])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, offline: false }))
      syncFromServer()
    }

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, offline: true }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncFromServer])

  // Initial sync
  useEffect(() => {
    if (userId) {
      syncFromServer()
    }
  }, [userId, syncFromServer])

  // Dismiss conflict notification
  const dismissConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId))
  }, [])

  return {
    ...syncState,
    conflicts,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    createTask,
    syncFromServer,
    dismissConflict
  }
}