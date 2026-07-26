# Implementation Plan: Office Rental CRM

## Overview

This plan implements the Office Rental CRM on Supabase (Postgres, Auth, RLS, Storage, Edge Functions, `pg_cron`), with TypeScript used throughout. Both frontend portals (`apps/admin-portal`, `apps/owner-portal`) are separate Vite + React + TypeScript apps in a pnpm workspace monorepo, sharing common types/Supabase client code via `packages/shared`, and using React Router, TanStack Query, React Hook Form + Zod, Tailwind + shadcn/ui, and TanStack Table. Property-based tests use `fast-check` against a local Supabase Postgres instance via `supabase-js`.

The build order is: project scaffolding → auth/profiles foundation → shared foundation (global configuration, complaint categories, notifications queue, audit log, first-Administrator seed) → core inventory (Building/Office_Unit) → Office_Owner accounts → Allotment/Lease → Maintenance_Complaint → File storage → Billing/Invoicing → Payments → Receipts → Notification delivery/Reminders → Audit querying → cross-tenant isolation hardening → Dashboard/Reporting → Admin_Portal → Owner_Portal. The shared foundation step comes early because later transactions write notification, audit, and configuration rows inside the same transaction as their primary write, so those tables must exist before the first capability that uses them. Each backend capability is built and property-tested before the portal screens that depend on it are implemented.

## Tasks

- [x] 1. Project scaffolding
  - [x] 1.1 Initialize monorepo structure
    - Create a pnpm workspace (`pnpm-workspace.yaml`) with `supabase/` (migrations, functions, seed), `apps/admin-portal` and `apps/owner-portal` (each a Vite + React + TypeScript app, scaffolded via `pnpm create vite ... --template react-ts`), and `packages/shared` (shared TypeScript types mirroring the data models in design.md, generated via `supabase gen types typescript`, plus a shared Supabase client factory)
    - Configure TypeScript, ESLint/Prettier, and a shared `tsconfig.base.json` referenced by both apps and `packages/shared`
    - Add shared frontend dependencies to each portal app: React Router (routing), TanStack Query (Supabase data fetching/caching), React Hook Form + Zod (forms/validation matching the bounds in requirements.md), Tailwind CSS + shadcn/ui (UI components), and TanStack Table (list/grid views)
    - _Requirements: (project setup, no direct AC)_
  - [x] 1.2 Configure Supabase local project
    - Add `supabase/config.toml`, local dev stack config, and placeholders for secrets (`RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID/SECRET`, `UPI_SHARED_SECRET`, email/SMS provider keys) documented in a `.env.example`
    - _Requirements: (project setup, no direct AC)_

- [ ] 2. Auth and profile foundation
  - [ ] 2.1 Create profiles migration
    - Migration for `role` enum (`ADMINISTRATOR`, `MAINTENANCE_STAFF`, `OFFICE_OWNER`), `profiles` table (`user_id` PK/FK to `auth.users.id`, `role`, `failed_login_count`, `locked_until`, `last_activity_at`), and a trigger on `auth.users` insert that creates the matching `profiles` row
    - _Requirements: 5.1_
  - [ ] 2.2 Implement authenticate flow
    - Wrapper around `supabase.auth.signInWithPassword` that checks `profiles.locked_until` before delegating, returns a single generic error for any invalid-credentials case, and increments/resets `failed_login_count`
    - _Requirements: 5.1, 5.2, 5.7_
  - [ ]\* 2.3 Write property test for authentication outcomes
    - **Property 11: Authentication outcomes are correct and non-revealing**
    - **Validates: Requirements 5.1, 5.2**
  - [ ] 2.4 Implement session validation and timeout
    - `validateSession` Postgres function checking `last_activity_at` against the configurable `session_timeout_minutes` value read from `global_config` (created in Task 3.1), updating `last_activity_at` on each validated request
    - _Requirements: 5.6_
  - [ ] 2.5 Implement authorize permission map and RLS helper functions
    - `authorize(session_id, action)` Postgres function backed by a static `PermissionKey -> Role[]` map; add reusable SQL helper functions (e.g. `current_role()`, `current_office_owner_id()`) for use in RLS policies throughout the schema
    - _Requirements: 5.3, 5.4, 5.5_
  - [ ]\* 2.6 Write property test for role-based access control
    - **Property 12: Role-based access control is enforced for every restricted action**
    - **Validates: Requirements 5.3, 5.4, 5.5**
  - [ ] 2.7 Implement configureSecurityPolicy
    - Admin-only RPC that **updates** `session_timeout_minutes`, `lockout_threshold`, and `lockout_duration_minutes` in the existing `global_config` table (created and seeded in Task 3.1 — this task does not create the table), with validation and lockout enforcement wired into `authenticate`
    - _Requirements: 5.7, 5.8_
  - [ ]\* 2.8 Write property test for session timeout and lockout configuration
    - **Property 13: Session timeout and account lockout are enforced per configuration**
    - **Validates: Requirements 5.6, 5.7, 5.8**

