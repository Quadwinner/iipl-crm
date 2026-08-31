/**
 * Repointed at the superapp singleton. Two clients would mean two auth
 * sessions racing each other's token refresh.
 */
export { supabase } from '@/lib/supabase'
