---
inclusion: fileMatch
fileMatchPattern: 'supabase/functions/**/*.ts'
---

# Edge Function Rules

Deno runtime, not Node. Import via `npm:` / `jsr:` specifiers or URLs — no `node_modules`.

Deploy: `npx -y supabase functions deploy <name>`
Secrets: `npx -y supabase secrets set KEY=value` — read with `Deno.env.get('KEY')`.
Never hardcode a key or read from the repo `.env` at runtime.

## What belongs here vs. in Postgres

Edge Functions handle I/O the database can't: inbound webhooks, outbound HTTP to
Razorpay/UPI/email/SMS, multipart file uploads, PDF rendering.

State changes still belong in a Postgres RPC. The pattern is: verify/parse in the Edge
Function, then call one `supabase.rpc(...)` with the service-role key so the writes stay a
single transaction. Do not perform a sequence of table writes from the function.

## Webhook security

Verify the signature over the **raw request body** before anything touches the database.
Read the body once as text/bytes — parsing to JSON first and re-serializing changes the
bytes and breaks HMAC verification.

Use a constant-time comparison for signatures, not `===`.

Status contract (both gateways retry on non-2xx):
- `200` — verified and durably handled, including duplicate-discard and recorded failures
- `400` — signature verification failed (do not retry; also record the attempt)
- `500` — genuine internal error, retry is desirable

Idempotency is enforced by the unique constraint on `(gateway, transaction_ref)` plus a
locked read inside the RPC. Two concurrent deliveries of the same reference must result in
one payment row.

## Clients

Service-role client for privileged work:

```ts
createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})
```

This bypasses RLS. Only use it where the function is unreachable from the public API or
already authorized the caller. When acting on behalf of a user, forward their JWT instead
so RLS still applies.

## Uploads

Validate size and MIME against `file_storage_config` server-side before writing to Storage —
a client-side check can be bypassed by calling the Storage API directly. On rejection,
write nothing: no bucket object, no table row.

Object keys are UUID-based, never derived from the user-supplied filename.

## Errors

Return `{ error_code, message }`. Never echo secrets, raw provider payloads, or another
owner's data in an error. Log enough to debug without leaking.