- [ ] 3. Shared foundation: configuration, categories, notification queue, audit log, and seed
  - [ ] 3.1 Create global_config migration with seeded defaults
    - Migration for a `global_config` table (single-row, `CHECK (id = 1)` guard) holding `session_timeout_minutes`, `lockout_threshold`, `lockout_duration_minutes`, `reminder_lead_time_days`, `reminder_frequency_days`, `payment_grace_period_days`, and `max_retries` (notification delivery), each with a positive-integer `CHECK` constraint and a sensible seeded default
    - Administrator-only `UPDATE` RLS policy plus read access for the application role; Task 2.7 (`configureSecurityPolicy`), Task 3.7 (payment grace period), and Task 20.5 (reminder configuration) all **write to** this table rather than creating it
    - _Requirements: 5.8, 8.2, 10.4, 11.6, 11.8_
  - [ ] 3.2 Create complaint_categories migration with seeded defaults
    - Migration for a `complaint_categories` table (unique category name, `is_active` flag) representing the "System's configured list" of Maintenance_Complaint categories, seeded with default categories (e.g. Electrical, Plumbing, HVAC, Cleaning, Security, Other); Administrator-writable via RLS, readable by all authenticated roles; referenced by `submitComplaint` validation in Task 10.2
    - _Requirements: 6.1, 6.5_
  - [ ] 3.3 Create notifications migration
    - Migration for `notification_channel`/`notification_status` enums and the `notifications` table (`retry_count`, `last_attempt_at`), created here because Tasks 6.2, 8.2, 8.4, 10.6, and 16.6 all enqueue Notifications inside their own transactions
    - _Requirements: 10.3_
  - [ ] 3.4 Implement enqueue SQL helper
    - Plain SQL insert helper composable inside any Postgres function transaction, used by Tasks 6.2, 8.2, 8.4, 10.6, and 16.6 to enqueue Notifications without a separate round trip
    - _Requirements: 4.1, 7.4, 9.3, 10.3_
  - [ ] 3.5 Create audit_log_entries migration
    - Migration for `audit_log_entries` (acting user, action type, entity type/id, timestamp, changed field, previous value, new value) with only `INSERT`/`SELECT` grants for the application/authenticated roles (no `UPDATE`/`DELETE`) and an Administrator-only `SELECT` RLS policy; created here because `create_allotment`, `transition_allotment`, `assign_complaint`, `handle_payment_callback`, and the owner-account flows insert audit rows inside their own transactions, and a failed audit insert must roll the whole action back
    - _Requirements: 14.1, 14.3, 14.4_
  - [ ] 3.6 Seed the first Administrator account
    - Seed migration / one-off bootstrap script (`supabase/seed`) that creates the initial `auth.users` record via the Supabase Auth admin API (service-role key, credentials taken from env, never committed) and sets its `profiles.role = ADMINISTRATOR`, resolving the chicken-and-egg problem that all account creation is Administrator-only
    - _Requirements: 5.3_
  - [ ] 3.7 Implement configurePaymentGracePeriod RPC
    - Administrator-only RPC validating `payment_grace_period_days` as a non-negative whole number of days before persisting it to `global_config`; consumed by `run_billing_cycle_job` when computing `due_date = billing_cycle_date + payment_grace_period_days`
    - _Requirements: 8.2_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Building and Office_Unit inventory
  - [ ] 5.1 Create Building/Office_Unit migration
    - Migration for `building`, `occupancy_status` enum, `office_unit` table with `CHECK` constraints (floor -5..200, size (0,1000000], base_rent [0.01,9999999.99], unit_code length 1-50) and `UNIQUE(building_id, unit_code)`
    - _Requirements: 1.1, 1.2, 1.6_
  - [ ]\* 5.2 Write property test for Office_Unit creation
    - **Property 1: Office_Unit creation respects bounds and produces a Vacant unit**
    - **Validates: Requirements 1.1, 1.2, 1.6**
  - [ ] 5.3 Implement unit listing, filtering, and occupancy summary
    - `listUnits(filter)` query supporting Building/Occupancy_Status filters and `getOccupancySummary(building_id?)` returning occupied/vacant/total counts
    - _Requirements: 1.3, 1.4, 2.3_
  - [ ]\* 5.4 Write property test for unit listing/filtering
    - **Property 2: Office_Unit listing and filtering reflect exactly the matching inventory**
    - **Validates: Requirements 1.3, 1.4**
  - [ ]\* 5.5 Write property test for occupancy counts partition
    - **Property 6: Occupancy counts always partition the full inventory**
    - **Validates: Requirements 2.3**
  - [ ] 5.6 Implement unit update
    - `updateUnit(unit_id, updates)` with the same bounds/uniqueness validation as creation, advancing `updated_at` without touching `occupancy_status`
    - _Requirements: 1.5, 1.7_
  - [ ]\* 5.7 Write property test for unit updates
    - **Property 3: Office_Unit updates change only the intended fields**
    - **Validates: Requirements 1.5, 1.7**
  - [ ] 5.8 Add RLS policies for building/office_unit
    - Administrator write access; Administrator and Maintenance_Staff read access
    - _Requirements: 5.3_

