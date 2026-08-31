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
      allotment: {
        Row: {
          created_at: string
          expiration_reason: string | null
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["allotment_status"]
          terminated_at: string | null
        }
        Insert: {
          created_at?: string
          expiration_reason?: string | null
          id?: string
          office_owner_id: string
          office_unit_id: string
          status?: Database["public"]["Enums"]["allotment_status"]
          terminated_at?: string | null
        }
        Update: {
          created_at?: string
          expiration_reason?: string | null
          id?: string
          office_owner_id?: string
          office_unit_id?: string
          status?: Database["public"]["Enums"]["allotment_status"]
          terminated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allotment_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allotment_office_unit_id_fkey"
            columns: ["office_unit_id"]
            isOneToOne: false
            referencedRelation: "office_unit"
            referencedColumns: ["id"]
          },
        ]
      }
      app_modules: {
        Row: {
          accent: string
          allowed_roles: Database["public"]["Enums"]["role"][]
          base_path: string | null
          created_at: string
          features: Json
          icon: string
          id: string
          key: string
          listed_publicly: boolean
          marketing_slug: string | null
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["module_status"]
          summary: string
          tagline: string
          updated_at: string
        }
        Insert: {
          accent?: string
          allowed_roles?: Database["public"]["Enums"]["role"][]
          base_path?: string | null
          created_at?: string
          features?: Json
          icon?: string
          id?: string
          key: string
          listed_publicly?: boolean
          marketing_slug?: string | null
          name: string
          sort_order?: number
          status?: Database["public"]["Enums"]["module_status"]
          summary?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          accent?: string
          allowed_roles?: Database["public"]["Enums"]["role"][]
          base_path?: string | null
          created_at?: string
          features?: Json
          icon?: string
          id?: string
          key?: string
          listed_publicly?: boolean
          marketing_slug?: string | null
          name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["module_status"]
          summary?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      blog_posts: {
        Row: {
          author_name: string
          body: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: Json
          title?: string
          updated_at?: string
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
      building_expense: {
        Row: {
          amount: number
          building_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          reference_note: string | null
          title: string
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          building_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date: string
          id?: string
          reference_note?: string | null
          title: string
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          building_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          reference_note?: string | null
          title?: string
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_expense_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "building"
            referencedColumns: ["id"]
          },
        ]
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
      complaint_event: {
        Row: {
          actor_user_id: string | null
          comment_text: string | null
          complaint_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          new_status: Database["public"]["Enums"]["complaint_status"] | null
          old_status: Database["public"]["Enums"]["complaint_status"] | null
        }
        Insert: {
          actor_user_id?: string | null
          comment_text?: string | null
          complaint_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          new_status?: Database["public"]["Enums"]["complaint_status"] | null
          old_status?: Database["public"]["Enums"]["complaint_status"] | null
        }
        Update: {
          actor_user_id?: string | null
          comment_text?: string | null
          complaint_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          new_status?: Database["public"]["Enums"]["complaint_status"] | null
          old_status?: Database["public"]["Enums"]["complaint_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_event_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "maintenance_complaint"
            referencedColumns: ["id"]
          },
        ]
      }
      document: {
        Row: {
          bucket_id: string
          created_at: string
          file_extension: string
          file_name: string
          id: string
          lease_id: string | null
          mime_type: string
          object_key: string
          office_owner_id: string | null
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          bucket_id?: string
          created_at?: string
          file_extension: string
          file_name: string
          id?: string
          lease_id?: string | null
          mime_type: string
          object_key: string
          office_owner_id?: string | null
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string
          file_extension?: string
          file_name?: string
          id?: string
          lease_id?: string | null
          mime_type?: string
          object_key?: string
          office_owner_id?: string | null
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      file_attachment: {
        Row: {
          bucket_id: string
          complaint_id: string
          created_at: string
          file_extension: string
          file_name: string
          id: string
          mime_type: string
          object_key: string
          size_bytes: number
          uploaded_by: string | null
        }
        Insert: {
          bucket_id?: string
          complaint_id: string
          created_at?: string
          file_extension: string
          file_name: string
          id?: string
          mime_type: string
          object_key: string
          size_bytes: number
          uploaded_by?: string | null
        }
        Update: {
          bucket_id?: string
          complaint_id?: string
          created_at?: string
          file_extension?: string
          file_name?: string
          id?: string
          mime_type?: string
          object_key?: string
          size_bytes?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_attachment_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "maintenance_complaint"
            referencedColumns: ["id"]
          },
        ]
      }
      file_storage_config: {
        Row: {
          file_extension: string
          file_type_accepted: boolean
          id: string
          max_file_size_mb: number
          mime_type: string
          updated_at: string
        }
        Insert: {
          file_extension: string
          file_type_accepted?: boolean
          id?: string
          max_file_size_mb: number
          mime_type: string
          updated_at?: string
        }
        Update: {
          file_extension?: string
          file_type_accepted?: boolean
          id?: string
          max_file_size_mb?: number
          mime_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_config: {
        Row: {
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
          bank_account_number?: string
          bank_branch?: string
          bank_ifsc?: string
          bank_name?: string
          company_address?: string
          company_email?: string
          company_gstin?: string
          company_legal_name?: string
          company_phone?: string
          company_place_of_supply?: string
          default_gst_rate_percent?: number
          default_hsn_sac?: string
          id?: number
          invoice_series_prefix?: string
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
          bank_account_number?: string
          bank_branch?: string
          bank_ifsc?: string
          bank_name?: string
          company_address?: string
          company_email?: string
          company_gstin?: string
          company_legal_name?: string
          company_phone?: string
          company_place_of_supply?: string
          default_gst_rate_percent?: number
          default_hsn_sac?: string
          id?: number
          invoice_series_prefix?: string
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
      industries: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          summary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice: {
        Row: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          created_at: string
          document_ref: string | null
          due_date: string
          electricity_amount: number
          electricity_note: string | null
          electricity_units: number | null
          id: string
          invoice_number: string | null
          lease_id: string
          maintenance_amount: number
          maintenance_note: string | null
          office_owner_id: string
          office_unit_id: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
        }
        Insert: {
          additional_charges?: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          document_ref?: string | null
          due_date: string
          electricity_amount?: number
          electricity_note?: string | null
          electricity_units?: number | null
          id?: string
          invoice_number?: string | null
          lease_id: string
          maintenance_amount?: number
          maintenance_note?: string | null
          office_owner_id: string
          office_unit_id: string
          rent_amount: number
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
        }
        Update: {
          additional_charges?: number
          billing_cycle_key?: string
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          document_ref?: string | null
          due_date?: string
          electricity_amount?: number
          electricity_note?: string | null
          electricity_units?: number | null
          id?: string
          invoice_number?: string | null
          lease_id?: string
          maintenance_amount?: number
          maintenance_note?: string | null
          office_owner_id?: string
          office_unit_id?: string
          rent_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_office_unit_id_fkey"
            columns: ["office_unit_id"]
            isOneToOne: false
            referencedRelation: "office_unit"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_number_counter: {
        Row: {
          financial_year: string
          last_number: number
        }
        Insert: {
          financial_year: string
          last_number?: number
        }
        Update: {
          financial_year?: string
          last_number?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_range: string
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          module_key: string | null
          page_path: string
          phone: string
          service_interest: string
          source: Database["public"]["Enums"]["lead_source"]
          staff_notes: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: string
          company?: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string
          module_key?: string | null
          page_path?: string
          phone?: string
          service_interest?: string
          source?: Database["public"]["Enums"]["lead_source"]
          staff_notes?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_range?: string
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          module_key?: string | null
          page_path?: string
          phone?: string
          service_interest?: string
          source?: Database["public"]["Enums"]["lead_source"]
          staff_notes?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["key"]
          },
        ]
      }
      lease: {
        Row: {
          allotment_id: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          end_date: string
          id: string
          rent_amount: number
          start_date: string
        }
        Insert: {
          allotment_id: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          end_date: string
          id?: string
          rent_amount: number
          start_date: string
        }
        Update: {
          allotment_id?: string
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          end_date?: string
          id?: string
          rent_amount?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_allotment_id_fkey"
            columns: ["allotment_id"]
            isOneToOne: true
            referencedRelation: "allotment"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_complaint: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          office_owner_id: string
          office_unit_id: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          office_owner_id?: string
          office_unit_id?: string
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_complaint_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_complaint_office_unit_id_fkey"
            columns: ["office_unit_id"]
            isOneToOne: false
            referencedRelation: "office_unit"
            referencedColumns: ["id"]
          },
        ]
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
      office_owners: {
        Row: {
          billing_address: string | null
          company_name: string | null
          contact_email: string
          created_at: string
          gstin: string | null
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["owner_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          company_name?: string | null
          contact_email: string
          created_at?: string
          gstin?: string | null
          id?: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["owner_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string | null
          company_name?: string | null
          contact_email?: string
          created_at?: string
          gstin?: string | null
          id?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["owner_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      payment: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          gateway: Database["public"]["Enums"]["gateway_type"]
          id: string
          invoice_id: string
          office_owner_id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          gateway: Database["public"]["Enums"]["gateway_type"]
          id?: string
          invoice_id: string
          office_owner_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          gateway?: Database["public"]["Enums"]["gateway_type"]
          id?: string
          invoice_id?: string
          office_owner_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_verification_failures: {
        Row: {
          created_at: string
          gateway: Database["public"]["Enums"]["gateway_type"]
          id: string
          raw_body_hash: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          gateway: Database["public"]["Enums"]["gateway_type"]
          id?: string
          raw_body_hash: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          gateway?: Database["public"]["Enums"]["gateway_type"]
          id?: string
          raw_body_hash?: string
          reason?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          body: string
          category: string
          client_name: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          slug: string
          sort_order: number
          summary: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          client_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug: string
          sort_order?: number
          summary?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          client_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string
          sort_order?: number
          summary?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          failed_login_count: number
          full_name: string | null
          is_active: boolean
          last_activity_at: string
          locked_until: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role"]
          user_id: string
        }
        Insert: {
          failed_login_count?: number
          full_name?: string | null
          is_active?: boolean
          last_activity_at?: string
          locked_until?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role"]
          user_id: string
        }
        Update: {
          failed_login_count?: number
          full_name?: string | null
          is_active?: boolean
          last_activity_at?: string
          locked_until?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role"]
          user_id?: string
        }
        Relationships: []
      }
      receipt: {
        Row: {
          amount_paid: number
          completed_at: string
          document_ref: string | null
          generated_at: string
          id: string
          invoice_period: string
          office_owner_id: string
          office_owner_name: string
          office_unit_code: string
          office_unit_id: string
          payment_gateway: Database["public"]["Enums"]["gateway_type"]
          payment_id: string
          transaction_ref: string | null
        }
        Insert: {
          amount_paid: number
          completed_at: string
          document_ref?: string | null
          generated_at?: string
          id?: string
          invoice_period: string
          office_owner_id: string
          office_owner_name: string
          office_unit_code: string
          office_unit_id: string
          payment_gateway: Database["public"]["Enums"]["gateway_type"]
          payment_id: string
          transaction_ref?: string | null
        }
        Update: {
          amount_paid?: number
          completed_at?: string
          document_ref?: string | null
          generated_at?: string
          id?: string
          invoice_period?: string
          office_owner_id?: string
          office_owner_name?: string
          office_unit_code?: string
          office_unit_id?: string
          payment_gateway?: Database["public"]["Enums"]["gateway_type"]
          payment_id?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_office_owner_id_fkey"
            columns: ["office_owner_id"]
            isOneToOne: false
            referencedRelation: "office_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_office_unit_id_fkey"
            columns: ["office_unit_id"]
            isOneToOne: false
            referencedRelation: "office_unit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
        ]
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
      service_offerings: {
        Row: {
          body: string
          category: string
          created_at: string
          highlights: Json
          icon: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          highlights?: Json
          icon?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          highlights?: Json
          icon?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string
          business_hours: string
          company_name: string
          email: string
          id: number
          intro: string
          phone: string
          socials: Json
          tagline: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          business_hours?: string
          company_name?: string
          email?: string
          id?: number
          intro?: string
          phone?: string
          socials?: Json
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          business_hours?: string
          company_name?: string
          email?: string
          id?: number
          intro?: string
          phone?: string
          socials?: Json
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_title: string
          company: string
          created_at: string
          id: string
          is_published: boolean
          quote: string
          rating: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_name: string
          author_title?: string
          company?: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote: string
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_title?: string
          company?: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote?: string
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actor_display_name: { Args: { p_user_id: string }; Returns: string }
      add_comment: {
        Args: { p_comment: string; p_complaint_id: string }
        Returns: {
          actor_user_id: string | null
          comment_text: string | null
          complaint_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          new_status: Database["public"]["Enums"]["complaint_status"] | null
          old_status: Database["public"]["Enums"]["complaint_status"] | null
        }
        SetofOptions: {
          from: "*"
          to: "complaint_event"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_lease_rent_change: {
        Args: { p_lease_id: string; p_rent_amount: number }
        Returns: {
          allotment_id: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          end_date: string
          id: string
          rent_amount: number
          start_date: string
        }
        SetofOptions: {
          from: "*"
          to: "lease"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assert_valid_date_range: {
        Args: { p_end: string; p_start: string }
        Returns: undefined
      }
      assign_complaint: {
        Args: { p_complaint_id: string; p_staff_id: string }
        Returns: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_complaint"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_invoice_number: { Args: { p_invoice_id: string }; Returns: string }
      authorize: { Args: { p_permission: string }; Returns: boolean }
      billing_report_rows: {
        Args: {
          p_building_id?: string
          p_office_owner_id?: string
          p_status?: Database["public"]["Enums"]["invoice_status"]
        }
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          building_id: string
          building_name: string
          created_at: string
          due_date: string
          electricity_amount: number
          electricity_note: string
          electricity_units: number
          invoice_id: string
          lease_id: string
          maintenance_amount: number
          maintenance_note: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          unit_code: string
        }[]
      }
      config: {
        Args: never
        Returns: {
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
      configure_company_billing: {
        Args: {
          p_bank_account_number: string
          p_bank_branch: string
          p_bank_ifsc: string
          p_bank_name: string
          p_company_address: string
          p_company_email: string
          p_company_gstin: string
          p_company_legal_name: string
          p_company_phone: string
          p_company_place_of_supply: string
          p_default_gst_rate_percent: number
          p_default_hsn_sac: string
          p_invoice_series_prefix: string
        }
        Returns: {
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
      configure_file_types: {
        Args: {
          p_file_extension: string
          p_file_type_accepted: boolean
          p_max_file_size_mb: number
          p_mime_type: string
        }
        Returns: {
          file_extension: string
          file_type_accepted: boolean
          id: string
          max_file_size_mb: number
          mime_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "file_storage_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      configure_notify_vault: {
        Args: { p_project_url: string; p_service_role_key: string }
        Returns: undefined
      }
      configure_payment_grace_period: {
        Args: { p_days: number }
        Returns: {
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
      configure_reminder_settings: {
        Args: { p_frequency_days: number; p_lead_time_days: number }
        Returns: {
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          company_address: string
          company_email: string
          company_gstin: string
          company_legal_name: string
          company_phone: string
          company_place_of_supply: string
          default_gst_rate_percent: number
          default_hsn_sac: string
          id: number
          invoice_series_prefix: string
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
      create_allotment: {
        Args: {
          p_billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          p_lease_end: string
          p_lease_start: string
          p_office_owner_id: string
          p_office_unit_id: string
          p_rent_amount: number
        }
        Returns: {
          created_at: string
          expiration_reason: string | null
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["allotment_status"]
          terminated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "allotment"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_building_expense: {
        Args: {
          p_amount: number
          p_building_id: string
          p_category: Database["public"]["Enums"]["expense_category"]
          p_description?: string
          p_expense_date: string
          p_reference_note?: string
          p_title: string
          p_vendor_name?: string
        }
        Returns: {
          amount: number
          building_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          reference_note: string | null
          title: string
          updated_at: string
          vendor_name: string | null
        }
        SetofOptions: {
          from: "*"
          to: "building_expense"
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
      create_owner_account: {
        Args: {
          p_auth_user_id: string
          p_contact_email: string
          p_name: string
          p_phone: string
        }
        Returns: Json
      }
      create_staff_account: {
        Args: { p_auth_user_id: string; p_full_name: string; p_phone: string }
        Returns: Json
      }
      current_office_owner_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role"]
      }
      deactivate_owner: { Args: { p_owner_id: string }; Returns: Json }
      deactivate_owner_internal: { Args: { p_owner_id: string }; Returns: Json }
      delete_building_expense: {
        Args: { p_expense_id: string }
        Returns: undefined
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
      financial_year_label: { Args: { p_date?: string }; Returns: string }
      get_allotment_history: {
        Args: { p_office_unit_id: string }
        Returns: {
          allotment_id: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          expiration_reason: string
          lease_end_date: string
          lease_start_date: string
          office_owner_id: string
          office_unit_id: string
          owner_contact_email: string
          owner_name: string
          rent_amount: number
          status: Database["public"]["Enums"]["allotment_status"]
          terminated_at: string
        }[]
      }
      get_billing_report: {
        Args: {
          p_building_id?: string
          p_office_owner_id?: string
          p_status?: Database["public"]["Enums"]["invoice_status"]
        }
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          building_id: string
          building_name: string
          created_at: string
          due_date: string
          electricity_amount: number
          electricity_note: string
          electricity_units: number
          invoice_id: string
          lease_id: string
          maintenance_amount: number
          maintenance_note: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          unit_code: string
        }[]
      }
      get_complaint_history: {
        Args: { p_complaint_id: string }
        Returns: {
          actor_name: string
          actor_role: Database["public"]["Enums"]["role"]
          actor_user_id: string
          comment_text: string
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          new_status: Database["public"]["Enums"]["complaint_status"]
          old_status: Database["public"]["Enums"]["complaint_status"]
        }[]
      }
      get_invoices_for_owner: {
        Args: never
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          building_id: string
          building_name: string
          created_at: string
          due_date: string
          electricity_amount: number
          electricity_note: string
          electricity_units: number
          invoice_id: string
          lease_id: string
          maintenance_amount: number
          maintenance_note: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          unit_code: string
        }[]
      }
      get_occupancy_dashboard: {
        Args: { p_building_id?: string }
        Returns: {
          occupancy_rate_percent: number
          occupied_count: number
          total_units: number
          vacant_count: number
        }[]
      }
      get_report_export: {
        Args: {
          p_building_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          building_id: string
          building_name: string
          due_date: string
          invoice_id: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          unit_code: string
        }[]
      }
      get_revenue_dashboard: {
        Args: {
          p_building_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          overdue_invoice_count: number
          range_end: string
          range_start: string
          total_outstanding_dues: number
          total_rent_collected: number
        }[]
      }
      handle_payment_callback: {
        Args: {
          p_amount: number
          p_gateway: Database["public"]["Enums"]["gateway_type"]
          p_gateway_timestamp?: string
          p_invoice_id: string
          p_outcome: string
          p_transaction_ref: string
        }
        Returns: Json
      }
      initiate_payment: {
        Args: {
          p_amount: number
          p_gateway: Database["public"]["Enums"]["gateway_type"]
          p_invoice_id: string
          p_transaction_ref?: string
        }
        Returns: {
          amount: number
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          gateway: Database["public"]["Enums"]["gateway_type"]
          id: string
          invoice_id: string
          office_owner_id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payment"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invoice_charge_total: {
        Args: {
          p_additional: number
          p_electricity: number
          p_maintenance: number
          p_rent: number
        }
        Returns: number
      }
      invoice_taxable_subtotal: {
        Args: {
          p_additional: number
          p_electricity: number
          p_maintenance: number
          p_rent: number
        }
        Returns: number
      }
      invoke_notify: { Args: never; Returns: undefined }
      is_account_locked: { Args: { p_email: string }; Returns: boolean }
      is_administrator: { Args: never; Returns: boolean }
      list_all_complaints: {
        Args: {
          p_category?: string
          p_created_from?: string
          p_created_to?: string
          p_office_owner_id?: string
          p_office_unit_id?: string
          p_status?: Database["public"]["Enums"]["complaint_status"]
        }
        Returns: {
          assigned_to: string
          building_name: string
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          status: Database["public"]["Enums"]["complaint_status"]
          unit_code: string
          updated_at: string
        }[]
      }
      list_building_expenses: {
        Args: {
          p_building_id?: string
          p_category?: Database["public"]["Enums"]["expense_category"]
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          amount: number
          building_id: string
          building_name: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          reference_note: string
          title: string
          updated_at: string
          vendor_name: string
        }[]
      }
      list_complaints_for_owner: {
        Args: never
        Returns: {
          assigned_to: string
          assigned_to_name: string
          building_name: string
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          owner_name: string
          status: Database["public"]["Enums"]["complaint_status"]
          unit_code: string
          updated_at: string
        }[]
      }
      list_office_units: {
        Args: {
          p_building_id?: string
          p_occupancy_status?: Database["public"]["Enums"]["occupancy_status"]
        }
        Returns: {
          base_rent_amount: number
          building_id: string
          building_name: string
          created_at: string
          floor: number
          id: string
          occupancy_status: Database["public"]["Enums"]["occupancy_status"]
          size_sqft: number
          unit_code: string
          updated_at: string
        }[]
      }
      list_staff: {
        Args: { p_include_inactive?: boolean }
        Returns: {
          created_at: string
          email: string
          full_name: string
          is_active: boolean
          phone: string
          user_id: string
        }[]
      }
      mark_overdue_job: { Args: { p_as_of?: string }; Returns: number }
      modules_for_current_user: {
        Args: never
        Returns: {
          accent: string
          allowed_roles: Database["public"]["Enums"]["role"][]
          base_path: string | null
          created_at: string
          features: Json
          icon: string
          id: string
          key: string
          listed_publicly: boolean
          marketing_slug: string | null
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["module_status"]
          summary: string
          tagline: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "app_modules"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      next_invoice_number: { Args: { p_date?: string }; Returns: string }
      occupancy_summary: {
        Args: { p_building_id?: string }
        Returns: {
          occupied_count: number
          total_count: number
          vacant_count: number
        }[]
      }
      owner_of_attachment: { Args: { p_object_key: string }; Returns: string }
      owner_of_document: { Args: { p_object_key: string }; Returns: string }
      owner_of_invoice: { Args: { p_object_key: string }; Returns: string }
      owner_of_receipt: { Args: { p_object_key: string }; Returns: string }
      pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          channel: Database["public"]["Enums"]["notification_channel"]
          id: string
          notification_type: string
          payload: Json
          recipient_email: string
          recipient_phone: string
          retry_count: number
          user_id: string
        }[]
      }
      query_audit_log: {
        Args: {
          p_action_type?: string
          p_actor_user_id?: string
          p_from_date?: string
          p_limit?: number
          p_offset?: number
          p_to_date?: string
        }
        Returns: {
          action_type: string
          actor_email: string
          actor_role: Database["public"]["Enums"]["role"]
          actor_user_id: string
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          new_value: string
          old_value: string
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
      record_notification_attempt: {
        Args: { p_id: string; p_success: boolean }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_permission: { Args: { p_permission: string }; Returns: undefined }
      revoke_user_auth_sessions: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      run_billing_cycle_job: {
        Args: { p_as_of?: string }
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          created_at: string
          document_ref: string | null
          due_date: string
          electricity_amount: number
          electricity_note: string | null
          electricity_units: number | null
          id: string
          invoice_number: string | null
          lease_id: string
          maintenance_amount: number
          maintenance_note: string | null
          office_owner_id: string
          office_unit_id: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
        }[]
        SetofOptions: {
          from: "*"
          to: "invoice"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      run_lease_expiry_job: { Args: { p_as_of?: string }; Returns: number }
      send_invoice_reminder: { Args: { p_invoice_id: string }; Returns: Json }
      send_reminder_job: { Args: { p_as_of?: string }; Returns: number }
      session_expired: { Args: never; Returns: boolean }
      set_invoice_electricity_charge: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_note?: string
          p_units?: number
        }
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          created_at: string
          document_ref: string | null
          due_date: string
          electricity_amount: number
          electricity_note: string | null
          electricity_units: number | null
          id: string
          invoice_number: string | null
          lease_id: string
          maintenance_amount: number
          maintenance_note: string | null
          office_owner_id: string
          office_unit_id: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "invoice"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_invoice_maintenance_charge: {
        Args: { p_amount: number; p_invoice_id: string; p_note?: string }
        Returns: {
          additional_charges: number
          billing_cycle_key: string
          billing_period_end: string
          billing_period_start: string
          created_at: string
          document_ref: string | null
          due_date: string
          electricity_amount: number
          electricity_note: string | null
          electricity_units: number | null
          id: string
          invoice_number: string | null
          lease_id: string
          maintenance_amount: number
          maintenance_note: string | null
          office_owner_id: string
          office_unit_id: string
          rent_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "invoice"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_staff_active: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: Json
      }
      submit_complaint: {
        Args: {
          p_category: string
          p_description: string
          p_office_unit_id: string
        }
        Returns: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_complaint"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_lead: {
        Args: {
          p_budget_range?: string
          p_company?: string
          p_email: string
          p_full_name: string
          p_message?: string
          p_module_key?: string
          p_page_path?: string
          p_phone?: string
          p_service_interest?: string
          p_source?: Database["public"]["Enums"]["lead_source"]
        }
        Returns: string
      }
      touch_session: { Args: never; Returns: boolean }
      transition_allotment: {
        Args: {
          p_allotment_id: string
          p_reason?: string
          p_target_status: Database["public"]["Enums"]["allotment_status"]
        }
        Returns: {
          created_at: string
          expiration_reason: string | null
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["allotment_status"]
          terminated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "allotment"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_building_expense: {
        Args: {
          p_amount?: number
          p_building_id?: string
          p_category?: Database["public"]["Enums"]["expense_category"]
          p_description?: string
          p_expense_date?: string
          p_expense_id: string
          p_reference_note?: string
          p_title?: string
          p_vendor_name?: string
        }
        Returns: {
          amount: number
          building_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          reference_note: string | null
          title: string
          updated_at: string
          vendor_name: string | null
        }
        SetofOptions: {
          from: "*"
          to: "building_expense"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_complaint_status: {
        Args: {
          p_complaint_id: string
          p_new_status: Database["public"]["Enums"]["complaint_status"]
        }
        Returns: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          office_owner_id: string
          office_unit_id: string
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "maintenance_complaint"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_lead_status: {
        Args: {
          p_assigned_to?: string
          p_lead_id: string
          p_staff_notes?: string
          p_status: Database["public"]["Enums"]["lead_status"]
        }
        Returns: {
          assigned_to: string | null
          budget_range: string
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          module_key: string | null
          page_path: string
          phone: string
          service_interest: string
          source: Database["public"]["Enums"]["lead_source"]
          staff_notes: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_lease_rent: {
        Args: { p_allotment_id: string; p_rent_amount: number }
        Returns: {
          allotment_id: string
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          end_date: string
          id: string
          rent_amount: number
          start_date: string
        }
        SetofOptions: {
          from: "*"
          to: "lease"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_profile: {
        Args: { p_full_name: string; p_phone: string }
        Returns: Json
      }
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
      update_owner_profile: {
        Args: { p_contact_email?: string; p_name?: string; p_phone?: string }
        Returns: {
          billing_address: string | null
          company_name: string | null
          contact_email: string
          created_at: string
          gstin: string | null
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["owner_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "office_owners"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      allotment_status: "ACTIVE" | "TERMINATED" | "EXPIRED"
      billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY"
      complaint_status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED"
      event_type: "STATUS_CHANGE" | "COMMENT"
      expense_category:
        | "CLEANING"
        | "GUARD_SALARY"
        | "DIESEL"
        | "ELECTRICITY"
        | "WATER"
        | "REPAIRS"
        | "MAINTENANCE"
        | "SUPPLIES"
        | "OTHER"
      gateway_type: "UPI" | "RAZORPAY"
      invoice_status: "DUE" | "PARTIALLY_PAID" | "PAID" | "OVERDUE"
      lead_source:
        | "CONTACT_FORM"
        | "QUOTE_REQUEST"
        | "PRODUCT_INQUIRY"
        | "SERVICE_INQUIRY"
        | "OTHER"
      lead_status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "CLOSED"
      module_status: "ACTIVE" | "BETA" | "COMING_SOON" | "DISABLED"
      notification_channel: "EMAIL" | "SMS" | "IN_APP"
      notification_status: "PENDING" | "SENT" | "FAILED"
      occupancy_status: "VACANT" | "OCCUPIED"
      owner_status: "ACTIVE" | "DEACTIVATED"
      payment_status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
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
      allotment_status: ["ACTIVE", "TERMINATED", "EXPIRED"],
      billing_cycle: ["MONTHLY", "QUARTERLY", "YEARLY"],
      complaint_status: ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"],
      event_type: ["STATUS_CHANGE", "COMMENT"],
      expense_category: [
        "CLEANING",
        "GUARD_SALARY",
        "DIESEL",
        "ELECTRICITY",
        "WATER",
        "REPAIRS",
        "MAINTENANCE",
        "SUPPLIES",
        "OTHER",
      ],
      gateway_type: ["UPI", "RAZORPAY"],
      invoice_status: ["DUE", "PARTIALLY_PAID", "PAID", "OVERDUE"],
      lead_source: [
        "CONTACT_FORM",
        "QUOTE_REQUEST",
        "PRODUCT_INQUIRY",
        "SERVICE_INQUIRY",
        "OTHER",
      ],
      lead_status: ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"],
      module_status: ["ACTIVE", "BETA", "COMING_SOON", "DISABLED"],
      notification_channel: ["EMAIL", "SMS", "IN_APP"],
      notification_status: ["PENDING", "SENT", "FAILED"],
      occupancy_status: ["VACANT", "OCCUPIED"],
      owner_status: ["ACTIVE", "DEACTIVATED"],
      payment_status: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      role: ["ADMINISTRATOR", "MAINTENANCE_STAFF", "OFFICE_OWNER"],
    },
  },
} as const
