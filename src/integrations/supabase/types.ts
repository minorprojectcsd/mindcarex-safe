export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_analysis: {
        Row: {
          created_at: string | null
          keywords: string[] | null
          risk_score: number | null
          sentiment: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          keywords?: string[] | null
          risk_score?: number | null
          sentiment?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          keywords?: string[] | null
          risk_score?: number | null
          sentiment?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_metrics: {
        Row: {
          captured_at: string | null
          confidence: number
          emotion: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          captured_at?: string | null
          confidence: number
          emotion: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          captured_at?: string | null
          confidence?: number
          emotion?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["app_role"] | null
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id: string
          sender_role?: Database["public"]["Enums"]["app_role"] | null
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["app_role"] | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          id: string
          license_number: string | null
          name: string
          primary_doctor_id: string | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          id: string
          license_number?: string | null
          name: string
          primary_doctor_id?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          primary_doctor_id?: string | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string | null
          doctor_id: string
          duration: number | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          duration?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_time?: string
          status?: string | null
        }
        Relationships: []
      }
      session_emotion_summary: {
        Row: {
          avg_angry: number | null
          avg_disgusted: number | null
          avg_fearful: number | null
          avg_happy: number | null
          avg_neutral: number | null
          avg_sad: number | null
          avg_stressed: number | null
          avg_surprised: number | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          avg_angry?: number | null
          avg_disgusted?: number | null
          avg_fearful?: number | null
          avg_happy?: number | null
          avg_neutral?: number | null
          avg_sad?: number | null
          avg_stressed?: number | null
          avg_surprised?: number | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          avg_angry?: number | null
          avg_disgusted?: number | null
          avg_fearful?: number | null
          avg_happy?: number | null
          avg_neutral?: number | null
          avg_sad?: number | null
          avg_stressed?: number | null
          avg_surprised?: number | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_emotion_summary_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          created_at: string | null
          session_id: string
          summary: string
        }
        Insert: {
          created_at?: string | null
          session_id: string
          summary: string
        }
        Update: {
          created_at?: string | null
          session_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          doctor_id: string
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string
          start_time: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          start_time?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          start_time?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "PATIENT" | "DOCTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["PATIENT", "DOCTOR"],
    },
  },
} as const