- [ ] 6. Office_Owner accounts
  - [ ] 6.1 Create office_owners migration
    - Migration for `owner_status` enum (`ACTIVE`, `DEACTIVATED`) and `office_owners` table (FK `user_id -> profiles.user_id`, unique `contact_email`, name/phone constraints)
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 6.2 Implement createOwner
    - Server-side flow (Edge Function using the Supabase Auth admin API) that creates the `auth.users` row, inserts `profiles`/`office_owners` rows, validates name/email/phone/password formats and email uniqueness, writes an `OWNER_CREATE` entry to `audit_log_entries`, and enqueues a login-instructions Notification — the audit insert and the owner insert share one transaction, so an audit failure rolls the account creation back
    - _Requirements: 4.1, 4.2, 4.3, 14.1_
  - [ ]\* 6.3 Write property test for owner account creation and profile updates
    - **Property 8: Office_Owner account creation and profile updates enforce validation and uniqueness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6**
  - [ ] 6.4 Implement updateOwnerProfile
    - RPC validating name/email/phone format and email uniqueness on self-service profile updates, and writing an `OWNER_MODIFY` audit entry (changed field, previous value, new value) inside the same transaction as the update
    - _Requirements: 4.5, 4.6, 14.1_
  - [ ] 6.5 Implement deactivateOwner
    - Admin-only flow revoking all active Supabase Auth sessions for the owner's `user_id`, setting `office_owners.status = DEACTIVATED`, and writing an `OWNER_DEACTIVATE` audit entry — atomically
    - _Requirements: 4.7, 14.1_
  - [ ]\* 6.6 Write property test for owner deactivation
    - **Property 10: Deactivating an Office_Owner account revokes access**
    - **Validates: Requirements 4.7**
  - [ ] 6.7 Add RLS policies for office_owners
    - Self-select/self-update for the owning Office_Owner; full access for Administrator
    - _Requirements: 4.4, 4.8_
  - [ ] 6.8 Implement owner-scoped query guard pattern
    - Shared query helper that parametrizes every owner-scoped read by the caller's resolved `office_owner_id` (never a client-supplied id), for reuse by later services
    - _Requirements: 4.4, 4.8_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Allotment and Lease management
  - [ ] 8.1 Create allotment/lease migration
    - Migration for `allotment_status` enum, `billing_cycle` type, `allotment` table (partial unique constraint: at most one `status = 'ACTIVE'` row per `office_unit_id`), and `lease` table (1:1 with allotment, `rent_amount > 0`, `end_date > start_date`)
    - _Requirements: 3.1, 3.2_
  - [ ] 8.2 Implement create_allotment RPC
    - `plpgsql` function: row-lock the Office_Unit, reject if `occupancy_status = OCCUPIED`, insert allotment (`ACTIVE`) + lease, set `occupancy_status = OCCUPIED`, insert the `ALLOTMENT_CREATE` row into `audit_log_entries` — all in one transaction, so an audit-write failure aborts the allotment
    - _Requirements: 2.1, 2.4, 3.1, 3.2, 14.1_
  - [ ]\* 8.3 Write property test for allotment creation atomicity
    - **Property 4: Allotment creation and Occupancy_Status transitions are atomic and mutually exclusive**
    - **Validates: Requirements 2.1, 2.4, 3.1, 3.2**
  - [ ] 8.4 Implement transition_allotment RPC
    - `plpgsql` function covering manual termination, admin-forced expiry with reason, scheduler-driven lease-end expiry, and manual forced expiry of past-due leases; rejects any transition on an already-terminal Allotment; atomically updates status + `occupancy_status = VACANT` + the `ALLOTMENT_TRANSITION` audit entry (changed field, previous status, new status) in the same transaction
    - _Requirements: 2.2, 3.3, 3.4, 3.5, 3.6, 3.7, 14.1_
  - [ ]\* 8.5 Write property test for allotment termination/expiration atomicity
    - **Property 5: Allotment termination/expiration and Occupancy_Status transitions are atomic and idempotent-guarded**
    - **Validates: Requirements 2.2, 3.3, 3.4, 3.5, 3.6, 3.7**
  - [ ] 8.6 Implement getAllotmentHistory
    - Query returning every Allotment for an Office_Unit with Office_Owner, lease dates, rent amount, and status
    - _Requirements: 3.8_
  - [ ]\* 8.7 Write property test for allotment history completeness
    - **Property 7: Allotment history is complete and accurate for a unit**
    - **Validates: Requirements 3.8**
  - [ ] 8.8 Add RLS policies for allotment/lease
    - Administrator full access; Office_Owner read-only access to their own Allotments/Leases
    - _Requirements: 4.4, 4.8_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Maintenance Complaint tracking
  - [ ] 10.1 Create maintenance complaint migration
    - Migration for `complaint_status` enum, `event_type` enum, `maintenance_complaint` table, and `complaint_event` table (append-only status/comment history)
    - _Requirements: 6.1, 7.1, 7.5_
  - [ ] 10.2 Implement submitComplaint
    - RPC validating the Office_Unit is currently allotted to the submitting owner, the category exists in `complaint_categories` (Task 3.2), and description is 1-2000 chars; creates the complaint with `status = OPEN` (attachment handling wired in Task 12)
    - _Requirements: 6.1, 6.4, 6.5_
  - [ ]\* 10.3 Write property test for complaint submission validation
    - **Property 14: Maintenance_Complaint submission validates ownership and input constraints**
    - **Validates: Requirements 6.1, 6.4, 6.5**
  - [ ] 10.4 Implement assign_complaint RPC
    - Atomic status=`ASSIGNED` + assignee update plus a `COMPLAINT_ASSIGN` insert into `audit_log_entries` in the same transaction; rejects if current status is `RESOLVED`
    - _Requirements: 7.2, 7.6, 14.1_
  - [ ]\* 10.5 Write property test for complaint assignment
    - **Property 16: Complaint assignment is atomic and gated on status**
    - **Validates: Requirements 7.2, 7.6**
  - [ ] 10.6 Implement update_complaint_status RPC
    - Requires `staff_id = complaint.assigned_to` (or Administrator); records status change with actor and timestamp; enqueues a Notification to the Office_Owner via the Task 3.4 helper
    - _Requirements: 7.3, 7.4, 7.7_
  - [ ]\* 10.7 Write property test for complaint status update restrictions
    - **Property 17: Complaint status updates are restricted to the assigned staff member and fully recorded**
    - **Validates: Requirements 7.3, 7.4, 7.7**
  - [ ] 10.8 Implement add_comment RPC
    - Appends a `COMMENT` `complaint_event` row without mutating prior entries
    - _Requirements: 7.5_
  - [ ]\* 10.9 Write property test for complaint comment history
    - **Property 18: Complaint comments are appended, never replacing history**
    - **Validates: Requirements 7.5**
  - [ ] 10.10 Implement complaint listing queries
    - `listComplaintsForOwner` (owner-scoped) and `listAllComplaints` (admin, with filters) including category/unit/owner/status/creation date
    - _Requirements: 6.2, 6.3, 7.1_
  - [ ]\* 10.11 Write property test for complaint visibility and history
    - **Property 15: Complaint visibility and history are accurate**
    - **Validates: Requirements 6.2, 6.3, 7.1**
  - [ ] 10.12 Add RLS policies for maintenance_complaint/complaint_event
    - Office_Owner: own complaints only; Maintenance_Staff: assigned complaints (update) and all complaints (read); Administrator: full access
    - _Requirements: 4.4, 4.8, 5.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. File storage (attachments and documents)
  - [ ] 12.1 Create file storage migration
    - Migration for `file_storage_config` (per-extension `file_type_accepted`, `max_file_size_mb`), `file_attachment` (linked to `maintenance_complaint`), and `document` (linked to `lease`/`office_owner`) tables
    - _Requirements: 13.4_
  - [ ] 12.2 Create Supabase Storage buckets
    - Create private buckets `complaint-attachments`, `owner-documents`, and `receipts` with a bucket-level `file_size_limit` ceiling and opaque (UUID-based) object key generation
    - _Requirements: 13.1_
  - [ ] 12.3 Implement configureFileTypes RPC
    - Admin-only RPC to upsert `file_storage_config` rows (extension, mime type, `file_type_accepted`) and `max_file_size_mb`
    - _Requirements: 13.4_
  - [ ] 12.4 Implement upload-attachment Edge Function
    - Validates size (≤10MB) and count (0-5 per complaint) against `file_storage_config`, uploads to `complaint-attachments`, inserts `file_attachment`; rejects (no row, no upload) on any violation
    - _Requirements: 6.1, 6.5_
  - [ ] 12.5 Implement upload-document Edge Function
    - Validates size/type against `file_storage_config`, uploads to `owner-documents`, inserts `document` linked to a Lease or Office_Owner; rejects (no row, no upload) on any violation
    - _Requirements: 13.1, 13.4, 13.5_
  - [ ]\* 12.6 Write property test for file upload validation and access scoping
    - **Property 32: File uploads are validated against configured type and size limits, and access is owner-scoped**
    - **Validates: Requirements 6.1, 6.5, 13.1, 13.2, 13.3, 13.4, 13.5**
  - [ ] 12.7 Implement Storage RLS policies
    - `owner_of_document`/`owner_of_attachment` resolver functions plus policies on `storage.objects`: Administrator full access, Office_Owner limited to their own linked Documents/attachments
    - _Requirements: 13.2, 13.3, 13.6_
  - [ ] 12.8 Implement document/attachment download flow
    - Client-side signed URL minting (`createSignedUrl`) gated by the RLS policies above, for both Admin_Portal and Owner_Portal
    - _Requirements: 13.2, 13.3_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Billing and invoicing
  - [ ] 14.1 Create invoice migration
    - Migration for `invoice_status` enum and `invoice` table with `UNIQUE(lease_id, billing_cycle_key)`
    - _Requirements: 8.1, 8.6_
  - [ ] 14.2 Implement run_billing_cycle_job function
    - Per-lease loop, each in its own subtransaction: skip (no invoice) if Allotment status is `TERMINATED`/`EXPIRED`, skip if an Invoice already exists for the cycle, otherwise insert Invoice (`status = DUE`, `due_date = billing_cycle_date + global_config.payment_grace_period_days`) plus the `INVOICE_GENERATE` audit entry in the same subtransaction
    - _Requirements: 8.1, 8.2, 8.6, 8.7, 14.1_
  - [ ]\* 14.3 Write property test for invoice generation
    - **Property 19: Invoice generation is correct, deduplicated, and gated on Allotment status**
    - **Validates: Requirements 8.1, 8.2, 8.6, 8.7**
  - [ ] 14.4 Implement mark_overdue_job function
    - Flips any `DUE`/`PARTIALLY_PAID` Invoice whose `due_date < as_of` to `OVERDUE`
    - _Requirements: 8.4_
  - [ ]\* 14.5 Write property test for overdue transition
    - **Property 20: Invoice status transitions to Overdue exactly when due and unpaid**
    - **Validates: Requirements 8.4**
  - [ ] 14.6 Implement invoice query/reporting functions
    - `getInvoicesForOwner` and `getBillingReport` (filterable by Building, Office_Owner, status) sharing one underlying aggregation used later by dashboard export
    - _Requirements: 8.3, 8.5_
  - [ ] 14.7 Add RLS policies for invoice
    - Administrator full access; Office_Owner read-only access to their own Invoices
    - _Requirements: 4.4, 4.8_
  - [ ]\* 14.8 Write property test for owner/admin Invoice views
    - **Property 21: Owner and Admin billing views reflect exactly the matching data** — Invoice-view portion only: the Owner_Portal shows exactly that owner's Invoices with correct status, and the Admin_Portal billing/outstanding-dues view shows exactly the subset matching the Building/Office_Owner/status filters. The export-matches-filters portion of Property 21 is covered by Task 25.7.
    - **Validates: Requirements 8.3, 8.5**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Payment processing
  - [ ] 16.1 Create payment migration
    - Migration for `gateway_type` enum, `payment` table (unique `(gateway, transaction_ref)` among `status = 'COMPLETED'` rows), and `payment_verification_failures` table
    - _Requirements: 9.4, 9.7, 9.8_
  - [ ] 16.2 Implement initiate_payment RPC
    - Validates the Invoice belongs to the caller, is not `PAID`, and the requested amount is between 0.01 and the outstanding due amount; inserts a `PENDING` payment attempt
    - _Requirements: 9.1, 9.6_
  - [ ]\* 16.3 Write property test for payment initiation bounds
    - **Property 22: Payment initiation is bounded and gated on Invoice status**
    - **Validates: Requirements 9.1, 9.6**
  - [ ] 16.4 Implement PaymentGatewayAdapter interface and UPI adapter
    - Shared TypeScript `PaymentGatewayAdapter` interface (`createPaymentIntent`, `verifyCallback`, `parseCallback`); UPI adapter in a `webhooks-upi` Edge Function verifying the shared-secret HMAC against `X-UPI-Signature`
    - _Requirements: 9.5_
  - [ ] 16.5 Implement Razorpay adapter
    - Razorpay adapter in a `webhooks-razorpay` Edge Function verifying `X-Razorpay-Signature` (HMAC-SHA256 over the raw body with the webhook secret)
    - _Requirements: 9.5_
  - [ ] 16.6 Implement handle_payment_callback RPC
    - `SECURITY DEFINER` function: locked read on `(gateway, transaction_ref)`, discard if already `COMPLETED`; on success, upsert Payment, recompute Invoice status (`PAID`/`PARTIALLY_PAID`), generate Receipt, insert the `PAYMENT_RECORD` audit entry, and enqueue the receipt Notification, all atomically; on failure/cancellation, record the failed attempt without changing Invoice status
    - _Requirements: 9.2, 9.4, 9.7, 9.8, 14.1_
  - [ ]\* 16.7 Write property test for payment-driven invoice status
    - **Property 23: Successful payments update Invoice status consistently with amounts received**
    - **Validates: Requirements 9.2, 9.4**
  - [ ]\* 16.8 Write property test for failed/cancelled payments
    - **Property 24: Failed or cancelled payments never change Invoice state**
    - **Validates: Requirements 9.3**
  - [ ]\* 16.9 Write property test for callback authentication and idempotency
    - **Property 25: Payment_Gateway callbacks are authenticated and idempotent**
    - **Validates: Requirements 9.5, 9.7, 9.8**
  - [ ] 16.10 Implement create-payment-intent Edge Function
    - Server-side call to the resolved adapter's `createPaymentIntent`, keeping gateway API secrets out of the browser
    - _Requirements: 9.1_
  - [ ] 16.11 Add RLS policies for payment
    - Administrator full access; Office_Owner read-only access to their own Payments
    - _Requirements: 4.4, 4.8_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Receipts
  - [ ] 18.1 Create receipt migration
    - Migration for `receipt` table with `UNIQUE(payment_id)`
    - _Requirements: 10.1_
  - [ ] 18.2 Wire Receipt generation into the payment callback transaction
    - `generateReceipt` insert inside `handle_payment_callback`'s transaction (Task 16.6), with a follow-up Edge Function rendering the PDF and writing it to the `receipts` bucket, storing the path in `receipt.document_ref`
    - _Requirements: 10.1_
  - [ ] 18.3 Implement downloadReceipt
    - Signed-URL flow (`createSignedUrl`) rejecting any request where the receipt's `office_owner_id` doesn't match the requester or the backing Payment isn't completed
    - _Requirements: 10.2, 10.5_
  - [ ]\* 18.4 Write property test for receipt generation and access control
    - **Property 26: Receipt generation and access control are correct**
    - **Validates: Requirements 10.1, 10.2, 10.5**
  - [ ] 18.5 Add RLS policies for receipt table and receipts bucket
    - Administrator full access; Office_Owner limited to their own Receipts
    - _Requirements: 4.4, 4.8_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Notification delivery and reminders
  - [ ] 20.1 Implement notify Edge Function
    - `deliverPending` Edge Function reading the `notifications` queue (Task 3.3), sending EMAIL/SMS via configured providers, incrementing `retry_count` with backoff, marking `FAILED` once `global_config.max_retries` is exhausted
    - _Requirements: 10.3, 10.4, 11.3, 11.8_
  - [ ]\* 20.2 Write property test for notification retry policy
    - **Property 27: Notification delivery follows the configured retry policy**
    - **Validates: Requirements 10.3, 10.4, 11.8**
  - [ ] 20.3 Implement send_reminder_job function
    - Selects Invoices within the reminder lead time (`DUE`/`PARTIALLY_PAID`) or `OVERDUE`, re-checks current status immediately before enqueueing, respects `reminder_frequency_days`, and enqueues EMAIL (and SMS where a phone exists)
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.7_
  - [ ]\* 20.4 Write property test for reminder timing and channel selection
    - **Property 28: Reminders are sent at the correct times, through the correct channels, and stop exactly when an Invoice is Paid**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.7**
  - [ ] 20.5 Implement reminder configuration RPC
    - Admin-only RPC validating `reminder_lead_time_days`/`reminder_frequency_days` as positive whole numbers before **updating** the existing `global_config` row (created in Task 3.1)
    - _Requirements: 11.6, 11.9_
  - [ ]\* 20.6 Write property test for reminder configuration validation
    - **Property 29: Reminder configuration validates positive whole-day values**
    - **Validates: Requirements 11.6, 11.9**
  - [ ] 20.7 Schedule pg_cron jobs
    - Daily schedules for `run_billing_cycle_job`, `mark_overdue_job`, the lease-expiry auto-transition job (calling `transition_allotment` for leases past `end_date`), `send_reminder_job`, and periodic invocation of the `notify` Edge Function via `pg_net`
    - _Requirements: 3.5, 8.1, 8.4, 11.1, 11.2, 11.7_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Audit log querying and verification
  - [ ] 22.1 Implement query_audit_log RPC
    - Admin-only RPC over `audit_log_entries` (Task 3.5) filtering by `actor_user_id`, `action_type`, and date range
    - _Requirements: 14.2_
  - [ ]\* 22.2 Write property test for audit entry creation
    - **Property 33: Audit log entries are created for key actions, with correct field-level detail on modification** — exercises the audit inserts written as part of `create_allotment` (8.2), `transition_allotment` (8.4), `assign_complaint` (10.4), `run_billing_cycle_job` (14.2), `handle_payment_callback` (16.6), `createOwner` (6.2), `updateOwnerProfile` (6.4), and `deactivateOwner` (6.5)
    - **Validates: Requirements 14.1**
  - [ ]\* 22.3 Write property test for audit log queries
    - **Property 34: Audit log queries return exactly the matching entries**
    - **Validates: Requirements 14.2**
  - [ ]\* 22.4 Write property test for audit log immutability
    - **Property 35: Audit log entries are immutable**
    - **Validates: Requirements 14.3**
  - [ ]\* 22.5 Write property test for audit write failure rollback
    - **Property 36: Audit log write failures abort the triggering action**
    - **Validates: Requirements 14.4**

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Cross-tenant isolation hardening
  - [ ] 24.1 Audit and consolidate owner-scoped RLS and query guards
    - Review RLS policies and service-layer query guards across `allotment`, `invoice`, `payment`, `receipt`, `maintenance_complaint`, `document`, and `notifications` for consistent `office_owner_id`/`user_id` predicates
    - _Requirements: 4.4, 4.8, 6.4, 10.5, 13.6_
  - [ ]\* 24.2 Write property test for cross-tenant data isolation
    - **Property 9: Cross-tenant data isolation holds for every owner-scoped resource**
    - **Validates: Requirements 4.4, 4.8, 6.4, 10.5, 13.6**

