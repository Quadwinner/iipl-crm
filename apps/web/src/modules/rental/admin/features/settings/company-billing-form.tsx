import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@rental-admin/components/ui/button'
import { Input } from '@rental-admin/components/ui/input'
import { Label } from '@rental-admin/components/ui/label'
import { Textarea } from '@rental-admin/components/ui/textarea'
import { mapDbError } from '@rental-admin/lib/db-error'
import { useConfigureCompanyBilling, type GlobalConfigRow } from './api'

const schema = z.object({
  company_legal_name: z.string().trim().min(1, 'Company name is required.'),
  company_gstin: z.string().trim().min(1, 'GSTIN is required.'),
  company_address: z.string().trim().min(1, 'Address is required.'),
  company_phone: z.string().trim().min(1, 'Phone is required.'),
  company_email: z.email('Enter a valid email.'),
  company_place_of_supply: z.string().trim().min(1, 'Place of supply is required.'),
  bank_name: z.string().trim().min(1, 'Bank name is required.'),
  bank_account_number: z.string().trim().min(1, 'Account number is required.'),
  bank_ifsc: z.string().trim().min(1, 'IFSC is required.'),
  bank_branch: z.string().trim().min(1, 'Branch is required.'),
  invoice_series_prefix: z.string().trim().min(1, 'Invoice prefix is required.'),
  default_gst_rate_percent: z
    .number({ error: 'Enter GST rate.' })
    .min(0)
    .max(100),
  default_hsn_sac: z.string().trim().min(4).max(12),
})

type FormValues = z.infer<typeof schema>

export function CompanyBillingForm({ config }: { config: GlobalConfigRow }) {
  const save = useConfigureCompanyBilling()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_legal_name: config.company_legal_name,
      company_gstin: config.company_gstin,
      company_address: config.company_address,
      company_phone: config.company_phone,
      company_email: config.company_email,
      company_place_of_supply: config.company_place_of_supply,
      bank_name: config.bank_name,
      bank_account_number: config.bank_account_number,
      bank_ifsc: config.bank_ifsc,
      bank_branch: config.bank_branch,
      invoice_series_prefix: config.invoice_series_prefix,
      default_gst_rate_percent: Number(config.default_gst_rate_percent),
      default_hsn_sac: config.default_hsn_sac,
    },
  })

  async function onSubmit(values: FormValues) {
    setFormError(null)
    try {
      await save.mutateAsync(values)
      toast.success('Company billing profile saved')
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Company & tax invoice details</h2>
        <p className="text-muted-foreground text-sm">
          Shown on GST tax invoices and payment receipts (legal name, GSTIN, bank details).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company_legal_name">Legal name</Label>
          <Input id="company_legal_name" {...register('company_legal_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_gstin">GSTIN</Label>
          <Input id="company_gstin" {...register('company_gstin')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_place_of_supply">Place of supply</Label>
          <Input id="company_place_of_supply" {...register('company_place_of_supply')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="company_address">Address</Label>
          <Textarea id="company_address" rows={3} {...register('company_address')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_phone">Phone</Label>
          <Input id="company_phone" {...register('company_phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_email">Email</Label>
          <Input id="company_email" type="email" {...register('company_email')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice_series_prefix">Invoice series</Label>
          <Input id="invoice_series_prefix" placeholder="IIPL" {...register('invoice_series_prefix')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_gst_rate_percent">GST rate (%)</Label>
          <Input
            id="default_gst_rate_percent"
            type="number"
            step="0.01"
            {...register('default_gst_rate_percent', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_hsn_sac">Default HSN/SAC (rent)</Label>
          <Input id="default_hsn_sac" {...register('default_hsn_sac')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank</Label>
          <Input id="bank_name" {...register('bank_name')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_account_number">Account number</Label>
          <Input id="bank_account_number" {...register('bank_account_number')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_ifsc">IFSC</Label>
          <Input id="bank_ifsc" {...register('bank_ifsc')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_branch">Branch</Label>
          <Input id="bank_branch" {...register('bank_branch')} />
        </div>
      </div>

      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        Save billing profile
      </Button>
    </form>
  )
}
