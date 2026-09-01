import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import { Textarea } from '@itoby/ui'
import { LEAD_STATUSES, useLeads, useUpdateLeadStatus, type Lead, type LeadStatus } from '@/features/leads/api'

const STATUS_TONE: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-amber-100 text-amber-800',
  QUALIFIED: 'bg-violet-100 text-violet-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-muted text-muted-foreground',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(lead.staff_notes)
  const update = useUpdateLeadStatus()

  function move(status: LeadStatus) {
    update.mutate(
      { id: lead.id, status, notes },
      {
        onSuccess: () => toast.success(`Marked ${status.toLowerCase()}`),
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }

  return (
    <>
      <tr className="hover:bg-muted/40 cursor-pointer border-b" onClick={() => setOpen((v) => !v)}>
        <td className="px-4 py-3">
          <p className="font-medium">{lead.full_name}</p>
          <p className="text-muted-foreground text-xs">{lead.email}</p>
        </td>
        <td className="text-muted-foreground px-4 py-3 text-sm">{lead.company || '—'}</td>
        <td className="text-muted-foreground px-4 py-3 text-sm">{lead.service_interest || '—'}</td>
        <td className="text-muted-foreground px-4 py-3 text-sm">{lead.budget_range || '—'}</td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[lead.status]}`}>
            {lead.status}
          </span>
        </td>
        <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
          {formatDate(lead.created_at)}
        </td>
      </tr>

      {open ? (
        <tr className="bg-muted/20 border-b">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Enquiry</p>
                <p className="whitespace-pre-wrap">{lead.message || '—'}</p>
                <dl className="text-muted-foreground grid grid-cols-[7rem_1fr] gap-y-1 pt-2 text-xs">
                  <dt>Phone</dt>
                  <dd>{lead.phone || '—'}</dd>
                  <dt>Source</dt>
                  <dd>{lead.source}</dd>
                  <dt>Page</dt>
                  <dd>{lead.page_path || '—'}</dd>
                  {lead.module_key ? (
                    <>
                      <dt>Product</dt>
                      <dd>{lead.module_key}</dd>
                    </>
                  ) : null}
                </dl>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor={`notes-${lead.id}`} className="text-muted-foreground text-xs tracking-wide uppercase">
                    Staff notes
                  </label>
                  <Textarea
                    id={`notes-${lead.id}`}
                    className="bg-background mt-1"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {LEAD_STATUSES.filter((s) => s !== lead.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() => move(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

/**
 * Leads inbox. Reads are gated by the LEAD_READ policy and status changes by
 * update_lead_status(), so a user without the permission sees an empty table
 * and cannot transition anything even if this UI were reachable.
 */
export function LeadsPage() {
  const leads = useLeads()
  const [filter, setFilter] = useState<LeadStatus | 'ALL'>('ALL')

  const rows = useMemo(
    () => (leads.data ?? []).filter((l) => filter === 'ALL' || l.status === filter),
    [leads.data, filter],
  )
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: leads.data?.length ?? 0 }
    for (const s of LEAD_STATUSES) c[s] = (leads.data ?? []).filter((l) => l.status === s).length
    return c
  }, [leads.data])

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enquiries from the contact and quote forms. Click a row to read it and change its status.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['ALL', ...LEAD_STATUSES] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => setFilter(s as LeadStatus | 'ALL')}
          >
            {s} <Badge className="ml-1.5">{counts[s] ?? 0}</Badge>
          </Button>
        ))}
      </div>

      {leads.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : leads.error ? (
        <p role="alert" className="text-destructive text-sm">
          {(leads.error as Error).message}
        </p>
      ) : rows.length === 0 ? (
        <div className="surface-card text-muted-foreground p-10 text-center text-sm">
          {filter === 'ALL' ? 'No enquiries yet.' : `No leads with status ${filter}.`}
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted-foreground border-b text-xs tracking-wide uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Interest</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
