# Integration Guide: Create Owner Edge Function

## Overview

This guide shows how to call the `create-owner` Edge Function from the Admin Portal or any other client application.

## Endpoint

```
POST https://your-project.supabase.co/functions/v1/create-owner
```

## Authentication

The Edge Function requires authentication. Include the Supabase `anon` key in the Authorization header:

```typescript
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

> **Note**: The anon key is safe to use from the browser. The actual privileged operations (creating auth users) happen server-side using the service role key, which is never exposed.

## React/TypeScript Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

interface CreateOwnerData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface CreateOwnerResponse {
  success: boolean;
  data?: {
    owner_id: string;
    user_id: string;
    name: string;
    contact_email: string;
    phone: string;
    status: string;
  };
  error?: string;
}

async function createOwner(data: CreateOwnerData): Promise<CreateOwnerResponse> {
  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/functions/v1/create-owner`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    }
  );

  return await response.json();
}

// Usage
try {
  const result = await createOwner({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    password: 'securepass123',
  });

  if (result.success) {
    console.log('Owner created:', result.data);
    // Redirect to owners list or show success message
  } else {
    console.error('Failed to create owner:', result.error);
    // Show error message to user
  }
} catch (error) {
  console.error('Network error:', error);
  // Show network error message
}
```

## Using Supabase Functions Client

Alternatively, use the Supabase client's built-in functions helper:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function createOwner(data: CreateOwnerData) {
  const { data: result, error } = await supabase.functions.invoke('create-owner', {
    body: data,
  });

  if (error) {
    throw error;
  }

  return result;
}
```

## Validation Rules

Before calling the API, validate inputs client-side for better UX:

```typescript
function validateOwnerInput(data: CreateOwnerData): string | null {
  if (!data.name || data.name.length < 1 || data.name.length > 100) {
    return 'Name must be 1-100 characters';
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(data.email)) {
    return 'Invalid email format';
  }

  const phoneRegex = /^\d{10,15}$/;
  if (!phoneRegex.test(data.phone)) {
    return 'Phone must be 10-15 digits';
  }

  if (!data.password || data.password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

// Usage
const validationError = validateOwnerInput(formData);
if (validationError) {
  // Show error to user
  return;
}

// Proceed with API call
const result = await createOwner(formData);
```

## Error Handling

Handle different error types appropriately:

```typescript
async function handleCreateOwner(data: CreateOwnerData) {
  try {
    const response = await fetch(/* ... */);
    const result: CreateOwnerResponse = await response.json();

    if (!result.success) {
      // API returned an error
      switch (response.status) {
        case 400:
          // Validation error
          showError(`Invalid input: ${result.error}`);
          break;
        case 409:
          // Duplicate email
          showError('This email is already registered. Please use a different email.');
          break;
        case 500:
          // Server error
          showError('Server error. Please try again later.');
          break;
        default:
          showError(`Error: ${result.error}`);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    // Network error or JSON parse error
    showError('Network error. Please check your connection and try again.');
    return null;
  }
}
```

## React Hook Example

```typescript
import { useState } from 'react';

interface UseCreateOwnerResult {
  createOwner: (data: CreateOwnerData) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useCreateOwner(): UseCreateOwnerResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createOwner = async (data: CreateOwnerData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${process.env.VITE_SUPABASE_URL}/functions/v1/create-owner`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result: CreateOwnerResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create owner');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { createOwner, loading, error, success };
}

// Usage in component
function CreateOwnerForm() {
  const { createOwner, loading, error, success } = useCreateOwner();
  const [formData, setFormData] = useState<CreateOwnerData>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOwner(formData);
  };

  if (success) {
    return <div>Owner created successfully!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Owner'}
      </button>
    </form>
  );
}
```

## Testing

### Unit Tests

The Postgres function is tested in `/test/create-owner.test.ts`. Run with:

```bash
pnpm test test/create-owner.test.ts
```

### Integration Tests

For end-to-end testing of the Edge Function:

```bash
# Create a test owner
curl -X POST "https://your-project.supabase.co/functions/v1/create-owner" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Owner",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "testpass123"
  }'

# Expected response (201):
# {
#   "success": true,
#   "data": {
#     "owner_id": "...",
#     "user_id": "...",
#     "name": "Test Owner",
#     "contact_email": "test@example.com",
#     "phone": "1234567890",
#     "status": "ACTIVE"
#   }
# }
```

## Security Considerations

1. **Input Validation**: Always validate inputs both client-side and server-side
2. **Password Requirements**: Enforce minimum 8 characters (adjust as needed)
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **HTTPS Only**: Always use HTTPS in production
5. **Error Messages**: Don't leak sensitive information in error messages
6. **Audit Log**: All owner creation is automatically logged for auditing

## Troubleshooting

### "contact email already exists"
- The email is already registered in the system
- Use a different email or update the existing owner record

### "invalid email format"
- Email doesn't match the required pattern
- Ensure format is: name@domain.ext

### "phone must be 10-15 digits"
- Phone number is outside the valid range
- Remove any non-numeric characters
- Ensure length is 10-15 digits

### "name must be 1-100 characters"
- Name is empty or too long
- Check for whitespace-only names

### Network errors
- Check Supabase project URL is correct
- Verify anon key is correct
- Check network connectivity
- Verify Edge Function is deployed

## Related Documentation

- Edge Function: `/supabase/functions/create-owner/README.md`
- Postgres Function: `/supabase/migrations/20260727070555_create_owner_function.sql`
- Tests: `/test/create-owner.test.ts`
- Implementation Summary: `/.kiro/specs/office-rental-crm/TASK_6.2_IMPLEMENTATION.md`
