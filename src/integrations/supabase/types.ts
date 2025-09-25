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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          created_at: string
          doctor_id: string | null
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          created_at?: string
          doctor_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      clearance_records: {
        Row: {
          age: number
          approved_at: string | null
          approved_by: string | null
          clearance_reason: string | null
          clearance_status: string
          college_department:
            | Database["public"]["Enums"]["college_department"]
            | null
          created_at: string | null
          faculty: string | null
          full_name: string
          gender: string
          id: string
          medical_record_id: string | null
          patient_id: string
          patient_name: string
          person_type: string
          position: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          age: number
          approved_at?: string | null
          approved_by?: string | null
          clearance_reason?: string | null
          clearance_status?: string
          college_department?:
            | Database["public"]["Enums"]["college_department"]
            | null
          created_at?: string | null
          faculty?: string | null
          full_name: string
          gender: string
          id?: string
          medical_record_id?: string | null
          patient_id: string
          patient_name: string
          person_type: string
          position?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          age?: number
          approved_at?: string | null
          approved_by?: string | null
          clearance_reason?: string | null
          clearance_status?: string
          college_department?:
            | Database["public"]["Enums"]["college_department"]
            | null
          created_at?: string | null
          faculty?: string | null
          full_name?: string
          gender?: string
          id?: string
          medical_record_id?: string | null
          patient_id?: string
          patient_name?: string
          person_type?: string
          position?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clearance_records_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          created_at: string
          doctor_name: string | null
          id: string
          issue_date: string
          medical_record_id: string
          patient_name: string
          reason: string
          recommendations: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          certificate_number?: string
          certificate_type?: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          issue_date?: string
          medical_record_id: string
          patient_name: string
          reason: string
          recommendations?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          created_at?: string
          doctor_name?: string | null
          id?: string
          issue_date?: string
          medical_record_id?: string
          patient_name?: string
          reason?: string
          recommendations?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          age: number | null
          created_at: string | null
          date: string | null
          diagnosis: string | null
          doctor_notes: string | null
          faculty: string | null
          full_name: string | null
          gender: string | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          person_type: string | null
          position: string | null
          recommended_actions: string[] | null
          severity: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          date?: string | null
          diagnosis?: string | null
          doctor_notes?: string | null
          faculty?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          person_type?: string | null
          position?: string | null
          recommended_actions?: string[] | null
          severity?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          date?: string | null
          diagnosis?: string | null
          doctor_notes?: string | null
          faculty?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          person_type?: string | null
          position?: string | null
          recommended_actions?: string[] | null
          severity?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_prescriptions: {
        Row: {
          created_at: string
          dosage: string
          duration_days: number | null
          end_date: string | null
          frequency: string
          id: string
          instructions: string | null
          medical_record_id: string | null
          medication_name: string
          patient_id: string
          prescribed_by: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration_days?: number | null
          end_date?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medication_name: string
          patient_id: string
          prescribed_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration_days?: number | null
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medication_name?: string
          patient_id?: string
          prescribed_by?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_allergies: {
        Row: {
          allergen: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          onset_date: string | null
          patient_id: string
          reaction_description: string | null
          severity: string
          updated_at: string
        }
        Insert: {
          allergen: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          reaction_description?: string | null
          severity?: string
          updated_at?: string
        }
        Update: {
          allergen?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          reaction_description?: string | null
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          patient_id: string
          staff_user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          patient_id: string
          staff_user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          patient_id?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vitals: {
        Row: {
          blood_glucose: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          heart_rate: number | null
          height_cm: number | null
          id: string
          medical_record_id: string | null
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          temperature_celsius: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature_celsius?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          blood_glucose?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature_celsius?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number
          college_department:
            | Database["public"]["Enums"]["college_department"]
            | null
          condition: string | null
          created_at: string | null
          gender: string
          id: string
          last_visit: string | null
          medical_history: string[] | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          age: number
          college_department?:
            | Database["public"]["Enums"]["college_department"]
            | null
          condition?: string | null
          created_at?: string | null
          gender: string
          id?: string
          last_visit?: string | null
          medical_history?: string[] | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number
          college_department?:
            | Database["public"]["Enums"]["college_department"]
            | null
          condition?: string | null
          created_at?: string | null
          gender?: string
          id?: string
          last_visit?: string | null
          medical_history?: string[] | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      case_analytics_by_department: {
        Row: {
          case_count: number | null
          college_department:
            | Database["public"]["Enums"]["college_department"]
            | null
          diagnosis: string | null
          month: string | null
        }
        Relationships: []
      }
      clearance_analytics_by_department: {
        Row: {
          clearance_count: number | null
          clearance_status: string | null
          college_department:
            | Database["public"]["Enums"]["college_department"]
            | null
          month: string | null
          person_type: string | null
        }
        Relationships: []
      }
      monthly_visit_analytics: {
        Row: {
          college_department:
            | Database["public"]["Enums"]["college_department"]
            | null
          critical_cases: number | null
          mild_cases: number | null
          moderate_cases: number | null
          month: string | null
          total_visits: number | null
          unique_patients: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      user_can_access_patient: {
        Args: { patient_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["staff_role"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      college_department: "CED" | "CCS" | "CCJ" | "CHS" | "CAS" | "CBA"
      staff_role: "admin" | "doctor" | "nurse" | "receptionist" | "technician"
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
      college_department: ["CED", "CCS", "CCJ", "CHS", "CAS", "CBA"],
      staff_role: ["admin", "doctor", "nurse", "receptionist", "technician"],
    },
  },
} as const
