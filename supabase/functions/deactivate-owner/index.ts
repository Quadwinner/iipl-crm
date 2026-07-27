/**
 * Edge Function: deactivate-owner
 * Task 6.5: Admin-only flow revoking all active Supabase Auth sessions and deactivating owner
 * Requirements: 4.7, 14.1
 *
 * Flow:
 * 1. Verify admin permission
 * 2. Revoke all sessions via Supabase Auth Admin API (global signout)
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error_code: 'UNAUTHORIZED', message: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Create clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client for checking permissions (uses caller's session)
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: { persistSession: false },
    })

    // Service-role client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // Verify admin permission
    const { data: hasPermission, error: permError } = await userClient.rpc('authorize', {
      p_permission: 'OWNER_ACCOUNT_DEACTIVATE',
    })

    if (permError || !hasPermission) {
      return new Response(
        JSON.stringify({
          error_code: 'PERMISSION_DENIED',
          message: 'OWNER_ACCOUNT_DEACTIVATE requires Administrator role',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Parse request body
    const body: DeactivateOwnerRequest = await req.json()
    if (!body.owner_id) {
      return new Response(
        JSON.stringify({
          error_code: 'INVALID_REQUEST',
          message: 'Missing required field: owner_id',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Get owner's user_id
    const { data: owner, error: ownerError } = await serviceClient
      .from('office_owners')
      .select('user_id')
      .eq('id', body.owner_id)
      .single()

    if (ownerError || !owner) {
      return new Response(
        JSON.stringify({
          error_code: 'OWNER_NOT_FOUND',
          message: 'Office owner not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Revoke all sessions for this user (global signout)
    const { error: signOutError } = await serviceClient.auth.admin.signOut(owner.user_id, 'global')

    if (signOutError) {
      console.error('Failed to revoke sessions:', signOutError)
      return new Response(
        JSON.stringify({
          error_code: 'SESSION_REVOCATION_FAILED',
          message: 'Failed to revoke user sessions',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Call internal RPC to atomically update status + audit log
    const { data: result, error: rpcError } = await serviceClient.rpc('deactivate_owner_internal', {
      p_owner_id: body.owner_id,
    })

    if (rpcError) {
      console.error('Failed to deactivate owner:', rpcError)
      return new Response(
        JSON.stringify({
          error_code: 'DEACTIVATION_FAILED',
          message: 'Failed to deactivate owner account',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Owner account deactivated successfully',
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error_code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
