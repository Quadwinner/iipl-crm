/**
 * Edge Function: upload-attachment
 * Task 12.4
 * Requirements 6.1, 6.5
 *
 * Accepts a multipart upload of a single Maintenance_Complaint attachment. The
 * caller must own the complaint (verified under their own JWT/RLS). Validates
 * count (0-5 per complaint), size (<= 10 MB hard cap and <= configured per-type
 * ceiling), and file type (file_storage_config.file_type_accepted) BEFORE writing
 * anything. On any violation nothing is written: no bucket object, no table row.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const BUCKET = 'complaint-attachments'
const MAX_ATTACHMENTS_PER_COMPLAINT = 5
const HARD_SIZE_LIMIT_BYTES = 10 * 1024 * 1024 // 10 MB (Requirement 6.1)

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

  // Caller-scoped client: RLS applies, so the complaint lookup only succeeds for
  // the complaint's owner. This is the ownership check for Requirement 6.1.
  const userClient = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  // Privileged client for the count read, Storage write, and row insert.
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  let complaintId: string
  let file: File
  try {
    const form = await req.formData()
    complaintId = String(form.get('complaint_id') ?? '')
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
      message: 'Expected multipart/form-data with complaint_id and file',
    })
  }

  if (!complaintId) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'Missing required field: complaint_id',
    })
  }

  // Verify the caller owns the complaint (RLS-scoped read).
  const { data: complaint, error: complaintError } = await userClient
    .from('maintenance_complaint')
    .select('id')
    .eq('id', complaintId)
    .maybeSingle()

  if (complaintError) {
    console.error('complaint lookup failed:', complaintError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }
  if (!complaint) {
    // Generic 403 — do not reveal whether the complaint exists (Requirement 4.8).
    return jsonResponse(403, {
      error_code: 'PERMISSION_DENIED',
      message: 'Not permitted to add attachments to this complaint',
    })
  }

  // Count check: at most 5 attachments per complaint (Requirement 6.1, 6.5).
  const { count, error: countError } = await serviceClient
    .from('file_attachment')
    .select('id', { count: 'exact', head: true })
    .eq('complaint_id', complaintId)

  if (countError) {
    console.error('attachment count failed:', countError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }
  if ((count ?? 0) >= MAX_ATTACHMENTS_PER_COMPLAINT) {
    return jsonResponse(400, {
      error_code: 'ATTACHMENT_LIMIT_EXCEEDED',
      message: `A complaint may have at most ${MAX_ATTACHMENTS_PER_COMPLAINT} attachments`,
    })
  }

  const extension = extensionOf(file.name)
  const sizeBytes = file.size

  // Hard 10 MB cap for attachments (Requirement 6.1).
  if (sizeBytes > HARD_SIZE_LIMIT_BYTES) {
    return jsonResponse(400, {
      error_code: 'FILE_TOO_LARGE',
      message: 'File exceeds the maximum allowed size of 10 MB',
    })
  }

  // Type + configured per-type size ceiling (Requirement 6.5, 13.4).
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
  const objectKey = `${complaintId}/${crypto.randomUUID()}.${extension}`
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
    .from('file_attachment')
    .insert({
      complaint_id: complaintId,
      bucket_id: BUCKET,
      object_key: objectKey,
      file_name: file.name,
      file_extension: extension,
      mime_type: file.type || config.mime_type,
      size_bytes: sizeBytes,
    })
    .select('id, object_key, file_name')
    .single()

  if (insertError) {
    // Roll back the orphaned Storage object so a rejection leaves nothing behind.
    await serviceClient.storage.from(BUCKET).remove([objectKey])
    console.error('attachment insert failed:', insertError.message)
    return jsonResponse(500, {
      error_code: 'UPLOAD_FAILED',
      message: 'Failed to record attachment',
    })
  }

  return jsonResponse(201, { success: true, data: inserted })
})
