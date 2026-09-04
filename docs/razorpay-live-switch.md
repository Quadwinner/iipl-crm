# Switching Razorpay from test to live

Everything is on `rzp_test_*` today. Payments work end to end in the sandbox,
and no real money can move. This is the full list of what has to change, in the
order it has to change, so the switch does not leave the system half-live.

Do this only when you are ready to take real payments. Nothing below is needed
for the internal testing track — testers are better off on the test key, where
they can run the whole flow with Razorpay's test cards.

## The one that breaks quietly

**The webhook is the sole authority on whether an invoice is paid.** Nothing
marks an invoice PAID from a client callback — that is deliberate, because a
client can lie or simply lose the network before it reports back. `payment.captured`
arriving at our endpoint is the only thing that settles it.

So if you switch the keys but forget the webhook, every payment succeeds at
Razorpay, the customer is charged, and the invoice stays DUE. Nobody gets an
error. You find out when a tenant asks why they have been billed twice.

Register the live webhook **before** you switch the keys.

## 1. Razorpay dashboard, live mode

Live mode needs the account activated — KYC completed and the business verified.
That is not instant, so start it early.

In **Settings → Webhooks**, on the **live** dashboard, add:

| Field | Value |
| --- | --- |
| URL | `https://kfybapljugojovvdajfd.supabase.co/functions/v1/webhooks-razorpay` |
| Secret | generate one, keep it — it becomes `RAZORPAY_WEBHOOK_SECRET` |
| Events | `payment.captured`, `order.paid`, `payment.failed` |

Those three are what `outcomeForEvent` in
`supabase/functions/webhooks-razorpay/adapter.ts` understands. Subscribing to
more is harmless; subscribing to fewer means an outcome never arrives.

The endpoint is public by design — `verify_jwt = false` in
`supabase/config.toml`, because Razorpay cannot present a Supabase JWT. The
signature check in the adapter is what makes that safe, and it is why the
webhook secret has to match exactly.

Then copy the live **Key ID** and **Key Secret** from **Settings → API Keys**.

## 2. Supabase edge function secrets

Project-wide, so setting them once covers both functions that need them —
`create-payment-intent` creates the order, `webhooks-razorpay` verifies the
callback, and both import the same adapter.

```
supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxxxxxxx \
  RAZORPAY_KEY_SECRET=xxxxxxxx \
  RAZORPAY_WEBHOOK_SECRET=xxxxxxxx
```

Or Dashboard → Project Settings → Edge Functions → Secrets.

Redeploy the functions afterwards so they pick the new values up:

```
supabase functions deploy create-payment-intent
supabase functions deploy webhooks-razorpay
```

## 3. The public key, in three clients

Only the Key ID goes to a client. The secret never does — it would be readable
by anyone who opens the bundle.

| Client | Variable | Where to set it |
| --- | --- | --- |
| Mobile | `EXPO_PUBLIC_RAZORPAY_KEY_ID` | EAS → `production` environment |
| Superapp web | `VITE_RAZORPAY_KEY_ID` | Vercel → the `web` project |
| Owner portal | `VITE_RAZORPAY_KEY_ID` | Vercel → the `owner-portal` project |

Leave the EAS `preview` and `development` environments on the test key. That is
what keeps internal testing from moving real money.

Both are build-time values, inlined into the bundle. **Changing them requires a
rebuild and redeploy** — a variable change alone does nothing to what is already
shipped.

```
eas env:create --environment production \
  --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value rzp_live_xxxxxxxx --force
eas build --platform android --profile production
```

## 4. Verify before you announce it

In this order, because each step proves the one before it:

1. Raise a small real invoice — ten rupees — against a test tenant.
2. Pay it from the app with a real card.
3. Confirm `payment` has a COMPLETED row with a `pay_live_*` reference.
4. Confirm the invoice flipped to PAID. **If it did not, the webhook is not
   wired** — check Razorpay's webhook delivery log for the response code.
5. Confirm the receipt generated and downloads.
6. Refund it from the Razorpay dashboard.

## Where these live in the code

- `supabase/functions/webhooks-razorpay/adapter.ts` — reads all three secrets;
  creates orders, verifies signatures, maps events to outcomes.
- `supabase/functions/create-payment-intent/index.ts` — imports that adapter.
- `apps/mobile/src/modules/rental/pay-invoice.tsx` — reads the Expo variable.
- `apps/web/src/modules/rental/owner/features/invoices/pay-invoice-dialog.tsx`
  and the same file under `apps/owner-portal/` — read the Vite variable.

All three clients guard on a missing key *before* creating a payment intent, so
an unset variable shows a clear message instead of leaving orphan PENDING rows.
