import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Phone, Mail } from 'lucide-react'
import { DetailTabs } from '@rental-admin/components/detail-tabs'
import { PageHeader } from '@rental-admin/components/page-header'
import { AllotmentStatusBadge } from '@rental-admin/features/allotments/allotment-status-badge'
import {
  EditLeaseRentDialog,
  type EditRentRequest,
} from '@rental-admin/features/allotments/edit-lease-rent-dialog'
import type { AllotmentListRow } from '@rental-admin/features/allotments/api'
import { InvoiceStatusBadge } from '@rental-admin/features/billing/status-badge'
import { ComplaintStatusBadge } from '@rental-admin/features/complaints/status-badge'
import { UploadDocumentDialog } from '@rental-admin/features/documents/upload-document-dialog'
import { DeactivateOwnerDialog } from '@rental-admin/features/owners/deactivate-owner-dialog'
import {
  useTenant,
  useTenantAllotments,
  useTenantComplaints,
  useTenantDocuments,
  useTenantInvoices,
  useTenantPayments,
} from '@rental-admin/features/tenants/api'
import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@itoby/ui'
import { formatCurrency, formatDate, formatDateTime } from '@rental-admin/lib/format'
import type { Uuid } from '@itoby/shared'

export function TenantDetailPage() {
  const { ownerId } = useParams<{ ownerId: string }>()
  const navigate = useNavigate()
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [editRent, setEditRent] = useState<EditRentRequest | null>(null)

  const tenant = useTenant(ownerId as Uuid | undefined)
  const allotments = useTenantAllotments(ownerId ? (ownerId as Uuid) : null)
  const invoices = useTenantInvoices(ownerId ? (ownerId as Uuid) : null)
  const payments = useTenantPayments(ownerId ? (ownerId as Uuid) : null)
  const complaints = useTenantComplaints(ownerId ? (ownerId as Uuid) : null)
  const documents = useTenantDocuments(ownerId ? (ownerId as Uuid) : null)

  const activeAllotments = useMemo(
    () => (allotments.data ?? []).filter((row) => row.status === 'ACTIVE'),
    [allotments.data],
  )

  if (!ownerId) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Missing tenant id.
      </p>
    )
  }

  if (tenant.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (tenant.isError || !tenant.data) {
    return (
      <section className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/app/rental/tenants')}>
          <ArrowLeft aria-hidden="true" />
          Back to tenants
        </Button>
        <p role="alert" className="text-destructive text-sm">
          {tenant.error?.message ?? 'Tenant not found.'}
        </p>
      </section>
    )
  }

  const owner = tenant.data

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to="/app/rental/tenants">
            <ArrowLeft aria-hidden="true" />
            Back to tenants
          </Link>
        </Button>

        <PageHeader
          title={owner.name}
          description={owner.contact_email}
          actions={
            <>
              <UploadDocumentDialog defaultOwnerId={owner.id} />
              {owner.status === 'ACTIVE' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeactivateOpen(true)}
                >
                  Deactivate
                </Button>
              ) : null}
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={owner.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {owner.status === 'ACTIVE' ? 'Active' : 'Deactivated'}
          </Badge>
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Phone aria-hidden="true" className="size-3.5" />
            {owner.phone}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <Mail aria-hidden="true" className="size-3.5" />
            {owner.contact_email}
          </span>
          <span className="text-muted-foreground">
            Tenant since {formatDate(owner.created_at.slice(0, 10))}
          </span>
        </div>
      </div>

      <DetailTabs
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <div className="space-y-4">
                <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Active leases
                </h2>
                {allotments.isPending ? (
                  <Skeleton className="h-24 w-full" />
                ) : activeAllotments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active allotments.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeAllotments.map((row) => (
                      <Card key={row.id} className="py-4">
                        <CardHeader className="px-4 pb-2">
                          <CardTitle className="flex items-center justify-between gap-2 text-base">
                            <span>
                              {row.building_name} · {row.unit_code}
                            </span>
                            <AllotmentStatusBadge status={row.status} />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 px-4 text-sm">
                          <p>
                            {formatDate(row.lease_start)} – {formatDate(row.lease_end)}
                          </p>
                          <p className="font-mono tabular-nums">
                            {formatCurrency(row.rent_amount)} · {row.billing_cycle ?? '—'}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRent({ allotment: row as AllotmentListRow })}
                          >
                            Edit rent
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'leases',
            label: 'Leases',
            content: allotments.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (allotments.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No allotment history.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(allotments.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.building_name} · {row.unit_code}
                      </TableCell>
                      <TableCell>
                        {formatDate(row.lease_start)} – {formatDate(row.lease_end)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(row.rent_amount)}
                      </TableCell>
                      <TableCell>
                        <AllotmentStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ),
          },
          {
            id: 'invoices',
            label: 'Invoices',
            content: invoices.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (invoices.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No invoices yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoices.data ?? []).map((row) => (
                    <TableRow key={row.invoice_id}>
                      <TableCell>{row.billing_cycle_key}</TableCell>
                      <TableCell>
                        {row.unit_code}
                        <span className="text-muted-foreground"> · {row.building_name}</span>
                      </TableCell>
                      <TableCell>{formatDate(row.due_date)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(row.total_amount)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ),
          },
          {
            id: 'payments',
            label: 'Payments',
            content: payments.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (payments.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No payments recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDateTime(row.completed_at ?? row.created_at)}</TableCell>
                      <TableCell>{row.billing_cycle_key ?? '—'}</TableCell>
                      <TableCell>{row.gateway}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ),
          },
          {
            id: 'complaints',
            label: 'Complaints',
            content: complaints.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (complaints.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No complaints.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(complaints.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>
                        {row.unit_code}
                        <span className="text-muted-foreground"> · {row.building_name}</span>
                      </TableCell>
                      <TableCell>{formatDateTime(row.created_at)}</TableCell>
                      <TableCell>
                        <ComplaintStatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ),
          },
          {
            id: 'documents',
            label: 'Documents',
            content: documents.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : (documents.data ?? []).length === 0 ? (
              <p className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                <FileText aria-hidden="true" className="size-4" />
                No documents linked to this tenant.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Lease</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(documents.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.file_name}.{row.file_extension}
                      </TableCell>
                      <TableCell>
                        {row.lease_id
                          ? `${formatDate(row.lease_start)} – ${formatDate(row.lease_end)}`
                          : 'Account'}
                      </TableCell>
                      <TableCell>{formatDateTime(row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ),
          },
        ]}
      />

      <DeactivateOwnerDialog
        owner={deactivateOpen ? owner : null}
        onClose={() => {
          setDeactivateOpen(false)
          void tenant.refetch()
        }}
      />

      <EditLeaseRentDialog request={editRent} onClose={() => setEditRent(null)} />
    </section>
  )
}
