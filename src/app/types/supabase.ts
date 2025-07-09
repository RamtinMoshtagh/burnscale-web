export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      // Legg til tabellene dine her hvis du bruker Row Level Security
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
