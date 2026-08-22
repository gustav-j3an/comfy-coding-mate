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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      automation_settings: {
        Row: {
          active_events: string[] | null
          authorized_domain: string | null
          created_at: string
          id: string
          is_active: boolean
          last_communication_at: string | null
          last_test_result: string | null
          retention_days: number
          updated_at: string
        }
        Insert: {
          active_events?: string[] | null
          authorized_domain?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_communication_at?: string | null
          last_test_result?: string | null
          retention_days?: number
          updated_at?: string
        }
        Update: {
          active_events?: string[] | null
          authorized_domain?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_communication_at?: string | null
          last_test_result?: string | null
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          industry_id: string
          month: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          industry_id: string
          month: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          industry_id?: string
          month?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_items: {
        Row: {
          approved_at: string
          billing_id: string
          created_at: string
          id: string
          promoter_name: string
          store_name: string
          visit_date: string
          visit_id: string
        }
        Insert: {
          approved_at: string
          billing_id: string
          created_at?: string
          id?: string
          promoter_name: string
          store_name: string
          visit_date: string
          visit_id: string
        }
        Update: {
          approved_at?: string
          billing_id?: string
          created_at?: string
          id?: string
          promoter_name?: string
          store_name?: string
          visit_date?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      billings: {
        Row: {
          adjustment_reason: string | null
          admin_id: string | null
          approved_visits_count: number
          attachment_url: string | null
          billing_number: string
          cancellation_reason: string | null
          competence_month: number
          competence_year: number
          contract_id: string
          created_at: string
          discount: number
          due_date: string
          id: string
          increase: number
          industry_id: string
          issued_at: string | null
          payment_link: string | null
          status: Database["public"]["Enums"]["billing_status"]
          subtotal: number
          total_value: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          adjustment_reason?: string | null
          admin_id?: string | null
          approved_visits_count?: number
          attachment_url?: string | null
          billing_number: string
          cancellation_reason?: string | null
          competence_month: number
          competence_year: number
          contract_id: string
          created_at?: string
          discount?: number
          due_date: string
          id?: string
          increase?: number
          industry_id: string
          issued_at?: string | null
          payment_link?: string | null
          status?: Database["public"]["Enums"]["billing_status"]
          subtotal?: number
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          adjustment_reason?: string | null
          admin_id?: string | null
          approved_visits_count?: number
          attachment_url?: string | null
          billing_number?: string
          cancellation_reason?: string | null
          competence_month?: number
          competence_year?: number
          contract_id?: string
          created_at?: string
          discount?: number
          due_date?: string
          id?: string
          increase?: number
          industry_id?: string
          issued_at?: string | null
          payment_link?: string | null
          status?: Database["public"]["Enums"]["billing_status"]
          subtotal?: number
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_audit: {
        Row: {
          admin_id: string | null
          confirmation_text: string | null
          execution_date: string | null
          id: string
          records_count: Json | null
          result: string | null
        }
        Insert: {
          admin_id?: string | null
          confirmation_text?: string | null
          execution_date?: string | null
          id?: string
          records_count?: Json | null
          result?: string | null
        }
        Update: {
          admin_id?: string | null
          confirmation_text?: string | null
          execution_date?: string | null
          id?: string
          records_count?: Json | null
          result?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          billing_day: number
          billing_details: string | null
          commercial_responsible: string | null
          contract_number: string
          created_at: string
          end_date: string | null
          id: string
          industry_id: string
          min_monthly_visits: number | null
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          value_per_visit: number
        }
        Insert: {
          billing_day?: number
          billing_details?: string | null
          commercial_responsible?: string | null
          contract_number: string
          created_at?: string
          end_date?: string | null
          id?: string
          industry_id: string
          min_monthly_visits?: number | null
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          value_per_visit?: number
        }
        Update: {
          billing_day?: number
          billing_details?: string | null
          commercial_responsible?: string | null
          contract_number?: string
          created_at?: string
          end_date?: string | null
          id?: string
          industry_id?: string
          min_monthly_visits?: number | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          value_per_visit?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      export_tasks: {
        Row: {
          created_at: string
          download_count: number
          error_message: string | null
          expires_at: string | null
          file_path: string | null
          filters: Json
          format: Database["public"]["Enums"]["export_format"]
          id: string
          industry_id: string | null
          last_downloaded_at: string | null
          status: Database["public"]["Enums"]["export_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          error_message?: string | null
          expires_at?: string | null
          file_path?: string | null
          filters?: Json
          format: Database["public"]["Enums"]["export_format"]
          id?: string
          industry_id?: string | null
          last_downloaded_at?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          error_message?: string | null
          expires_at?: string | null
          file_path?: string | null
          filters?: Json
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          industry_id?: string | null
          last_downloaded_at?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_tasks_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      extraordinary_route_stops: {
        Row: {
          created_at: string | null
          extraordinary_route_id: string
          id: string
          observation: string | null
          store_id: string
          visit_order: number
        }
        Insert: {
          created_at?: string | null
          extraordinary_route_id: string
          id?: string
          observation?: string | null
          store_id: string
          visit_order: number
        }
        Update: {
          created_at?: string | null
          extraordinary_route_id?: string
          id?: string
          observation?: string | null
          store_id?: string
          visit_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "extraordinary_route_stops_extraordinary_route_id_fkey"
            columns: ["extraordinary_route_id"]
            isOneToOne: false
            referencedRelation: "extraordinary_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraordinary_route_stops_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      extraordinary_routes: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          name: string
          promoter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          name: string
          promoter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          name?: string
          promoter_id?: string
          status?: string | null
        }
        Relationships: []
      }
      extraordinary_stop_tasks: {
        Row: {
          extraordinary_stop_id: string
          id: string
          industry_id: string
        }
        Insert: {
          extraordinary_stop_id: string
          id?: string
          industry_id: string
        }
        Update: {
          extraordinary_stop_id?: string
          id?: string
          industry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraordinary_stop_tasks_extraordinary_stop_id_fkey"
            columns: ["extraordinary_stop_id"]
            isOneToOne: false
            referencedRelation: "extraordinary_route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraordinary_stop_tasks_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          active: boolean | null
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          active?: boolean | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          active?: boolean | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          industry_id: string
          month: number
          occurrences_by_type: Json | null
          occurrences_count: number | null
          published_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          stores_planned: number | null
          stores_served: number | null
          total_visits_approved: number | null
          total_visits_pending: number | null
          total_visits_planned: number | null
          total_visits_rejected: number | null
          total_visits_sent: number | null
          updated_at: string
          year: number
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          industry_id: string
          month: number
          occurrences_by_type?: Json | null
          occurrences_count?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          stores_planned?: number | null
          stores_served?: number | null
          total_visits_approved?: number | null
          total_visits_pending?: number | null
          total_visits_planned?: number | null
          total_visits_rejected?: number | null
          total_visits_sent?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          industry_id?: string
          month?: number
          occurrences_by_type?: Json | null
          occurrences_count?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          stores_planned?: number | null
          stores_served?: number | null
          total_visits_approved?: number | null
          total_visits_pending?: number | null
          total_visits_planned?: number | null
          total_visits_rejected?: number | null
          total_visits_sent?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          batch: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          industry_id: string
          product_name: string | null
          quantity: number | null
          severity: string | null
          sku: string | null
          status: string | null
          store_id: string
          type: string
          visit_id: string | null
        }
        Insert: {
          batch?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          industry_id: string
          product_name?: string | null
          quantity?: number | null
          severity?: string | null
          sku?: string | null
          status?: string | null
          store_id: string
          type: string
          visit_id?: string | null
        }
        Update: {
          batch?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          industry_id?: string
          product_name?: string | null
          quantity?: number | null
          severity?: string | null
          sku?: string | null
          status?: string | null
          store_id?: string
          type?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          industry_id: string | null
          last_access: string | null
          promoter_id: string | null
          status: Database["public"]["Enums"]["user_status"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          industry_id?: string | null
          last_access?: string | null
          promoter_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry_id?: string | null
          last_access?: string | null
          promoter_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          observation: string | null
          phone: string | null
          region: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          observation?: string | null
          phone?: string | null
          region?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          observation?: string | null
          phone?: string | null
          region?: string | null
        }
        Relationships: []
      }
      retention_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          data_snapshot: Json | null
          id: string
          industry_id: string | null
          processed_at: string | null
          scheduled_for: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          industry_id?: string | null
          processed_at?: string | null
          scheduled_for: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          industry_id?: string | null
          processed_at?: string | null
          scheduled_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_alerts_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          biweekly_start_date: string | null
          created_at: string | null
          day_of_week: number
          frequency: string | null
          id: string
          observation: string | null
          route_id: string
          store_id: string
          visit_order: number
        }
        Insert: {
          biweekly_start_date?: string | null
          created_at?: string | null
          day_of_week: number
          frequency?: string | null
          id?: string
          observation?: string | null
          route_id: string
          store_id: string
          visit_order: number
        }
        Update: {
          biweekly_start_date?: string | null
          created_at?: string | null
          day_of_week?: number
          frequency?: string | null
          id?: string
          observation?: string | null
          route_id?: string
          store_id?: string
          visit_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      route_versions: {
        Row: {
          changes_summary: string | null
          created_at: string | null
          created_by: string | null
          id: string
          route_id: string
          version: number
        }
        Insert: {
          changes_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          route_id: string
          version: number
        }
        Update: {
          changes_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          route_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_versions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          promoter_id: string
          status: Database["public"]["Enums"]["route_status"] | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          promoter_id: string
          status?: Database["public"]["Enums"]["route_status"] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          promoter_id?: string
          status?: Database["public"]["Enums"]["route_status"] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Relationships: []
      }
      stop_tasks: {
        Row: {
          created_at: string | null
          id: string
          industry_id: string
          stop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_id: string
          stop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_id?: string
          stop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_tasks_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_tasks_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean | null
          address: string
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          number: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          zip_code?: string | null
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
      visit_audits: {
        Row: {
          auditor_id: string
          created_at: string | null
          decision: Database["public"]["Enums"]["visit_status"]
          id: string
          reason: string | null
          visit_id: string
        }
        Insert: {
          auditor_id: string
          created_at?: string | null
          decision: Database["public"]["Enums"]["visit_status"]
          id?: string
          reason?: string | null
          visit_id: string
        }
        Update: {
          auditor_id?: string
          created_at?: string | null
          decision?: Database["public"]["Enums"]["visit_status"]
          id?: string
          reason?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_audits_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_evidence: {
        Row: {
          created_at: string | null
          evidence_type: string
          file_path: string
          file_type: string
          id: string
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_type: string
          file_path: string
          file_type: string
          id?: string
          visit_id: string
        }
        Update: {
          created_at?: string | null
          evidence_type?: string
          file_path?: string
          file_type?: string
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_evidence_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          checkin_at: string | null
          checkout_at: string | null
          completed_at: string | null
          created_at: string | null
          execution_latitude: number | null
          execution_longitude: number | null
          executor_id: string | null
          id: string
          industry_id: string
          latitude: number | null
          longitude: number | null
          observation: string | null
          promoter_id: string
          rejection_reason: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["visit_status"] | null
          store_id: string
        }
        Insert: {
          checkin_at?: string | null
          checkout_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          execution_latitude?: number | null
          execution_longitude?: number | null
          executor_id?: string | null
          id?: string
          industry_id: string
          latitude?: number | null
          longitude?: number | null
          observation?: string | null
          promoter_id: string
          rejection_reason?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          store_id: string
        }
        Update: {
          checkin_at?: string | null
          checkout_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          execution_latitude?: number | null
          execution_longitude?: number | null
          executor_id?: string | null
          id?: string
          industry_id?: string
          latitude?: number | null
          longitude?: number | null
          observation?: string | null
          promoter_id?: string
          rejection_reason?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_executor_id_fkey"
            columns: ["executor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          status_code?: number | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_evidence: {
        Args: { evidence_id: string; user_id: string }
        Returns: boolean
      }
      can_delete_industry: { Args: { i_id: string }; Returns: boolean }
      can_delete_promoter: { Args: { p_id: string }; Returns: boolean }
      can_delete_store: { Args: { s_id: string }; Returns: boolean }
      cleanup_expired_data: { Args: never; Returns: undefined }
      cleanup_expired_exports: { Args: never; Returns: undefined }
      delete_user_safely: { Args: { _user_id: string }; Returns: undefined }
      get_admin_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_export_download: {
        Args: { task_id: string }
        Returns: undefined
      }
      is_last_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "promoter" | "industry"
      billing_status:
        | "draft"
        | "issued"
        | "sent"
        | "paid"
        | "overdue"
        | "cancelled"
      contract_status: "draft" | "active" | "terminated"
      export_format: "xlsx" | "csv" | "json" | "pdf" | "zip"
      export_status:
        | "solicitada"
        | "processando"
        | "pronta"
        | "falhou"
        | "expirada"
      report_status:
        | "em_montagem"
        | "pronto_revisao"
        | "publicado"
        | "arquivado"
      route_status: "draft" | "published" | "archived"
      user_status: "pending" | "active" | "blocked"
      visit_status:
        | "pending"
        | "submitted"
        | "approved"
        | "rejected"
        | "planned"
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
      app_role: ["admin", "promoter", "industry"],
      billing_status: [
        "draft",
        "issued",
        "sent",
        "paid",
        "overdue",
        "cancelled",
      ],
      contract_status: ["draft", "active", "terminated"],
      export_format: ["xlsx", "csv", "json", "pdf", "zip"],
      export_status: [
        "solicitada",
        "processando",
        "pronta",
        "falhou",
        "expirada",
      ],
      report_status: [
        "em_montagem",
        "pronto_revisao",
        "publicado",
        "arquivado",
      ],
      route_status: ["draft", "published", "archived"],
      user_status: ["pending", "active", "blocked"],
      visit_status: ["pending", "submitted", "approved", "rejected", "planned"],
    },
  },
} as const
