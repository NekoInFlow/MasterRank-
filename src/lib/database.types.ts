/**
 * Supabase Database type definitions.
 * Mirrors the schema defined in RPD.md п. 6; RLS / app_teacher — п. 7 RPD, roadmap п. 4.
 * When you run `supabase gen types typescript` this file can be replaced
 * with auto-generated output.
 */
export type Database = {
  public: {
    Tables: {
      app_teacher: {
        Row: {
          id: number
          user_id: string
        }
        Insert: {
          id?: number
          user_id: string
        }
        Update: {
          id?: number
          user_id?: string
        }
      }
      student_groups: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          score: number
          created_at: string
          group_id: string | null
        }
        Insert: {
          id?: string
          name: string
          score?: number
          created_at?: string
          group_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          score?: number
          created_at?: string
          group_id?: string | null
        }
      }
      badges: {
        Row: {
          id: string
          code: string
          title: string
          icon: string
          border_color: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          icon: string
          border_color?: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          icon?: string
          border_color?: string
          created_at?: string
        }
      }
      student_badges: {
        Row: {
          student_id: string
          badge_id: string
          assigned_at: string
        }
        Insert: {
          student_id: string
          badge_id: string
          assigned_at?: string
        }
        Update: {
          student_id?: string
          badge_id?: string
          assigned_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      is_teacher: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