- [ ] 25. Dashboard and reporting
  - [ ] 25.1 Implement getOccupancyDashboard
    - Query returning total/occupied/vacant counts and `occupancy_rate_percent = ROUND(occupied / total * 100)`
    - _Requirements: 12.1_
  - [ ] 25.2 Implement getRevenueDashboard
    - Query returning total rent collected, total outstanding dues, and overdue Invoice count for a date range (default: current calendar month) and optional Building filter
    - _Requirements: 12.2, 12.3, 12.4_
  - [ ]\* 25.3 Write property test for dashboard calculations
    - **Property 30: Dashboard occupancy and revenue figures are calculated correctly and respect the Building filter**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
  - [ ] 25.4 Implement date range validation
    - Reject any `date_range` where `start_date > end_date`
    - _Requirements: 12.6_
  - [ ]\* 25.5 Write property test for invalid date range rejection
    - **Property 31: Invalid date range selections are rejected**
    - **Validates: Requirements 12.6**
  - [ ] 25.6 Implement exportReport
    - CSV/PDF export reusing the exact dashboard/billing aggregation queries so exports always match the on-screen filtered figures
    - _Requirements: 12.5_
  - [ ]\* 25.7 Write property test for export matching the active filters
    - **Property 21: Owner and Admin billing views reflect exactly the matching data** — export portion only: for any Building/Office_Owner/status/date-range filter combination, the exported CSV/PDF contains exactly the same filtered billing and occupancy rows as the on-screen view. The Invoice-view portion of Property 21 is covered by Task 14.8.
    - **Validates: Requirements 12.5**

