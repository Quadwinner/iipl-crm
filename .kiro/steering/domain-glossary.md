---
inclusion: manual
---

# Domain Glossary

Use these terms exactly; they match requirements.md and the database schema.

**Office_Owner** — the *tenant* occupying a unit, not the building's owner. Billed for rent,
raises complaints, has an Owner_Portal login.

**Company_Staff** — IIPL employees. Two roles: `ADMINISTRATOR` (full control) and
`MAINTENANCE_STAFF` (complaints assigned to them only).

**Building** → contains many **Office_Unit**. A unit's `unit_code` is unique per building,
not globally.

**Occupancy_Status** — `VACANT` | `OCCUPIED`. Derived from allotment state and always
updated in the same transaction as the allotment change.

**Allotment** — links an Office_Unit to an Office_Owner. Status `ACTIVE` | `TERMINATED` |
`EXPIRED`. At most one `ACTIVE` per unit, enforced by a partial unique index.

**Lease** — 1:1 with an Allotment. Holds rent amount, billing cycle, start/end dates.

**Invoice** — one per lease per billing cycle, deduped by `(lease_id, billing_cycle_key)`.
Status `DUE` | `PARTIALLY_PAID` | `PAID` | `OVERDUE`.

**Payment** — against an Invoice, via UPI or Razorpay. Unique per
`(gateway, transaction_ref)` — this is the webhook idempotency key.

**Receipt** — one per completed Payment, generated in the same transaction.

**Maintenance_Complaint** — raised by an Office_Owner for their own unit. Status `OPEN` |
`ASSIGNED` | `IN_PROGRESS` | `RESOLVED`. History lives in append-only `complaint_event`.

## Naming

Requirements use `Office_Owner`; database uses `office_owners`; TypeScript uses
`OfficeOwner`. Keep the mapping consistent and don't invent synonyms — "tenant",
"landlord" and "customer" do not appear in this system.
