/**
 * Edge Function: upload-document
 * Task 12.5
 * Requirements 13.1, 13.4, 13.5
 *
 * Administrator-only multipart upload of a Lease / Office_Owner document. Validates
 * size and type against file_storage_config BEFORE writing anything; on any
 * violation nothing is written (no bucket object, no table row). The document is
 * linked to a Lease and/or an Office_Owner; when lease-linked, the owning
 * office_owner is resolved server-side from the lease's allotment.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const BUCKET = 'owner-documents'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error_code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, {
      error_code: 'UNAUTHORIZED',
      message: 'Missing authorization header',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // Administrator-only (Requirement 13.1). Enforced via the permission map under
  // the caller's JWT — RLS/authorize is the real gate, not client-side hiding.
  const { data: allowed, error: permError } = await userClient.rpc('authorize', {
    p_permission: 'DOCUMENT_UPLOAD',
  })
  if (permError || !allowed) {
    return jsonResponse(403, {
      error_code: 'PERMISSION_DENIED',
      message: 'Uploading documents requires Administrator role',
    })
  }

  let leaseId: string | null
  let ownerId: string | null
  let file: File
  try {
    const form = await req.formData()
    leaseId = (form.get('lease_id') as string) || null
    ownerId = (form.get('office_owner_id') as string) || null
    const rawFile = form.get('file')
    if (!(rawFile instanceof File)) {
      return jsonResponse(400, {
        error_code: 'INVALID_REQUEST',
        message: 'Missing file in multipart form data',
      })
    }
    file = rawFile
  } catch {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'Expected multipart/form-data with a file and lease_id or office_owner_id',
    })
  }

  if (!leaseId && !ownerId) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'A document must be linked to a lease_id or an office_owner_id',
    })
  }

  // Resolve the owning office_owner. Lease link takes precedence and resolves the
  // owner through its allotment so owner scoping is always populated.
  let resolvedOwnerId: string | null = ownerId
  if (leaseId) {
    const { data: lease, error: leaseError } = await serviceClient
      .from('lease')
      .select('id, allotment:allotment_id ( office_owner_id )')
      .eq('id', leaseId)
      .maybeSingle()

    if (leaseError) {
      console.error('lease lookup failed:', leaseError.message)
      return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
    }
    if (!lease) {
      return jsonResponse(404, { error_code: 'LEASE_NOT_FOUND', message: 'Lease not found' })
    }
    const allotment = lease.allotment as
      | { office_owner_id: string }
      | { office_owner_id: string }[]
      | null
    const leaseOwnerId = Array.isArray(allotment)
      ? allotment[0]?.office_owner_id
      : allotment?.office_owner_id
    resolvedOwnerId = leaseOwnerId ?? ownerId
  }

  if (!resolvedOwnerId) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'Could not resolve an owning office_owner for the document',
    })
  }

  const extension = extensionOf(file.name)
  const sizeBytes = file.size

  // Type + configured per-type size ceiling (Requirement 13.4, 13.5).
  const { data: config, error: configError } = await serviceClient
    .from('file_storage_config')
    .select('file_type_accepted, max_file_size_mb, mime_type')
    .eq('file_extension', extension)
    .maybeSingle()

  if (configError) {
    console.error('config lookup failed:', configError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }
  if (!config || !config.file_type_accepted) {
    return jsonResponse(400, {
      error_code: 'FILE_TYPE_NOT_ACCEPTED',
      message: 'File type is not accepted',
    })
  }
  if (sizeBytes > config.max_file_size_mb * 1024 * 1024) {
    return jsonResponse(400, {
      error_code: 'FILE_TOO_LARGE',
      message: `File exceeds the maximum allowed size of ${config.max_file_size_mb} MB`,
    })
  }

  // Opaque, UUID-based object key — never derived from the user-supplied name.
  const objectKey = `${resolvedOwnerId}/${crypto.randomUUID()}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await serviceClient.storage.from(BUCKET).upload(objectKey, bytes, {
    contentType: file.type || config.mime_type,
    upsert: false,
  })

  if (uploadError) {
    console.error('storage upload failed:', uploadError.message)
    return jsonResponse(500, { error_code: 'UPLOAD_FAILED', message: 'Failed to store file' })
  }

  const { data: inserted, error: insertError } = await serviceClient
    .from('document')
    .insert({
      lease_id: leaseId,
      office_owner_id: resolvedOwnerId,
      bucket_id: BUCKET,
      object_key: objectKey,
      file_name: file.name,
      file_extension: extension,
      mime_type: file.type || config.mime_type,
      size_bytes: sizeBytes,
    })
    .select('id, object_key, file_name, lease_id, office_owner_id')
    .single()

  if (insertError) {
    // Roll back the orphaned Storage object so a rejection leaves nothing behind.
    await serviceClient.storage.from(BUCKET).remove([objectKey])
    console.error('document insert failed:', insertError.message)
    return jsonResponse(500, { error_code: 'UPLOAD_FAILED', message: 'Failed to record document' })
  }

  return jsonResponse(201, { success: true, data: inserted })
})