- [ ] 26. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Admin_Portal frontend
  - [ ] 27.1 Scaffold Admin_Portal application
    - Build out `apps/admin-portal` (Vite + React + TypeScript, from Task 1.1): React Router route tree, Supabase client initialization (using `packages/shared`), TanStack Query provider, session/auth guard, RBAC-aware navigation (Administrator vs Maintenance_Staff)
    - _Requirements: 5.1, 5.3, 5.4_
  - [ ] 27.2 Implement Office_Unit management screens
    - List/filter (Building, Occupancy_Status), create, and update screens with inline validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ] 27.3 Implement occupancy summary widget
    - Displays occupied/vacant/total counts, reusable on the unit list and dashboard
    - _Requirements: 2.3_
  - [ ] 27.4 Implement Allotment management screens
    - Create Allotment (vacant units only), terminate, expire (with reason), and per-unit Allotment history view
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [ ] 27.5 Implement Office_Owner account management screens
    - Create, deactivate, and list Office_Owner accounts with validation error display
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  - [ ] 27.6 Implement Maintenance_Complaint admin screens
    - List all complaints (category, unit, owner, status, created date), assign to staff, add comments, view status history
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  - [ ] 27.7 Implement Billing and Invoice admin screens
    - Billing history / outstanding dues view filterable by Building, Office_Owner, and Invoice status
    - _Requirements: 8.3, 8.5_
  - [ ] 27.8 Implement Dashboard screen
    - Occupancy and revenue summary, Building filter, date range selector (with validation error on invalid range), CSV/PDF export controls
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  - [ ] 27.9 Implement Document management screens
    - Upload (Lease/Office_Owner), list, and download documents with file-size/type error display
    - _Requirements: 13.1, 13.2, 13.5_
  - [ ] 27.10 Implement Audit Log viewer screen
    - Filter by User, action type, and date range; display acting user, action type, affected record id, timestamp
    - _Requirements: 14.2_
  - [ ] 27.11 Implement system configuration screens
    - Security policy (session timeout, lockout threshold/duration), reminder configuration (lead time, frequency), payment grace period configuration (days added to the billing cycle date to compute the Invoice due date, calling the Task 3.7 RPC), and file-type/size configuration — all writing to `global_config`/`file_storage_config` with inline validation errors
    - _Requirements: 5.8, 8.2, 11.6, 11.9, 13.4_
  - [ ]\* 27.12 Write unit tests for Admin_Portal screens
    - Cover validation/error-message rendering for unit, allotment, owner, and configuration forms
    - _Requirements: 1.6, 1.7, 3.4, 4.2, 4.3, 8.2, 12.6_

