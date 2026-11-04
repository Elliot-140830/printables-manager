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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      allocations: {
        Row: {
          created_at: string
          id: string
          name: string
          percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          percent?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          percent?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      filaments: {
        Row: {
          brand: string
          color: string
          created_at: string
          id: string
          pla_type: string
          remaining_grams: number
          spool_weight: number
          warning_threshold: number
        }
        Insert: {
          brand?: string
          color: string
          created_at?: string
          id?: string
          pla_type?: string
          remaining_grams?: number
          spool_weight?: number
          warning_threshold?: number
        }
        Update: {
          brand?: string
          color?: string
          created_at?: string
          id?: string
          pla_type?: string
          remaining_grams?: number
          spool_weight?: number
          warning_threshold?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string
          grams: number
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          color: string
          grams?: number
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          color?: string
          grams?: number
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          delivery_date: string | null
          filament_deducted: boolean
          id: string
          notes: string | null
          order_number: number
          paid: boolean
          payment_method: Database["public"]["Enums"]["payment_method"]
          priority: Database["public"]["Enums"]["order_priority"]
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          customer_name: string
          delivery_date?: string | null
          filament_deducted?: boolean
          id?: string
          notes?: string | null
          order_number?: number
          paid?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"]
          priority?: Database["public"]["Enums"]["order_priority"]
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          customer_name?: string
          delivery_date?: string | null
          filament_deducted?: boolean
          id?: string
          notes?: string | null
          order_number?: number
          paid?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"]
          priority?: Database["public"]["Enums"]["order_priority"]
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          default_color: string
          description: string | null
          grams: number
          id: string
          image_path: string | null
          material: string
          name: string
          price_override: number | null
          print_minutes: number
          stl_path: string | null
        }
        Insert: {
          created_at?: string
          default_color?: string
          description?: string | null
          grams?: number
          id?: string
          image_path?: string | null
          material?: string
          name: string
          price_override?: number | null
          print_minutes?: number
          stl_path?: string | null
        }
        Update: {
          created_at?: string
          default_color?: string
          description?: string | null
          grams?: number
          id?: string
          image_path?: string | null
          material?: string
          name?: string
          price_override?: number | null
          print_minutes?: number
          stl_path?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          notify_deliveries: boolean
          notify_low_filament: boolean
          notify_production: boolean
          notify_unpaid: boolean
          price_per_gram: number
          price_per_minute: number
          tax_percent: number
        }
        Insert: {
          id?: number
          notify_deliveries?: boolean
          notify_low_filament?: boolean
          notify_production?: boolean
          notify_unpaid?: boolean
          price_per_gram?: number
          price_per_minute?: number
          tax_percent?: number
        }
        Update: {
          id?: number
          notify_deliveries?: boolean
          notify_low_filament?: boolean
          notify_production?: boolean
          notify_unpaid?: boolean
          price_per_gram?: number
          price_per_minute?: number
          tax_percent?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_priority: "lag" | "normal" | "hog"
      order_status:
        | "vantar"
        | "planerad"
        | "printas"
        | "efterarbete"
        | "klar"
        | "levererad"
      payment_method: "swish" | "kontant"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      order_priority: ["lag", "normal", "hog"],
      order_status: [
        "vantar",
        "planerad",
        "printas",
        "efterarbete",
        "klar",
        "levererad",
      ],
      payment_method: ["swish", "kontant"],
    },
  },
} as const
