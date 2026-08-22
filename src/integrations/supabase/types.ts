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
      occurrences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          industry_id: string
          status: string | null
          store_id: string
          type: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry_id: string
          status?: string | null
          store_id: string
          type: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry_id?: string
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
          status: Database["public"]["Enums"]["user_status"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          industry_id?: string | null
          last_access?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry_id?: string | null
          last_access?: string | null
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
        ]
      }
      route_stops: {
        Row: {
          created_at: string | null
          day_of_week: number
          frequency: string | null
          id: string
          route_id: string
          store_id: string
          visit_order: number
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          frequency?: string | null
          id?: string
          route_id: string
          store_id: string
          visit_order: number
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          frequency?: string | null
          id?: string
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
      routes: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          promoter_id: string
          valid_from: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          promoter_id: string
          valid_from?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          promoter_id?: string
          valid_from?: string | null
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
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state: string | null
        }
        Insert: {
          active?: boolean | null
          address: string
          cep?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string
          cep?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string | null
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
          completed_at: string | null
          created_at: string | null
          id: string
          industry_id: string
          latitude: number | null
          longitude: number | null
          observation: string | null
          promoter_id: string
          scheduled_date: string
          status: Database["public"]["Enums"]["visit_status"] | null
          store_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          industry_id: string
          latitude?: number | null
          longitude?: number | null
          observation?: string | null
          promoter_id: string
          scheduled_date: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          store_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string
          latitude?: number | null
          longitude?: number | null
          observation?: string | null
          promoter_id?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["visit_status"] | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "promoter" | "industry"
      user_status: "pending" | "active" | "blocked"
      visit_status: "pending" | "submitted" | "approved" | "rejected"
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
      user_status: ["pending", "active", "blocked"],
      visit_status: ["pending", "submitted", "approved", "rejected"],
    },
  },
} as const
