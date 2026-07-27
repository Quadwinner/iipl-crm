// Edge Function: create-staff
// Requirements 5.3, 5.5, 7.2, 14.1
// Creates the auth.users record for a Maintenance_Staff member, then calls
// create_staff_account so the profile role, name/phone, and audit entry commit together.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateStaffRequest {
  name?: string
  email?: string
  phone?: string
  password?: string
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function failure(status: number, errorCode: string, message: string): Response {
  return jsonResponse(status, { success: false, error_code: errorCode, error: message, message })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return failure(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceKey

    const authHeader = req.headers.get('Authorization')
    const callerToken = authHeader?.replace(/^Bearer\s+/i, '').trim()
    if (!callerToken) {
      return failure(401, 'UNAUTHORIZED', 'Missing authorization header')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Authorization happens before anything is created, from the caller's JWT rather
    // than the request body (Requirements 5.3, 5.5).
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(callerToken)
    if (callerError || !callerData?.user) {
      return failure(401, 'UNAUTHORIZED', 'Invalid or expired session')
    }

    // Caller-scoped client so authorize() and record_audit() both resolve this JWT's uid.
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: hasPermission, error: permissionError } = await callerClient.rpc('authorize', {
      p_permission: 'STAFF_ACCOUNT_CREATE',
    })

    if (permissionError) {
      console.error('Permission check failed:', permissionError.message)
      return failure(403, 'PERMISSION_DENIED', 'Permission could not be verified')
    }

    if (hasPermission !== true) {
      return failure(403, 'PERMISSION_DENIED', 'STAFF_ACCOUNT_CREATE requires Administrator role')
    }

    const body: CreateStaffRequest = await req.json()
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim() ?? ''
    const phone = body.phone?.trim() ?? ''
    const password = body.password ?? ''

    if (name.length < 1 || name.length > 100) {
      return failure(400, 'INVALID_REQUEST', 'name must be 1-100 characters')
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return failure(400, 'INVALID_REQUEST', 'invalid email format')
    }

    if (phone.length < 10 || phone.length > 15 || !/^\d+$/.test(phone)) {
      return failure(400, 'INVALID_REQUEST', 'phone must be 10-15 digits')
    }

    if (password.length < 8) {
      return failure(400, 'INVALID_REQUEST', 'password must be at least 8 characters')
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'MAINTENANCE_STAFF' },
    })

    if (authError) {
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already been registered') ||
        authError.message.includes('duplicate')
      ) {
        return failure(409, 'EMAIL_EXISTS', 'email already exists')
      }
      console.error('Auth user creation failed:', authError.message)
      return failure(500, 'USER_CREATE_FAILED', 'Failed to create the staff auth user')
    }

    if (!authData.user) {
      return failure(500, 'USER_CREATE_FAILED', 'Failed to create the staff auth user')
    }

    const { data: staffData, error: staffError } = await callerClient.rpc('create_staff_account', {
      p_auth_user_id: authData.user.id,
      p_full_name: name,
      p_phone: phone,
    })

    if (staffError) {
      console.error('Staff account creation failed:', staffError.message)

      // The RPC is atomic, but the auth user above sits outside its transaction. Deleting
      // it keeps a failed create from leaving an orphan row that permanently burns the
      // email address on retry.
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (cleanupError) {
        console.error('Failed to clean up orphaned auth user:', authData.user.id, cleanupError.message)
      }

      if (staffError.code === '23505') {
        return failure(409, 'EMAIL_EXISTS', 'email already exists')
      }
      if (staffError.code === '22023') {
        return failure(400, 'INVALID_REQUEST', staffError.message || 'Invalid input format')
      }
      if (staffError.code === '42501') {
        return failure(403, 'PERMISSION_DENIED', 'STAFF_ACCOUNT_CREATE requires Administrator role')
      }
      return failure(500, 'STAFF_CREATE_FAILED', 'Failed to create the staff account')
    }

    return jsonResponse(201, { success: true, data: staffData })
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error)
    return failure(500, 'INTERNAL_ERROR', 'Internal server error')
  }
})
