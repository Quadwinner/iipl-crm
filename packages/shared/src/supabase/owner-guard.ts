/**
 * Owner-scoped query guard utilities
 * 
 * These utilities ensure owner-scoped queries always use server-resolved
 * office_owner_id values, never client-supplied ids, to prevent unauthorized
 * data access (Requirements 4.4, 4.8).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

/**
 * Calls the `public.current_office_owner_id()` database function to resolve
 * the office_owner.id for the authenticated user.
 * 
 * Returns NULL if the current user is not an office owner (e.g., they are
 * an Administrator or Maintenance_Staff).
 * 
 * This function is automatically available in RLS policies and other database
 * functions. You only need to call it from TypeScript when you need the id
 * for client-side logic (filtering, display, etc).
 * 
 * @example
 * ```typescript
 * const ownerId = await getCurrentOfficeOwnerId(supabase);
 * if (!ownerId) {
 *   // User is not an office owner
 *   throw new Error('Access denied');
 * }
 * // Use ownerId for filtering or display
 * ```
 * 
 * @param client - Authenticated Supabase client
 * @returns The office_owner.id for the current user, or null
 */
export async function getCurrentOfficeOwnerId(
  client: SupabaseClient<Database>
): Promise<string | null> {
  const { data, error } = await client.rpc('current_office_owner_id');
  
  if (error) {
    throw new Error(`Failed to resolve office_owner_id: ${error.message}`);
  }
  
  return data;
}

/**
 * Usage pattern for owner-scoped queries:
 * 
 * ❌ NEVER do this (client supplies owner_id):
 * ```typescript
 * const { data } = await supabase
 *   .from('allotments')
 *   .select('*')
 *   .eq('office_owner_id', requestBody.ownerId);  // ❌ Attacker can supply any id!
 * ```
 * 
 * ✅ ALWAYS do this (server resolves owner_id):
 * ```typescript
 * // Option 1: Let RLS policies handle it automatically
 * const { data } = await supabase
 *   .from('allotments')
 *   .select('*');
 * // RLS policy uses current_office_owner_id() internally
 * 
 * // Option 2: Call an RPC that uses current_office_owner_id() internally
 * const { data } = await supabase.rpc('get_my_allotments');
 * // The RPC function body uses current_office_owner_id() to filter
 * 
 * // Option 3: Use the TypeScript wrapper (for display/client logic only)
 * const ownerId = await getCurrentOfficeOwnerId(supabase);
 * if (!ownerId) throw new Error('Not an office owner');
 * // Use ownerId for non-query purposes (display, etc)
 * ```
 * 
 * RLS policies automatically enforce this pattern at the database level,
 * so even if application code is buggy, unauthorized access is prevented.
 */
