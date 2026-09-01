import { useMutation, useQuery } from '@tanstack/react-query'
import { documentKeys, downloadDocument, listOwnerDocuments, type Uuid } from '@itoby/shared'
import { openSignedFile } from '@itoby/ui'
import { supabase } from '@rental-owner/lib/supabase'

export { documentKeys, type OwnerDocumentRow } from '@itoby/shared'

export function useOwnerDocuments(ownerId: Uuid) {
  return useQuery({
    queryKey: documentKeys.list(ownerId),
    enabled: Boolean(ownerId),
    queryFn: () => listOwnerDocuments(supabase()),
  })
}

/** Downloads are short-lived signed URLs minted under Storage RLS. */
export function useDownloadOwnerDocument() {
  return useMutation({
    mutationFn: async (documentId: Uuid) => {
      const file = await openSignedFile(() => downloadDocument(supabase(), documentId))
      return file.fileName
    },
  })
}
