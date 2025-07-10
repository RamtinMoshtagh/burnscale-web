export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      checkins: {
        Row: {
          id: string;
          created_at: string;
          mood: string;
          energy_level: number;
          meaningfulness: number;
          notes: string | null;
          stress_triggers: string[] | null;
          recovery_activities: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          mood: string;
          energy_level: number;
          meaningfulness: number;
          notes?: string | null;
          stress_triggers?: string[] | null;
          recovery_activities?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          mood?: string;
          energy_level?: number;
          meaningfulness?: number;
          notes?: string | null;
          stress_triggers?: string[] | null;
          recovery_activities?: string[] | null;
        };
      };

      moodboards: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          summary: string;
          prompt: string;
          image_url: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          summary: string;
          prompt: string;
          image_url: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          summary?: string;
          prompt?: string;
          image_url?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