- [ ] 28. Owner_Portal frontend
  - [ ] 28.1 Scaffold Owner_Portal application
    - Build out `apps/owner-portal` (Vite + React + TypeScript, from Task 1.1): React Router route tree, Supabase client initialization (using `packages/shared`), TanStack Query provider, session/auth guard restricted to the `OFFICE_OWNER` role
    - _Requirements: 5.1, 4.4_
  - [ ] 28.2 Implement Owner profile screens
    - View and update name/email/phone with validation error display
    - _Requirements: 4.5, 4.6_
  - [ ] 28.3 Implement Invoices and Payment screens
    - Invoice list with status, UPI/Razorpay payment initiation flow (amount bounds, already-Paid rejection), payment failure messaging
    - _Requirements: 9.1, 9.3, 9.6_
  - [ ] 28.4 Implement Receipts screen
    - List completed Payments and download their Receipts
    - _Requirements: 10.2_
  - [ ] 28.5 Implement Maintenance_Complaint screens
    - Submit (category from the configured `complaint_categories` list, description, 0-5 attachments), list with status, and detail view with status history and comments
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 28.6 Implement Documents screen
    - View and download documents linked to the authenticated owner's Lease/account only
    - _Requirements: 13.3, 13.6_
  - [ ]\* 28.7 Write unit tests for Owner_Portal screens
    - Cover validation/error-message rendering for profile updates, payment initiation, and complaint submission
    - _Requirements: 4.6, 6.5, 9.1, 9.6_

