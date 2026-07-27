import type { OccupancyStatus } from '@itoby/shared'

export const OCCUPANCY_LABELS: Record<OccupancyStatus, string> = {
  OCCUPIED: 'Occupied',
  VACANT: 'Vacant',
}

export const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
})

export const sizeFormat = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
