import type { NavigatorScreenParams } from '@react-navigation/native'
import type { AdminComplaintRow } from '@itoby/shared/admin'
import type { ComplaintRow, InvoiceRow } from '@itoby/shared/owner'
import type { Lead } from '@itoby/shared/site'

/**
 * Every route in the app, and what it takes.
 *
 * These exist because a wrong `navigate()` target is invisible without them:
 * the home screen shipped a button pointing at a screen that only existed in
 * the signed-out navigator, and nothing caught it until the button was pressed
 * on a real phone. With these param lists, that is a type error.
 *
 * The lists are flat rather than nested per navigator. Screens are addressed by
 * name across the whole app, and React Navigation resolves to the nearest match,
 * so a flat list describes what a caller can actually reach.
 */
export type SiteParamList = {
  Home: undefined
  Services: undefined
  Products: undefined
  Contact: undefined
}

export type AppTabParamList = {
  Apps: undefined
  Explore: undefined
  Account: undefined
}

export type RentalParamList = {
  RentalTabs: undefined
  Leases: undefined
  Invoices: undefined
  Complaints: undefined
  More: undefined
  PayInvoice: { invoice: InvoiceRow }
  NewComplaint: undefined
  ComplaintDetail: { complaint: ComplaintRow }
  Receipts: undefined
  Documents: undefined
  Reminders: undefined
  Profile: undefined
}

export type RentalAdminParamList = {
  AdminTabs: undefined
  Overview: undefined
  Queue: undefined
  Property: undefined
  People: undefined
  Manage: undefined
  AdminUnits: { buildingId?: string; name?: string } | undefined
  AdminComplaintDetail: { complaint: AdminComplaintRow }
  AdminStaff: undefined
  AdminAllotments: undefined
  AdminBilling: undefined
  AdminExpenses: undefined
  AdminAudit: undefined
  AdminSettings: undefined
}

export type WorkspaceParamList = {
  Leads: undefined
  LeadDetail: { lead: Lead }
}

export type RootParamList = SiteParamList &
  AppTabParamList &
  RentalParamList &
  RentalAdminParamList &
  WorkspaceParamList & {
    Site: NavigatorScreenParams<SiteParamList> | undefined
    App: NavigatorScreenParams<AppTabParamList> | undefined
    SignIn: undefined
    Rental: undefined
    Workspace: undefined
    About: undefined
    Industries: undefined
    Quote: undefined
    ServiceDetail: { slug: string }
    ModuleComingSoon: { moduleKey: string }
  }

/**
 * Makes the untyped default `useNavigation()` and `useRoute()` resolve against
 * RootParamList, so every call site is checked without each one restating it.
 */
type AppRoutes = RootParamList

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppRoutes {}
  }
}
