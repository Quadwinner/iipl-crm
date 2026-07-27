// Edge Function: create-owner
// Requirements 4.1, 4.2, 4.3, 5.3, 5.5, 14.1
// Server-side flow that creates auth.users, profiles, office_owners, audit log, and notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOwnerRequest {
  name: string
  email: string
  phone: string
  password: string
}

interface CreateOwnerResponse {
  success: boolean
  data?: {
    owner_id: string
    user_id: string
    name: string
    contact_email: string
    phone: string
    status: string
  }
  error?: string
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function failure(status: number, errorCode: string, message: string): Response {
  return jsonResponse(status, {
    success: false,
    error_code: errorCode,
    error: message,
    message,
  })
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return failure(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // Role resolution comes from the forwarded JWT, so either publishable key works here.
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceKey

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return failure(401, 'UNAUTHORIZED', 'Missing authorization header')
    }
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!callerToken) {
      return failure(401, 'UNAUTHORIZED', 'Missing authorization header')
    }

    // Service-role client for the Auth admin API and the owner-creation RPC.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Authorization runs before anything is created: the caller's identity and role are
    // resolved from their JWT server-side, never from the request body (Requirements 4.1, 5.3, 5.5).
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(callerToken)

    if (callerError || !callerData?.user) {
      return failure(401, 'UNAUTHORIZED', 'Invalid or expired session')
    }

    // Caller-scoped client so authorize() reads the role of this JWT's auth.uid() under RLS.
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: hasPermission, error: permissionError } = await callerClient.rpc('authorize', {
      p_permission: 'OWNER_ACCOUNT_CREATE',
    })

    if (permissionError) {
      console.error('Permission check failed:', permissionError)
      return failure(403, 'PERMISSION_DENIED', 'Permission could not be verified')
    }

    if (hasPermission !== true) {
      return failure(403, 'PERMISSION_DENIED', 'OWNER_ACCOUNT_CREATE requires Administrator role')
    }

    // Parse request body
    const body: CreateOwnerRequest = await req.json()
    const { name, email, phone, password } = body

    // Validate inputs (Requirements 4.1, 4.3)
    if (!name || name.length < 1 || name.length > 100) {
      return failure(400, 'INVALID_REQUEST', 'name must be 1-100 characters')
    }

    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return failure(400, 'INVALID_REQUEST', 'invalid email format')
    }

    if (!phone || phone.length < 10 || phone.length > 15 || !/^\d+$/.test(phone)) {
      return failure(400, 'INVALID_REQUEST', 'phone must be 10-15 digits')
    }

    if (!password || password.length < 8) {
      return failure(400, 'INVALID_REQUEST', 'password must be at least 8 characters')
    }

    // Step 1: Create auth.users record using Supabase Auth admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'OFFICE_OWNER',
      },
    })

    if (authError) {
      // Check for duplicate email (Requirement 4.2)
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('duplicate')
      ) {
        return failure(409, 'EMAIL_EXISTS', 'contact email already exists')
      }

      console.error('Auth user creation failed:', authError)
      return failure(500, 'USER_CREATE_FAILED', `Failed to create user: ${authError.message}`)
    }

    if (!authData.user) {
      return failure(500, 'USER_CREATE_FAILED', 'Failed to create auth user')
    }

    // Step 2: Call Postgres function to create profiles + office_owners + audit + notification
    // This is an atomic transaction (Requirements 4.1, 14.1, 14.4)
    const { data: ownerData, error: ownerError } = await supabaseAdmin.rpc('create_owner_account', {
      p_auth_user_id: authData.user.id,
      p_name: name,
      p_contact_email: email,
      p_phone: phone,
    })

    if (ownerError) {
      console.error('Owner account creation failed:', ownerError)

      // The RPC is atomic, so no profiles/office_owners/audit row survives its failure —
      // but the auth user created above sits outside that transaction. Delete it so a
      // failed creation leaves nothing behind and the address stays reusable; otherwise a
      // retry fails with "already registered" instead of the real validation error.
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (cleanupError) {
        console.error(
          'Failed to clean up orphaned auth user:',
          authData.user.id,
          cleanupError.message,
        )
      }

      // Map specific error codes to user-friendly messages
      if (ownerError.code === '23505' || ownerError.message.includes('already exists')) {
        return failure(409, 'EMAIL_EXISTS', 'contact email already exists')
      }

      if (ownerError.code === '22023' || ownerError.message.includes('invalid')) {
        return failure(400, 'INVALID_REQUEST', ownerError.message || 'Invalid input format')
      }

      if (ownerError.code === '42501') {
        return failure(403, 'PERMISSION_DENIED', 'Permission denied')
      }

      return failure(
        500,
        'OWNER_CREATE_FAILED',
        `Failed to create owner account: ${ownerError.message}`,
      )
    }

    // Success! Return the owner account details
    const response: CreateOwnerResponse = {
      success: true,
      data: ownerData as CreateOwnerResponse['data'],
    }

    return jsonResponse(201, response as unknown as Record<string, unknown>)
  } catch (error) {
    console.error('Unexpected error:', error)
    return failure(
      500,
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Internal server error',
    )
  }
})
