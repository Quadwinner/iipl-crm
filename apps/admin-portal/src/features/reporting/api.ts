import { useMutation, useQuery } from '@tanstack/react-query'
import {
  assertValidDateRange,
  currentCalendarMonth,
  DateRangeError,
  exportReport,
  fetchReportData,
  type DateRange,
  type ExportFormat,
  type ReportData,
  type Uuid,
} from '@itoby/shared'
import { downloadFile } from '@/lib/download'
import { supabase } from '@/lib/supabase'

export interface DashboardFilters {
  buildingId: Uuid | null
  startDate: string
  endDate: string
}

/** No selection means the current calendar month (Requirement 12.2). */
export function defaultDashboardFilters(): DashboardFilters {
  const month = currentCalendarMonth()
  return { buildingId: null, startDate: month.startDate, endDate: month.endDate }
}

export function dashboardRange(filters: DashboardFilters): DateRange {
  return { startDate: filters.startDate, endDate: filters.endDate }
}

/** Mirrors the database guard so an inverted range is rejected before any round trip. */
export function dateRangeError(filters: DashboardFilters): string | null {
  try {
    assertValidDateRange(dashboardRange(filters))
    return null
  } catch (error) {
    return error instanceof DateRangeError ? error.message : String(error)
  }
}

export const reportingKeys = {
  all: ['reporting'] as const,
  snapshot: (filters: DashboardFilters) =>
    ['reporting', 'snapshot', filters.buildingId, filters.startDate, filters.endDate] as const,
}

/**
 * One snapshot backs the whole dashboard — occupancy, revenue, and billing detail for the
 * active Building and date range (Requirements 12.1-12.4).
 */
export function useReportSnapshot(filters: DashboardFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportingKeys.snapshot(filters),
    enabled,
    queryFn: (): Promise<ReportData> =>
      fetchReportData(supabase(), {
        range: dashboardRange(filters),
        buildingId: filters.buildingId ?? undefined,
      }),
  })
}

/** Re-reads the same filtered RPCs, so the file matches what is on screen (Requirement 12.5). */
export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      filters,
      format,
    }: {
      filters: DashboardFilters
      format: ExportFormat
    }) => {
      const report = await exportReport(supabase(), {
        range: dashboardRange(filters),
        buildingId: filters.buildingId ?? undefined,
        format,
      })
      downloadFile(report.fileName, report.mimeType, report.content)
      return report.fileName
    },
  })
}
