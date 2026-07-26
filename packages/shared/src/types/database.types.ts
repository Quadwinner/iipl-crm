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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log_entries: {
        Row: {
          action_type: string
          actor_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      building: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaint_categories: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      global_config: {
        Row: {
          id: number
          lockout_duration_minutes: number
          lockout_threshold: number
          max_retries: number
          payment_grace_period_days: number
          reminder_frequency_days: number
          reminder_lead_time_days: number
          session_timeout_minutes: number
          updated_at: string
        }
        Insert: {
          id?: number
          lockout_duration_minutes?: number
          lockout_threshold?: number
          max_retries?: number
          payment_grace_period_days?: number
          reminder_frequency_days?: number
          reminder_lead_time_days?: number
          session_timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: number
          lockout_duration_minutes?: number
          lockout_threshold?: number
          max_retries?: number
          payment_grace_period_days?: number
          reminder_frequency_days?: number
          reminder_lead_time_days?: number
          session_timeout_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          last_attempt_at: string | null
          next_attempt_at: string
          notification_type: string
          payload: Json
          retry_count: number
          status: Database["public"]["Enums"]["notification_status"]
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          next_attempt_at?: string
          notification_type: string
          payload?: Json
          retry_count?: number
          status?: Database["public"]["Enums"]["notification_status"]
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          next_attempt_at?: string
          notification_type?: string
          payload?: Json
          retry_count?: number
          status?: Database["public"]["Enums"]["notification_status"]
          user_id?: string
        }
        Relationships: []
      }
      office_unit: {
        Row: {
          base_rent_amount: number
          building_id: string
          created_at: string
          floor: number
          id: string
          occupancy_status: Database["public"]["Enums"]["occupancy_status"]
          size_sqft: number
          unit_code: string
          updated_at: string
        }
        Insert: {
          base_rent_amount: number
          building_id: string
          created_at?: string
          floor: number
          id?: string
          occupancy_status?: Database["public"]["Enums"]["occupancy_status"]
          size_sqft: number
          unit_code: string
          updated_at?: string
        }
        Update: {
          base_rent_amount?: number
          building_id?: string
          created_at?: string
          floor?: number
          id?: string
          occupancy_status?: Database["public"]["Enums"]["occupancy_status"]
          size_sqft?: number
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_unit_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          failed_login_count: number
          last_activity_at: string
          locked_until: string | null
          role: Database["public"]["Enums"]["role"]
          user_id: string
        }
        Insert: {
          failed_login_count?: number
          last_activity_at?: string
          locked_until?: string | null
          role?: Database["public"]["Enums"]["role"]
          user_id: string
        }
        Update: {
          failed_login_count?: number
          last_activity_at?: string
          locked_until?: string | null
          role?: Database["public"]["Enums"]["role"]
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: { Args: { p_permission: string }; Returns: boolean }
      config: {
        Args: never
        Returns: {
          id: number
          lockout_duration_minutes: number
          lockout_threshold: number
          max_retries: number
          payment_grace_period_days: number
          reminder_frequency_days: number
          reminder_lead_time_days: number
          session_timeout_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "global_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      configure_payment_grace_period: {
        Args: { p_days: number }
        Returns: {
          id: number
          lockout_duration_minutes: number
          lockout_threshold: number
          max_retries: number
          payment_grace_period_days: number
          reminder_frequency_days: number
          reminder_lead_time_days: number
          session_timeout_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "global_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      configure_security_policy: {
        Args: {
          p_lockout_duration_minutes: number
          p_lockout_threshold: number
          p_session_timeout_minutes: number
        }
        Returns: {
          id: number
          lockout_duration_minutes: number
          lockout_threshold: number
          max_retries: number
          payment_grace_period_days: number
          reminder_frequency_days: number
          reminder_lead_time_days: number
          session_timeout_minutes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "global_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_office_unit: {
        Args: {
          p_base_rent_amount: number
          p_building_id: string
          p_floor: number
          p_size_sqft: number
          p_unit_code: string
        }
        Returns: {
          base_rent_amount: number
          building_id: string
          created_at: string
          floor: number
          id: string
          occupancy_status: Database["public"]["Enums"]["occupancy_status"]
          size_sqft: number
          unit_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "office_unit"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role"]
      }
      enqueue_notification: {
        Args: {
          p_channel: Database["public"]["Enums"]["notification_channel"]
          p_payload?: Json
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      is_account_locked: { Args: { p_email: string }; Returns: boolean }
      is_administrator: { Args: never; Returns: boolean }
      occupancy_summary: {
        Args: { p_building_id?: string }
        Returns: {
          occupied_count: number
          total_count: number
          vacant_count: number
        }[]
      }
      record_audit: {
        Args: {
          p_action_type: string
          p_entity_id: string
          p_entity_type: string
          p_field_name?: string
          p_new_value?: string
          p_old_value?: string
        }
        Returns: string
      }
      record_login_failure: { Args: { p_email: string }; Returns: undefined }
      record_login_success: { Args: never; Returns: undefined }
      require_permission: { Args: { p_permission: string }; Returns: undefined }
      session_expired: { Args: never; Returns: boolean }
      touch_session: { Args: never; Returns: boolean }
      update_office_unit: {
        Args: {
          p_base_rent_amount?: number
          p_building_id?: string
          p_floor?: number
          p_size_sqft?: number
          p_unit_code?: string
          p_unit_id: string
        }
        Returns: {
          base_rent_amount: number
          building_id: string
          created_at: string
          floor: number
          id: string
          occupancy_status: Database["public"]["Enums"]["occupancy_status"]
          size_sqft: number
          unit_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "office_unit"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      notification_channel: "EMAIL" | "SMS" | "IN_APP"
      notification_status: "PENDING" | "SENT" | "FAILED"
      occupancy_status: "VACANT" | "OCCUPIED"
      role: "ADMINISTRATOR" | "MAINTENANCE_STAFF" | "OFFICE_OWNER"
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
      notification_channel: ["EMAIL", "SMS", "IN_APP"],
      notification_status: ["PENDING", "SENT", "FAILED"],
      occupancy_status: ["VACANT", "OCCUPIED"],
      role: ["ADMINISTRATOR", "MAINTENANCE_STAFF", "OFFICE_OWNER"],
    },
  },
} as const
