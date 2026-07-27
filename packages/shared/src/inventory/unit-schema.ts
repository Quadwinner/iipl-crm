/**
 * Office_Unit form validation shared by both portals and any Edge Function
 * (Requirements 1.1, 1.6, 1.7). Bounds mirror the `office_unit` check constraints
 * exactly, so client-side rejection and database rejection agree.
 */

import { z } from 'zod'

export const UNIT_BOUNDS = {
  unitCodeMinLength: 1,
  unitCodeMaxLength: 50,
  floorMin: -5,
  floorMax: 200,
  sizeSqftMax: 1_000_000,
  baseRentMin: 0.01,
  baseRentMax: 9_999_999.99,
} as const

/**
 * Occupancy_Status is deliberately absent: it changes only through Allotment
 * transitions, never through a unit create or edit (Requirement 1.5).
 */
export const officeUnitInputSchema = z.object({
  building_id: z.uuid('Select a building.'),
  unit_code: z
    .string()
    .trim()
    .min(UNIT_BOUNDS.unitCodeMinLength, 'Enter a unit code of 1 to 50 characters.')
    .max(UNIT_BOUNDS.unitCodeMaxLength, 'Unit code must be 50 characters or fewer.'),
  floor: z
    .number({ error: 'Enter a floor between -5 and 200.' })
    .int('Floor must be a whole number.')
    .min(UNIT_BOUNDS.floorMin, 'Floor must be -5 or above.')
    .max(UNIT_BOUNDS.floorMax, 'Floor must be 200 or below.'),
  size_sqft: z
    .number({ error: 'Enter a size in square feet.' })
    .gt(0, 'Size must be greater than 0 sq ft.')
    .max(UNIT_BOUNDS.sizeSqftMax, 'Size must be 1,000,000 sq ft or less.'),
  base_rent_amount: z
    .number({ error: 'Enter a base rent amount.' })
    .min(UNIT_BOUNDS.baseRentMin, 'Base rent must be at least 0.01.')
    .max(UNIT_BOUNDS.baseRentMax, 'Base rent must be 9,999,999.99 or less.'),
})

export type OfficeUnitInput = z.infer<typeof officeUnitInputSchema>
