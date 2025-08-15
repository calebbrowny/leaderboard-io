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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          created_at: string
          description: string
          end_at: string
          id: string
          is_active: boolean
          metric_type: Database["public"]["Enums"]["metric_type"]
          month: number
          prizes: string
          rules: string
          slug: string
          sort_direction: Database["public"]["Enums"]["sort_direction"]
          start_at: string
          title: string
          unit: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          description: string
          end_at: string
          id?: string
          is_active?: boolean
          metric_type: Database["public"]["Enums"]["metric_type"]
          month: number
          prizes: string
          rules: string
          slug: string
          sort_direction: Database["public"]["Enums"]["sort_direction"]
          start_at: string
          title: string
          unit?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string
          end_at?: string
          id?: string
          is_active?: boolean
          metric_type?: Database["public"]["Enums"]["metric_type"]
          month?: number
          prizes?: string
          rules?: string
          slug?: string
          sort_direction?: Database["public"]["Enums"]["sort_direction"]
          start_at?: string
          title?: string
          unit?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          auto_approve: boolean
          created_at: string
          custom_domain: string | null
          description: string | null
          end_date: string | null
          id: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          owner_user_id: string
          requires_verification: boolean
          rules: string | null
          slug: string
          smart_time_parsing: boolean
          sort_direction: Database["public"]["Enums"]["sort_direction"]
          submission_deadline: string | null
          submissions_per_user: number | null
          title: string
          unit: string | null
        }
        Insert: {
          auto_approve?: boolean
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          owner_user_id: string
          requires_verification?: boolean
          rules?: string | null
          slug: string
          smart_time_parsing?: boolean
          sort_direction: Database["public"]["Enums"]["sort_direction"]
          submission_deadline?: string | null
          submissions_per_user?: number | null
          title: string
          unit?: string | null
        }
        Update: {
          auto_approve?: boolean
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          owner_user_id?: string
          requires_verification?: boolean
          rules?: string | null
          slug?: string
          smart_time_parsing?: boolean
          sort_direction?: Database["public"]["Enums"]["sort_direction"]
          submission_deadline?: string | null
          submissions_per_user?: number | null
          title?: string
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_ip: string | null
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          leaderboard_id: string
          notes: string | null
          proof_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submission_metadata: Json | null
          submitted_at: string
          user_id: string | null
          value_display: string
          value_raw: number
          video_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_ip?: string | null
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          leaderboard_id: string
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_metadata?: Json | null
          submitted_at?: string
          user_id?: string | null
          value_display: string
          value_raw: number
          video_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_ip?: string | null
          email?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          leaderboard_id?: string
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_metadata?: Json | null
          submitted_at?: string
          user_id?: string | null
          value_display?: string
          value_raw?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_leaderboard_id_fkey"
            columns: ["leaderboard_id"]
            isOneToOne: false
            referencedRelation: "leaderboards"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_leaderboard_stats: {
        Args: { leaderboard_uuid: string }
        Returns: {
          approved_submissions: number
          pending_submissions: number
          total_submissions: number
          unique_participants: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      gender: "male" | "female" | "other"
      metric_type: "time" | "reps" | "distance" | "weight"
      sort_direction: "asc" | "desc"
      submission_status: "PENDING" | "APPROVED" | "REJECTED"
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
      app_role: ["admin", "moderator", "user"],
      gender: ["male", "female", "other"],
      metric_type: ["time", "reps", "distance", "weight"],
      sort_direction: ["asc", "desc"],
      submission_status: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
} as const
