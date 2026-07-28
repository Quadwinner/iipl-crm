/**
 * Edge Function: deactivate-owner
 * Task 6.5: Admin-only flow revoking all active Supabase Auth sessions and deactivating owner
 * Requirements: 4.7, 14.1
 *
 * Flow:
 * 1. Verify admin permission (caller JWT + anon key, same pattern as create-owner)
 * 2. Revoke all auth sessions for the owner's user_id
 * 3. Call deactivate_owner_internal RPC to atomically update status + audit log
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeactivateOwnerRequest {
  owner_id: string
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return failure(405, 'METHOD_NOT_ALLOWED', 'Method not allowed')
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return failure(401, 'UNAUTHORIZED', 'Missing authorization header')
    }

    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!callerToken) {
      return failure(401, 'UNAUTHORIZED', 'Missing authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceKey

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: callerData, error: callerError } = await serviceClient.auth.getUser(callerToken)
    if (callerError || !callerData?.user) {
      return failure(401, 'UNAUTHORIZED', 'Invalid or expired session')
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: hasPermission, error: permError } = await callerClient.rpc('authorize', {
      p_permission: 'OWNER_ACCOUNT_DEACTIVATE',
    })

    if (permError) {
      console.error('Permission check failed:', permError)
      return failure(403, 'PERMISSION_DENIED', 'Permission could not be verified')
    }

    if (hasPermission !== true) {
      return failure(
        403,
        'PERMISSION_DENIED',
        'OWNER_ACCOUNT_DEACTIVATE requires Administrator role',
      )
    }

    const body: DeactivateOwnerRequest = await req.json()
    if (!body.owner_id) {
      return failure(400, 'INVALID_REQUEST', 'Missing required field: owner_id')
    }

    const { data: owner, error: ownerError } = await serviceClient
      .from('office_owners')
      .select('user_id')
      .eq('id', body.owner_id)
      .single()

    if (ownerError || !owner) {
      return failure(404, 'OWNER_NOT_FOUND', 'Office owner not found')
    }

    const { error: revokeError } = await serviceClient.rpc('revoke_user_auth_sessions', {
      p_user_id: owner.user_id,
    })

    if (revokeError) {
      console.error('Failed to revoke sessions:', revokeError)
      return failure(500, 'SESSION_REVOCATION_FAILED', 'Failed to revoke user sessions')
    }

    const { data: result, error: rpcError } = await serviceClient.rpc('deactivate_owner_internal', {
      p_owner_id: body.owner_id,
    })

    if (rpcError) {
      console.error('Failed to deactivate owner:', rpcError)
      return failure(500, 'DEACTIVATION_FAILED', 'Failed to deactivate owner account')
    }

    return jsonResponse(200, {
      success: true,
      message: 'Owner account deactivated successfully',
      data: result,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return failure(500, 'INTERNAL_ERROR', 'Internal server error')
  }
})
