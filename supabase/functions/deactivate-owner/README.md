# deactivate-owner Edge Function

**Task 6.5** | **Requirements: 4.7, 14.1**

Admin-only Edge Function that deactivates an Office_Owner account by:

1. Verifying `OWNER_ACCOUNT_DEACTIVATE` permission (Administrator role)
2. Revoking all active Supabase Auth sessions globally for the owner's `user_id`
3. Calling `deactivate_owner_internal` RPC to atomically:
   - Set `office_owners.status = 'DEACTIVATED'`
   - Record `OWNER_DEACTIVATE` audit log entry

## Request

```json
POST /functions/v1/deactivate-owner
Authorization: Bearer <admin-jwt>

{
  "owner_id": "<uuid>"
}
```

## Response

Success (200):
```json
{
  "success": true,
  "message": "Owner account deactivated successfully",
  "data": {
    "success": true,
    "owner_id": "<uuid>",
    "previous_status": "ACTIVE",
    "new_status": "DEACTIVATED"
  }
}
```

Error (400/403/404/500):
```json
{
  "error_code": "PERMISSION_DENIED",
  "message": "Descriptive error message"
}
```

Error codes:
- `UNAUTHORIZED` (401) - Missing authorization header
- `PERMISSION_DENIED` (403) - Caller lacks Administrator role
- `INVALID_REQUEST` (400) - Missing owner_id
- `OWNER_NOT_FOUND` (404) - Invalid owner_id
- `SESSION_REVOCATION_FAILED` (500) - Auth API error
- `DEACTIVATION_FAILED` (500) - Database transaction error
- `INTERNAL_ERROR` (500) - Unexpected error

## Atomicity

The status update and audit log write occur in a single transaction via the `deactivate_owner_internal` plpgsql function. Session revocation happens before the database transaction, following Requirement 4.7 (terminate sessions + prevent authentication).

## Deployment

```bash
cd /media/shubham/OS/for linux work/itoby CRM
npx supabase functions deploy deactivate-owner
```
