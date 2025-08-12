export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          color: string
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          color: string
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      lists: {
        Row: {
          id: string
          board_id: string
          user_id: string
          title: string
          position: number
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          title: string
          position: number
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          title?: string
          position?: number
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      tasks: {
        Row: {
          id: string
          list_id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          priority: 'low' | 'medium' | 'high'
          labels: string[]
          position: number
          due_date: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          labels?: string[]
          position: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high'
          labels?: string[]
          position?: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          is_guest: boolean
          guest_upgraded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_guest?: boolean
          guest_upgraded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_guest?: boolean
          guest_upgraded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}