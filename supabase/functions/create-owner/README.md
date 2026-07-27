# Create Owner Edge Function

## Purpose

Server-side flow that creates an Office Owner account by:
1. Creating an `auth.users` row using Supabase Auth admin API
2. Creating `profiles` and `office_owners` rows
3. Recording an audit log entry
4. Enqueuing a login-instructions notification

All database operations (steps 2-4) are atomic via the `create_owner_account` Postgres function.

## Requirements

- **4.1**: Create owner with name/email/phone/password, send login instructions
- **4.2**: Reject duplicate contact email
- **4.3**: Validate input formats
- **14.1**: Record audit log entry for account creation
- **14.4**: Audit failure rolls back account creation

## API

### Endpoint

`POST /functions/v1/create-owner`

### Request Body

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "password": "securepass123"
}
```

### Validation Rules

- `name`: 1-100 characters
- `email`: Valid email format, must be unique
- `phone`: 10-15 digits (numeric only)
- `password`: Minimum 8 characters

### Response (Success - 201)

```json
{
  "success": true,
  "data": {
    "owner_id": "uuid",
    "user_id": "uuid",
    "name": "John Doe",
    "contact_email": "john.doe@example.com",
    "phone": "1234567890",
    "status": "ACTIVE"
  }
}
```

### Response (Validation Error - 400)

```json
{
  "success": false,
  "error": "name must be 1-100 characters"
}
```

### Response (Duplicate Email - 409)

```json
{
  "success": false,
  "error": "contact email already exists"
}
```

### Response (Server Error - 500)

```json
{
  "success": false,
  "error": "Failed to create user: <error message>"
}
```

## Testing

### Manual Testing with curl

```bash
# Set your Supabase project URL and anon key
SUPABASE_URL="https://your-project.supabase.co"
ANON_KEY="your-anon-key"

# Create an owner
curl -X POST "$SUPABASE_URL/functions/v1/create-owner" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Owner",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "testpass123"
  }'
```

### Automated Tests

The Postgres function `create_owner_account` is tested in `/test/create-owner.test.ts`.
Run tests with:

```bash
pnpm test test/create-owner.test.ts
```

## Deployment

### Deploy to Supabase

```bash
# Source environment variables
set -a; source .env; set +a

# Deploy the function
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  npx -y supabase functions deploy create-owner
```

### Set Environment Variables

The Edge Function requires these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin API access

## Implementation Notes

### Atomicity

The database operations (profiles + office_owners + audit + notification) are executed in a single Postgres transaction via the `create_owner_account` function. If any step fails (including the audit log write), the entire transaction rolls back.

### Auth User Creation

The `auth.users` row is created first using Supabase Auth's admin API. If the subsequent database operations fail, the auth user remains but has no associated owner record. This is by design - the auth user can be cleaned up manually or the account creation can be retried.

### Error Handling

- Input validation errors return 400
- Duplicate email errors return 409
- Auth API errors return appropriate status codes
- Postgres function errors are mapped to HTTP status codes based on error codes

### Security

- Uses service role key (admin privileges) - only runs server-side
- Never exposed to client browsers
- All RLS policies are bypassed (service role)
- Input validation happens both in Edge Function and Postgres function

## Related Files

- Postgres function: `/supabase/migrations/20260727070555_create_owner_function.sql`
- Tests: `/test/create-owner.test.ts`
- Schema: `/supabase/migrations/20260727065215_create_office_owners.sql`
