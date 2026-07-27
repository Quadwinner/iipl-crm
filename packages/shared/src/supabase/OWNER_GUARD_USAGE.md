# Owner-Scoped Query Guard Pattern

## Overview

The `current_office_owner_id()` function provides a secure, server-side way to resolve the `office_owner.id` for the authenticated user. This ensures that owner-scoped queries always use a server-resolved ID, never a client-supplied ID, which is critical for preventing unauthorized data access (Requirements 4.4, 4.8).

## Database Function

```sql
-- Located at: public.current_office_owner_id()
-- Returns: uuid | NULL
-- Usage: Available in RLS policies, RPCs, and direct SQL queries

create function public.current_office_owner_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.office_owners where user_id = auth.uid();
$$;
```

### Function Properties

- **STABLE**: Result won't change within a transaction for the same `auth.uid()`
- **SECURITY INVOKER**: Caller's permissions apply (RLS still enforced)
- **search_path = ''**: Fully qualified references prevent search_path hijacking
- **Returns NULL**: When the authenticated user is not an office owner (e.g., Administrator, Maintenance_Staff)

## Usage Patterns

### ✅ Pattern 1: RLS Policies (Primary Usage)

This is the most common and secure pattern. RLS policies use `current_office_owner_id()` internally to automatically filter data:

```sql
-- Example: Allotments table RLS policy
create policy allotments_select_owner on public.allotments
  for select to authenticated
  using (office_owner_id = public.current_office_owner_id());

-- Example: Invoices table RLS policy
create policy invoices_select_owner on public.invoices
  for select to authenticated
  using (office_owner_id = public.current_office_owner_id());
```

**Client-side code** (no special handling needed):

```typescript
// RLS automatically filters results - owner can only see their own data
const { data: allotments } = await supabase
  .from('allotments')
  .select('*');

// Even if you try to force an ID, RLS prevents it
const { data: forbidden } = await supabase
  .from('allotments')
  .select('*')
  .eq('office_owner_id', 'some-other-owners-id'); // ❌ Returns empty - RLS blocks this
```

### ✅ Pattern 2: Database RPCs (For Complex Operations)

Use `current_office_owner_id()` inside plpgsql functions for complex, atomic operations:

```sql
-- Example: Get my allotments with full details
create function public.get_my_allotments()
returns table (
  allotment_id uuid,
  unit_code text,
  building_name text,
  lease_start date,
  lease_end date,
  status text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  -- Resolve owner ID server-side
  v_owner_id := public.current_office_owner_id();
  
  if v_owner_id is null then
    raise exception 'Not an office owner' using errcode = '42501';
  end if;

  return query
  select
    a.id,
    u.unit_code,
    b.name,
    l.start_date,
    l.end_date,
    a.status::text
  from public.allotments a
  join public.office_units u on u.id = a.office_unit_id
  join public.buildings b on b.id = u.building_id
  join public.leases l on l.allotment_id = a.id
  where a.office_owner_id = v_owner_id;  -- ✅ Server-resolved ID
end;
$$;
```

**Client-side code**:

```typescript
const { data: allotments, error } = await supabase.rpc('get_my_allotments');
// Returns only the authenticated owner's allotments
```

### ✅ Pattern 3: TypeScript Wrapper (For Client Logic)

Use the TypeScript wrapper when you need the owner ID for client-side display or logic (not for queries):

```typescript
import { getCurrentOfficeOwnerId } from '@itoby/shared/supabase';

// Example: Show owner ID in UI
const ownerId = await getCurrentOfficeOwnerId(supabase);
if (!ownerId) {
  // User is not an office owner (maybe Administrator or Maintenance_Staff)
  router.push('/admin');
  return;
}

console.log(`Current owner ID: ${ownerId}`);
// Use for display, routing logic, etc. - NOT for querying data
```

## ❌ Anti-Patterns (Never Do These)

### ❌ Never trust client-supplied IDs

```typescript
// ❌ WRONG: Client supplies owner_id
const { ownerId } = requestBody; // Attacker can supply any ID!
const { data } = await supabase
  .from('allotments')
  .select('*')
  .eq('office_owner_id', ownerId); // ❌ Vulnerable to unauthorized access

// ✅ CORRECT: Let RLS handle it
const { data } = await supabase
  .from('allotments')
  .select('*');
// RLS policy automatically filters by current_office_owner_id()
```

### ❌ Never bypass the server-resolved ID

```typescript
// ❌ WRONG: Trying to fetch another owner's data
const otherOwnerId = 'some-uuid-from-url';
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('office_owner_id', otherOwnerId); // ❌ RLS will block this anyway

// ✅ CORRECT: Only query your own data
const { data } = await supabase
  .from('invoices')
  .select('*');
// Returns only current owner's invoices
```

### ❌ Never use it for authorization in client code

```typescript
// ❌ WRONG: Authorization in client code
const ownerId = await getCurrentOfficeOwnerId(supabase);
if (ownerId === targetOwnerId) {
  // Attacker can modify this check in browser!
  await performSensitiveAction();
}

// ✅ CORRECT: Authorization in database function
// create function public.perform_sensitive_action()
// ...
//   if public.current_office_owner_id() != target_owner_id then
//     raise exception 'unauthorized' using errcode = '42501';
//   end if;
// ...
```

## Security Guarantees

When you follow these patterns:

1. **Server-side resolution**: The owner ID is always resolved from `auth.uid()` on the server, not supplied by the client
2. **RLS enforcement**: Even if application code is buggy, RLS policies prevent unauthorized access at the database level
3. **Transaction isolation**: The `STABLE` volatility means the ID won't change mid-transaction
4. **Search path safety**: `search_path = ''` prevents hijacking attacks
5. **Null safety**: Returns NULL for non-owner users instead of failing, allowing role-based routing

## Testing the Function

You can test the function directly in the Supabase SQL editor:

```sql
-- As an office owner user
select public.current_office_owner_id();
-- Returns: <your office_owner.id uuid>

-- As an administrator user
select public.current_office_owner_id();
-- Returns: NULL (administrators are not office owners)

-- Verify it works in a query
select * from public.allotments
where office_owner_id = public.current_office_owner_id();
-- Returns only your allotments
```

## Migration Reference

The function is created in migration: `20260727070548_owner_scoped_query_guard.sql`

## Related Requirements

- **Requirement 4.4**: The System SHALL restrict an Office_Owner's Owner_Portal visibility to only their own Allotments, Invoices, Payments, and Maintenance_Complaints.
- **Requirement 4.8**: THE System SHALL prevent an Office_Owner from viewing the Allotments, Invoices, Payments, or Maintenance_Complaints belonging to any other Office_Owner.

## See Also

- `packages/shared/src/supabase/owner-guard.ts` - TypeScript wrapper implementation
- Existing RLS policies in migrations - See how other tables use this pattern
- `public.is_administrator()` - Similar pattern for role checks
