
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_usage": {
                  Row: {
                    "created_at": string,"endpoint": string,"id": number,"input_tokens": number | null,"model": string,"output_tokens": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"endpoint": string,"id"?: never,"input_tokens"?: number | null,"model": string,"output_tokens"?: number | null,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"endpoint"?: string,"id"?: never,"input_tokens"?: number | null,"model"?: string,"output_tokens"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"goals": {
                  Row: {
                    "active": boolean,"carbs_g": number,"created_at": string,"fat_g": number,"id": string,"is_override": boolean,"kcal": number,"protein_g": number,"start_date": string,"type": Database["public"]['Enums']["goal_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"carbs_g": number,"created_at"?: string,"fat_g": number,"id"?: string,"is_override"?: boolean,"kcal": number,"protein_g": number,"start_date"?: string,"type": Database["public"]['Enums']["goal_type"],"user_id"?: string
                  }
                  Update: {
                    "active"?: boolean,"carbs_g"?: number,"created_at"?: string,"fat_g"?: number,"id"?: string,"is_override"?: boolean,"kcal"?: number,"protein_g"?: number,"start_date"?: string,"type"?: Database["public"]['Enums']["goal_type"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"meal_items": {
                  Row: {
                    "carbs_g": number,"created_at": string,"fat_g": number,"fiber_g": number | null,"id": string,"kcal": number,"meal_id": string,"name": string,"protein_g": number,"quantity": number,"unit": string,"usda_fdc_id": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "carbs_g"?: number,"created_at"?: string,"fat_g"?: number,"fiber_g"?: number | null,"id"?: string,"kcal"?: number,"meal_id": string,"name": string,"protein_g"?: number,"quantity"?: number,"unit"?: string,"usda_fdc_id"?: number | null,"user_id"?: string
                  }
                  Update: {
                    "carbs_g"?: number,"created_at"?: string,"fat_g"?: number,"fiber_g"?: number | null,"id"?: string,"kcal"?: number,"meal_id"?: string,"name"?: string,"protein_g"?: number,"quantity"?: number,"unit"?: string,"usda_fdc_id"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_items_meal_id_fkey"
      columns: ["meal_id"]
isOneToOne: false
      referencedRelation: "meals"
      referencedColumns: ["id"]
    }
                  ]
                },"meals": {
                  Row: {
                    "ai_confidence": number | null,"created_at": string,"eaten_at": string,"eaten_on": string,"id": string,"meal_type": Database["public"]['Enums']["meal_type"],"name": string,"notes": string | null,"photo_path": string | null,"source": Database["public"]['Enums']["meal_source"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_confidence"?: number | null,"created_at"?: string,"eaten_at"?: string,"eaten_on"?: string,"id"?: string,"meal_type": Database["public"]['Enums']["meal_type"],"name": string,"notes"?: string | null,"photo_path"?: string | null,"source"?: Database["public"]['Enums']["meal_source"],"user_id"?: string
                  }
                  Update: {
                    "ai_confidence"?: number | null,"created_at"?: string,"eaten_at"?: string,"eaten_on"?: string,"id"?: string,"meal_type"?: Database["public"]['Enums']["meal_type"],"name"?: string,"notes"?: string | null,"photo_path"?: string | null,"source"?: Database["public"]['Enums']["meal_source"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "activity_level": Database["public"]['Enums']["activity_level"],"birth_date": string | null,"created_at": string,"height_cm": number | null,"sex": Database["public"]['Enums']["sex"] | null,"timezone": string,"units": Database["public"]['Enums']["unit_system"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_level"?: Database["public"]['Enums']["activity_level"],"birth_date"?: string | null,"created_at"?: string,"height_cm"?: number | null,"sex"?: Database["public"]['Enums']["sex"] | null,"timezone"?: string,"units"?: Database["public"]['Enums']["unit_system"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "activity_level"?: Database["public"]['Enums']["activity_level"],"birth_date"?: string | null,"created_at"?: string,"height_cm"?: number | null,"sex"?: Database["public"]['Enums']["sex"] | null,"timezone"?: string,"units"?: Database["public"]['Enums']["unit_system"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saved_foods": {
                  Row: {
                    "carbs_g": number,"created_at": string,"fat_g": number,"fiber_g": number | null,"id": string,"kcal": number,"last_used_at": string | null,"name": string,"protein_g": number,"serving": string,"times_used": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "carbs_g"?: number,"created_at"?: string,"fat_g"?: number,"fiber_g"?: number | null,"id"?: string,"kcal"?: number,"last_used_at"?: string | null,"name": string,"protein_g"?: number,"serving"?: string,"times_used"?: number,"user_id"?: string
                  }
                  Update: {
                    "carbs_g"?: number,"created_at"?: string,"fat_g"?: number,"fiber_g"?: number | null,"id"?: string,"kcal"?: number,"last_used_at"?: string | null,"name"?: string,"protein_g"?: number,"serving"?: string,"times_used"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"weigh_ins": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"user_id": string,"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date"?: string,"id"?: string,"user_id"?: string,"weight_kg": number
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"user_id"?: string,"weight_kg"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "daily_totals": {
                  Row: {
                    "carbs_g": number | null,"day": string,"fat_g": number | null,"fiber_g": number | null,"kcal": number | null,"meals": number | null,"protein_g": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "activity_level": "sedentary"|"light"|"moderate"|"active"|"very_active","goal_type": "cut"|"fat_loss"|"maintain"|"lean_bulk"|"muscle_gain","meal_source": "manual"|"usda"|"text_ai"|"photo_ai"|"saved","meal_type": "breakfast"|"lunch"|"dinner"|"snack","sex": "male"|"female","unit_system": "imperial"|"metric"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "activity_level": ["sedentary", "light", "moderate", "active", "very_active"],"goal_type": ["cut", "fat_loss", "maintain", "lean_bulk", "muscle_gain"],"meal_source": ["manual", "usda", "text_ai", "photo_ai", "saved"],"meal_type": ["breakfast", "lunch", "dinner", "snack"],"sex": ["male", "female"],"unit_system": ["imperial", "metric"]
          }
        }
} as const
