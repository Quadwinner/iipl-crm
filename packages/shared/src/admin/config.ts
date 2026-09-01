import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import { dbError } from '../owner/db-error'

export type GlobalConfigRow = Database['public']['Tables']['global_config']['Row']
export type FileStorageConfigRow = Database['public']['Tables']['file_storage_config']['Row']

export const settingsKeys = {
  all: ['config'] as const,
  globalConfig: ['config', 'global'] as const,
  fileStorage: ['config', 'file-storage'] as const,
}

/** Tunables live in the single-row `global_config` (Requirements 5.8, 8.2, 11.6, 11.9). */
export async function getGlobalConfig(client: TypedSupabaseClient): Promise<GlobalConfigRow> {
  const { data, error } = await client.from('global_config').select('*').eq('id', 1).single()
  if (error) throw dbError(error, 'System configuration could not be loaded.')
  return data
}

/** Accepted types and per-type size ceilings (Requirement 13.4); readable by all staff. */
export async function listFileStorageConfig(
  client: TypedSupabaseClient,
): Promise<FileStorageConfigRow[]> {
  const { data, error } = await client
    .from('file_storage_config')
    .select('*')
    .order('file_extension')
  if (error) throw dbError(error, 'File type settings could not be loaded.')
  return data ?? []
}
