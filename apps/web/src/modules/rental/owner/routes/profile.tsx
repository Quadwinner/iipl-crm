import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@rental-owner/components/page-header'
import { Badge } from '@rental-owner/components/ui/badge'
import { Button } from '@rental-owner/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@rental-owner/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@rental-owner/components/ui/empty'
import { Separator } from '@rental-owner/components/ui/separator'
import { Skeleton } from '@rental-owner/components/ui/skeleton'
import { useAuth } from '@rental-owner/auth/use-auth'
import { daysUntil, useOwnerLeases, type OwnerLeaseRow } from '@rental-owner/features/lease/api'
import { useOwnerProfile } from '@rental-owner/features/profile/api'
import { ProfileForm } from '@rental-owner/features/profile/profile-form'
import { formatCurrency, formatDate } from '@rental-owner/lib/format'

const STATUS_LABELS: Record<OwnerLeaseRow['status'], string> = {
  ACTIVE: 'Active',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
}

function billingCycleLabel(cycle: OwnerLeaseRow['billing_cycle']): string {
  if (!cycle) return '—'
  return cycle.charAt(0) + cycle.slice(1).toLowerCase()
}

function OfficeUnitCard({ lease }: { lease: OwnerLeaseRow }) {
  const remaining = daysUntil(lease.lease_end)

  return (
    <Card className="surface-card py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>
            {lease.building_name} · {lease.unit_code}
          </span>
          <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {STATUS_LABELS[lease.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">Building</dt>
            <dd className="font-medium">{lease.building_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Office unit</dt>
            <dd className="font-medium">{lease.unit_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Floor</dt>
            <dd>{lease.floor ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Size</dt>
            <dd>{lease.size_sqft != null ? `${lease.size_sqft} sq ft` : '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Lease period</dt>
            <dd>
              {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Rent</dt>
            <dd className="font-mono tabular-nums">
              {formatCurrency(lease.rent_amount)} · {billingCycleLabel(lease.billing_cycle)}
            </dd>
          </div>
          {lease.status === 'ACTIVE' && remaining !== null ? (
            <div>
              <dt className="text-muted-foreground text-xs">Lease remaining</dt>
              <dd>
                {remaining < 0
                  ? `Ended ${Math.abs(remaining)} days ago`
                  : remaining === 0
                    ? 'Ends today'
                    : `${remaining} days`}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground text-xs">Allotted on</dt>
            <dd>{formatDate(lease.created_at.slice(0, 10))}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export function ProfileScreen() {
  const { owner } = useAuth()
  const profile = useOwnerProfile(owner?.userId ?? '')
  const leases = useOwnerLeases()

  const activeLeases = useMemo(
    () => (leases.data ?? []).filter((row) => row.status === 'ACTIVE'),
    [leases.data],
  )
  const pastLeases = useMemo(
    () => (leases.data ?? []).filter((row) => row.status !== 'ACTIVE'),
    [leases.data],
  )

  const loading = profile.isPending || leases.isPending

  return (
    <section className="space-y-6">
      <PageHeader
        title="Your profile"
        description="Contact details, account status, and your allotted office units."
      />

      {loading ? (
        <div className="max-w-2xl space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : profile.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {profile.error.message}
        </p>
      ) : (
        <>
          <div className="max-w-md">
            <div className="surface-card mb-4 p-5 sm:p-6">
              <h2 className="section-label mb-3">Contact details</h2>
              <ProfileForm profile={profile.data} />
            </div>
          </div>

          <Separator />

          <div className="surface-card max-w-md p-5 sm:p-6">
            <h2 className="section-label mb-3">Account</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{profile.data.status === 'ACTIVE' ? 'Active' : 'Deactivated'}</dd>
              <dt className="text-muted-foreground">Owner since</dt>
              <dd>{formatDate(profile.data.created_at.slice(0, 10))}</dd>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd>{formatDate(profile.data.updated_at.slice(0, 10))}</dd>
            </dl>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <h2 className="section-label">Office details</h2>
                <p className="text-muted-foreground text-sm">
                  Buildings and units currently or previously allotted to you.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to="/app/rental/lease">View full lease</Link>
              </Button>
            </div>

          {leases.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {leases.error.message}
            </p>
          ) : activeLeases.length === 0 && pastLeases.length === 0 ? (
            <Empty className="max-w-2xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No office allotted</EmptyTitle>
                <EmptyDescription>
                  When staff allot an office unit to your account, the building and lease
                  details appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="max-w-2xl space-y-6">
              {activeLeases.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Active</h3>
                  <div className="grid gap-3">
                    {activeLeases.map((lease) => (
                      <OfficeUnitCard key={lease.id} lease={lease} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No active office allotment.</p>
              )}

              {pastLeases.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Past allotments</h3>
                  <div className="grid gap-3">
                    {pastLeases.map((lease) => (
                      <OfficeUnitCard key={lease.id} lease={lease} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          </div>
        </>
      )}
    </section>
  )
}