- [ ] 29. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (property/unit tests) and can be skipped for a faster MVP, but are strongly recommended given the correctness properties defined in design.md.
- Property tests run against a local/CI Supabase Postgres instance via `supabase-js` and `fast-check`, per the Testing Strategy in design.md; Payment_Gateway and Notification providers are mocked/stubbed in these tests.
- Task 3 creates the shared tables that later transactions write to (configuration, complaint categories, notification queue, audit log) plus the bootstrap Administrator, so no later task has to retrofit them; each RPC writes its audit entry and enqueues its Notification as part of its own original implementation.
- Property 21 is split across two sub-tasks: Task 14.8 covers the Owner/Admin Invoice views (8.3, 8.5) and Task 25.7 covers exports matching the active filters (12.5); together they cover the whole property.
- RLS policies and service-layer checks are implemented together in each task, per the design's "in addition to, not instead of" enforcement model — neither layer is deferred to a later pass.
- Checkpoints are placed after each major backend capability so failures are caught before dependent capabilities are built on top of them.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "3.1", "3.3"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.4", "2.5", "3.4", "3.6"]
    },
    {
      "id": 3,
      "tasks": ["2.3", "2.6", "2.7", "3.2", "3.5", "3.7"]
    },
    {
      "id": 4,
      "tasks": ["2.8", "5.1", "6.1"]
    },
    {
      "id": 5,
      "tasks": ["5.2", "5.3", "5.6", "6.2", "6.4", "6.5", "6.7", "6.8"]
    },
    {
      "id": 6,
      "tasks": ["5.4", "5.5", "5.7", "5.8", "6.3", "6.6"]
    },
    {
      "id": 7,
      "tasks": ["8.1", "10.1"]
    },
    {
      "id": 8,
      "tasks": ["8.2", "12.1"]
    },
    {
      "id": 9,
      "tasks": ["8.3", "8.4", "8.6", "8.8", "10.2", "12.2", "12.3"]
    },
    {
      "id": 10,
      "tasks": ["8.5", "8.7", "10.3", "12.4", "12.5", "14.1"]
    },
    {
      "id": 11,
      "tasks": ["10.4", "10.6", "10.10", "10.12", "12.6", "12.7", "12.8", "14.2"]
    },
    {
      "id": 12,
      "tasks": ["10.5", "10.7", "10.8", "10.9", "10.11", "14.3", "14.4", "16.1"]
    },
    {
      "id": 13,
      "tasks": ["14.5", "14.6", "14.7", "16.2", "16.4"]
    },
    {
      "id": 14,
      "tasks": ["14.8", "16.3", "16.5", "18.1"]
    },
    {
      "id": 15,
      "tasks": ["16.6", "18.5"]
    },
    {
      "id": 16,
      "tasks": ["16.7", "16.8", "16.9", "16.10", "16.11", "18.2", "20.1"]
    },
    {
      "id": 17,
      "tasks": ["18.3", "20.2", "20.3", "20.5"]
    },
    {
      "id": 18,
      "tasks": ["18.4", "20.4", "20.6", "20.7", "22.1"]
    },
    {
      "id": 19,
      "tasks": ["22.2", "22.3", "22.4", "22.5"]
    },
    {
      "id": 20,
      "tasks": ["24.1"]
    },
    {
      "id": 21,
      "tasks": ["24.2", "25.1", "25.2", "25.4"]
    },
    {
      "id": 22,
      "tasks": ["25.3", "25.5", "25.6"]
    },
    {
      "id": 23,
      "tasks": ["25.7"]
    },
    {
      "id": 24,
      "tasks": ["27.1", "28.1"]
    },
    {
      "id": 25,
      "tasks": ["27.2", "27.3", "27.5", "28.2", "28.5", "28.6"]
    },
    {
      "id": 26,
      "tasks": ["27.4", "27.6", "27.9", "28.3", "28.4"]
    },
    {
      "id": 27,
      "tasks": ["27.7", "27.8", "27.10", "27.11"]
    },
    {
      "id": 28,
      "tasks": ["27.12", "28.7"]
    }
  ]
}
```
