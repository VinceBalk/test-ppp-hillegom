export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_super_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_super_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_super_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      courts: {
        Row: {
          background_color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: unknown | null
          success: boolean | null
        }
        Insert: {
          attempt_time?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
        }
        Update: {
          attempt_time?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
        }
        Relationships: []
      }
      match_specials: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          match_id: string | null
          player_id: string | null
          special_type_id: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          special_type_id?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          player_id?: string | null
          special_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_specials_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_specials_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_specials_special_type_id_fkey"
            columns: ["special_type_id"]
            isOneToOne: false
            referencedRelation: "special_types"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court_id: string | null
          court_number: string | null
          created_at: string | null
          id: string
          match_date: string | null
          notes: string | null
          player1_id: string | null
          player1_score: number | null
          player2_id: string | null
          player2_score: number | null
          round_number: number | null
          status: string | null
          team1_player1_id: string | null
          team1_player2_id: string | null
          team1_score: number | null
          team2_player1_id: string | null
          team2_player2_id: string | null
          team2_score: number | null
          tournament_id: string | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          court_id?: string | null
          court_number?: string | null
          created_at?: string | null
          id?: string
          match_date?: string | null
          notes?: string | null
          player1_id?: string | null
          player1_score?: number | null
          player2_id?: string | null
          player2_score?: number | null
          round_number?: number | null
          status?: string | null
          team1_player1_id?: string | null
          team1_player2_id?: string | null
          team1_score?: number | null
          team2_player1_id?: string | null
          team2_player2_id?: string | null
          team2_score?: number | null
          tournament_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          court_id?: string | null
          court_number?: string | null
          created_at?: string | null
          id?: string
          match_date?: string | null
          notes?: string | null
          player1_id?: string | null
          player1_score?: number | null
          player2_id?: string | null
          player2_score?: number | null
          round_number?: number | null
          status?: string | null
          team1_player1_id?: string | null
          team1_player2_id?: string | null
          team1_score?: number | null
          team2_player1_id?: string | null
          team2_player2_id?: string | null
          team2_score?: number | null
          tournament_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_player1_id_fkey"
            columns: ["team1_player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_player2_id_fkey"
            columns: ["team1_player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_player1_id_fkey"
            columns: ["team2_player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_player2_id_fkey"
            columns: ["team2_player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_movements: {
        Row: {
          created_at: string | null
          from_row: string | null
          id: string
          player_id: string | null
          status: string | null
          to_row: string | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_row?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          to_row?: string | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_row?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          to_row?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_movements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_movements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tournament_stats: {
        Row: {
          created_at: string | null
          games_lost: number | null
          games_won: number | null
          id: string
          player_id: string | null
          round_number: number
          tiebreaker_specials_count: number | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          games_lost?: number | null
          games_won?: number | null
          id?: string
          player_id?: string | null
          round_number: number
          tiebreaker_specials_count?: number | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          games_lost?: number | null
          games_won?: number | null
          id?: string
          player_id?: string | null
          round_number?: number
          tiebreaker_specials_count?: number | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_tournament_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tournament_stats_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avg_games_per_tournament: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          group_side: string | null
          id: string
          name: string
          phone: string | null
          position: number | null
          rank_change: number | null
          ranking_score: number | null
          row_side: string | null
          specials: Json | null
          total_games_won: number | null
          total_tournaments: number | null
          updated_at: string | null
        }
        Insert: {
          avg_games_per_tournament?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          group_side?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: number | null
          rank_change?: number | null
          ranking_score?: number | null
          row_side?: string | null
          specials?: Json | null
          total_games_won?: number | null
          total_tournaments?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_games_per_tournament?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          group_side?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: number | null
          rank_change?: number | null
          ranking_score?: number | null
          row_side?: string | null
          specials?: Json | null
          total_games_won?: number | null
          total_tournaments?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          event_type: Database["public"]["Enums"]["security_event_type"] | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          event_type?: Database["public"]["Enums"]["security_event_type"] | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          event_type?: Database["public"]["Enums"]["security_event_type"] | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      special_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_tiebreaker: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_tiebreaker?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_tiebreaker?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      specials: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_fee: number | null
          event_date: string
          id: string
          location: string | null
          max_participants: number | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_fee?: number | null
          event_date: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_fee?: number | null
          event_date?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_players: {
        Row: {
          active: boolean | null
          group: string
          id: string
          player_id: string | null
          registration_date: string | null
          tournament_id: string | null
        }
        Insert: {
          active?: boolean | null
          group: string
          id?: string
          player_id?: string | null
          registration_date?: string | null
          tournament_id?: string | null
        }
        Update: {
          active?: boolean | null
          group?: string
          id?: string
          player_id?: string | null
          registration_date?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_rounds: {
        Row: {
          created_at: string | null
          id: string
          is_manually_adjusted: boolean | null
          round_number: number
          status: string | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_manually_adjusted?: boolean | null
          round_number: number
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_manually_adjusted?: boolean | null
          round_number?: number
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_round: number | null
          description: string | null
          end_date: string
          entry_fee: number | null
          id: string
          max_players: number | null
          name: string
          round_1_generated: boolean | null
          round_2_generated: boolean | null
          round_3_generated: boolean | null
          start_date: string
          status: string | null
          total_rounds: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_round?: number | null
          description?: string | null
          end_date: string
          entry_fee?: number | null
          id?: string
          max_players?: number | null
          name: string
          round_1_generated?: boolean | null
          round_2_generated?: boolean | null
          round_3_generated?: boolean | null
          start_date: string
          status?: string | null
          total_rounds?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_round?: number | null
          description?: string | null
          end_date?: string
          entry_fee?: number | null
          id?: string
          max_players?: number | null
          name?: string
          round_1_generated?: boolean | null
          round_2_generated?: boolean | null
          round_3_generated?: boolean | null
          start_date?: string
          status?: string | null
          total_rounds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_player_tournament_ranking: {
        Args: { p_tournament_id: string; p_player_id: string }
        Returns: {
          total_games_won: number
          total_tiebreaker_specials: number
          ranking_position: number
        }[]
      }
      check_login_rate_limit: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: boolean
      }
      cleanup_old_audit_logs: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      detect_suspicious_login_patterns: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: string
      }
      has_role_or_higher: {
        Args: { user_id: string; required_role: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      log_comprehensive_security_event: {
        Args: {
          p_user_id: string
          p_event_type: Database["public"]["Enums"]["security_event_type"]
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
          p_risk_level?: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_login_attempt: {
        Args: { p_email: string; p_success: boolean; p_ip_address?: unknown }
        Returns: undefined
      }
      log_security_event: {
        Args:
          | Record<PropertyKey, never>
          | {
              p_user_id: string
              p_action: string
              p_resource_type?: string
              p_resource_id?: string
              p_details?: Json
            }
        Returns: undefined
      }
      log_security_event_enhanced: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
          p_risk_level?: string
        }
        Returns: undefined
      }
      sanitize_user_input: {
        Args: { input: string }
        Returns: string
      }
      save_individual_match: {
        Args: {
          p_match_id: string
          p_team1_player1_id: string
          p_team1_player2_id: string
          p_team2_player1_id: string
          p_team2_player2_id: string
          p_court_id?: string
          p_court_number?: string
          p_round_within_group?: number
        }
        Returns: Json
      }
      validate_email_format: {
        Args: { email: string }
        Returns: boolean
      }
    }
    Enums: {
      security_event_type:
        | "login_attempt"
        | "password_change"
        | "role_change"
        | "data_access_violation"
        | "suspicious_activity"
        | "admin_action"
        | "system_event"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      security_event_type: [
        "login_attempt",
        "password_change",
        "role_change",
        "data_access_violation",
        "suspicious_activity",
        "admin_action",
        "system_event",
      ],
    },
  },
} as const
