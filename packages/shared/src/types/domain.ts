/**
 * Hand-maintained domain types mirroring the Data Models section of
 * `.kiro/specs/office-rental-crm/design.md`.
 *
 * These are the shapes the portals work with. Row types generated from the live
 * database schema live in `database.types.ts` (regenerated via `pnpm gen:types`);
 * once the migrations exist, these types should stay structurally aligned with them.
 *
 * Monetary and size values are `numeric` in Postgres and are carried as `string`
 * where exactness matters at the boundary; they are typed as `number` here for
 * form/display use, matching the bounds documented in requirements.md.
 */

// ── Shared scalar aliases ────────────────────────────────────────────────────
export type Uuid = string
/** ISO-8601 date, e.g. `2025-06-01` (Postgres `date`). */
export type IsoDate = string
/** ISO-8601 timestamp with timezone (Postgres `timestamptz`). */
export type IsoTimestamp = string

// ── Enumerations (string unions: Postgres ENUM types) ────────────────────────
export const ROLES = ['ADMINISTRATOR', 'MAINTENANCE_STAFF', 'OFFICE_OWNER'] as const
export type Role = (typeof ROLES)[number]

export const OCCUPANCY_STATUSES = ['VACANT', 'OCCUPIED'] as const
export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number]

export const OWNER_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const
export type OwnerStatus = (typeof OWNER_STATUSES)[number]

export const ALLOTMENT_STATUSES = ['ACTIVE', 'TERMINATED', 'EXPIRED'] as const
export type AllotmentStatus = (typeof ALLOTMENT_STATUSES)[number]

export const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]

export const INVOICE_STATUSES = ['DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PAYMENT_GATEWAYS = ['UPI', 'RAZORPAY'] as const
export type GatewayType = (typeof PAYMENT_GATEWAYS)[number]

export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const COMPLAINT_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number]

export const COMPLAINT_EVENT_TYPES = ['STATUS_CHANGE', 'COMMENT'] as const
export type ComplaintEventType = (typeof COMPLAINT_EVENT_TYPES)[number]

export const NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'IN_APP'] as const
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

// ── Entities ────────────────────────────────────────────────────────────────
export interface Profile {
  user_id: Uuid
  role: Role
  failed_login_count: number
  locked_until: IsoTimestamp | null
  last_activity_at: IsoTimestamp | null
}

export interface Building {
  id: Uuid
  name: string
  address: string
  created_at: IsoTimestamp
  updated_at: IsoTimestamp
}

export interface OfficeUnit {
  id: Uuid
  building_id: Uuid
  /** 1-50 chars, unique within `building_id`. */
  unit_code: string
  /** -5 to 200. */
  floor: number
  /** (0, 1000000]. */
  size_sqft: number
  /** [0.01, 9999999.99]. */
  base_rent_amount: number
  occupancy_status: OccupancyStatus
  created_at: IsoTimestamp
  updated_at: IsoTimestamp
}

export interface OfficeOwner {
  id: Uuid
  /** `auth.users.id` / `profiles.user_id`. */
  user_id: Uuid
  name: string
  contact_email: string
  phone: string
  status: OwnerStatus
  created_at: IsoTimestamp
  updated_at: IsoTimestamp
}

export interface Allotment {
  id: Uuid
  office_unit_id: Uuid
  office_owner_id: Uuid
  status: AllotmentStatus
  created_at: IsoTimestamp
  terminated_at: IsoTimestamp | null
  expiration_reason: string | null
}

export interface Lease {
  id: Uuid
  allotment_id: Uuid
  start_date: IsoDate
  end_date: IsoDate
  rent_amount: number
  billing_cycle: BillingCycle
  billing_day: number
}

export interface Invoice {
  id: Uuid
  lease_id: Uuid
  office_owner_id: Uuid
  office_unit_id: Uuid
  billing_period_start: IsoDate
  billing_period_end: IsoDate
  /** Dedup key, e.g. `2025-06`; unique with `lease_id`. */
  billing_cycle_key: string
  rent_amount: number
  additional_charges: number
  total_amount: number
  due_date: IsoDate
  status: InvoiceStatus
  created_at: IsoTimestamp
}

export interface Payment {
  id: Uuid
  invoice_id: Uuid
  office_owner_id: Uuid
  gateway: GatewayType
  /** Unique per `gateway` — the idempotency key for gateway callbacks. */
  transaction_ref: string
  amount: number
  status: PaymentStatus
  created_at: IsoTimestamp
  completed_at: IsoTimestamp | null
  failure_reason: string | null
}

export interface Receipt {
  id: Uuid
  payment_id: Uuid
  office_owner_id: Uuid
  office_unit_id: Uuid
  invoice_period: string
  amount_paid: number
  payment_gateway: GatewayType
  transaction_ref: string
  generated_at: IsoTimestamp
  /** Object path inside the Supabase Storage receipts bucket. */
  document_ref: string | null
}

export interface MaintenanceComplaint {
  id: Uuid
  office_unit_id: Uuid
  office_owner_id: Uuid
  category: string
  /** 1-2000 chars. */
  description: string
  status: ComplaintStatus
  assigned_to: Uuid | null
  created_at: IsoTimestamp
  resolved_at: IsoTimestamp | null
}

export interface ComplaintEvent {
  id: Uuid
  complaint_id: Uuid
  actor_user_id: Uuid
  event_type: ComplaintEventType
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus | null
  comment_text: string | null
  created_at: IsoTimestamp
}

export interface FileAttachment {
  id: Uuid
  complaint_id: Uuid
  file_name: string
  file_type: string
  size_bytes: number
  storage_ref: string
  uploaded_at: IsoTimestamp
}

export interface Document {
  id: Uuid
  lease_id: Uuid | null
  office_owner_id: Uuid | null
  file_name: string
  file_type: string
  size_bytes: number
  storage_ref: string
  uploaded_at: IsoTimestamp
}

export interface Notification {
  id: Uuid
  user_id: Uuid
  channel: NotificationChannel
  notification_type: string
  payload: Record<string, unknown>
  status: NotificationStatus
  retry_count: number
  last_attempt_at: IsoTimestamp | null
  created_at: IsoTimestamp
}

export interface AuditLogEntry {
  id: Uuid
  actor_user_id: Uuid | null
  action_type: string
  entity_type: string
  entity_id: Uuid
  field_name: string | null
  old_value: string | null
  new_value: string | null
  timestamp: IsoTimestamp
}
