/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate with `pnpm gen:types` from the repo root, which runs:
 *   supabase gen types typescript --linked --schema public
 *
 * The schema is still empty (tables/enums/functions arrive with the migrations in
 * later tasks), so this is the shape the generator emits for an empty `public`
 * schema. Re-run the script after every migration.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: { [_ in never]: never }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
