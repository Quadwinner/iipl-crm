import { useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useQueryClient } from '@tanstack/react-query'
import {
  createPaymentIntent,
  EdgeFunctionError,
  formatCurrency,
  invoiceKeys,
  paymentKeys,
  receiptKeys,
  type InvoiceRow,
} from '@itoby/shared/owner'
import { Badge, Button, Card, Field } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { theme } from '../../theme/theme'

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? ''

/**
 * Paying one invoice.
 *
 * The gateway secret never reaches the device: `create-payment-intent` holds it
 * and records the PENDING attempt under the caller's own JWT. Razorpay has no
 * React Native SDK here, so its browser checkout runs inside a WebView from a
 * page built on the fly — the same checkout the web portal opens.
 *
 * Nothing here marks an invoice paid. The gateway webhook is the only authority
 * on the outcome; a successful checkout callback just means "stop waiting and
 * refresh", which is why the success copy says confirmation is still pending.
 */
export function PayInvoiceScreen({
  invoice,
  onDone,
}: {
  invoice: InvoiceRow
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(String(invoice.outstanding_amount))
  const [checkout, setCheckout] = useState<{ html: string } | null>(null)
  const [upi, setUpi] = useState<{ uri: string; reference: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    void queryClient.invalidateQueries({ queryKey: receiptKeys.all })
  }

  async function start(gateway: 'RAZORPAY' | 'UPI') {
    setError(null)
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (value > invoice.outstanding_amount) {
      setError(`That is more than the ${formatCurrency(invoice.outstanding_amount)} outstanding.`)
      return
    }

    // Before the intent, not after: create-payment-intent records a PENDING
    // payment server-side, so checking the key afterwards leaves an orphan
    // PENDING row against a real invoice every time someone taps Pay. Locally the
    // key comes from .env, but an EAS build reads its env from EAS environment
    // variables — a build missing the key would quietly accumulate them.
    if (gateway === 'RAZORPAY' && !RAZORPAY_KEY_ID) {
      setError('Razorpay is not configured in this build. Use UPI or contact the IIPL office.')
      return
    }

    setBusy(true)
    try {
      const intent = await createPaymentIntent(supabase(), {
        invoiceId: invoice.invoice_id,
        gateway,
        amount: value,
      })

      if (gateway === 'RAZORPAY') {
        setCheckout({
          html: razorpayPage({
            keyId: RAZORPAY_KEY_ID,
            orderId: String(intent.gateway_data.orderId ?? intent.reference),
            amountPaise: Number(intent.gateway_data.amountPaise ?? intent.amount * 100),
            description: `Invoice ${invoice.billing_cycle_key} · ${invoice.unit_code}`,
          }),
        })
        return
      }

      setUpi({ uri: String(intent.gateway_data.upiUri ?? ''), reference: intent.reference })
      refresh()
    } catch (cause) {
      setError(readableError(cause))
    } finally {
      setBusy(false)
    }
  }

  if (checkout) {
    return (
      <WebView
        source={{ html: checkout.html, baseUrl: 'https://checkout.razorpay.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={(event) => {
          const message = event.nativeEvent.data
          setCheckout(null)
          refresh()
          if (message === 'dismissed') return
          Alert.alert(
            'Payment submitted',
            'We will update this invoice once the gateway confirms it, which can take a moment.',
          )
          onDone()
        }}
      />
    )
  }

  if (upi) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Complete the UPI payment</Text>
        <Text style={styles.body}>
          Open the request in your UPI app. This invoice updates once the gateway confirms the
          payment, which can take a moment.
        </Text>
        <Card>
          <Field label="Reference" value={upi.reference} />
        </Card>
        <Button
          label="Open UPI app"
          onPress={() => {
            void Linking.openURL(upi.uri).catch(() =>
              setError('No UPI app could handle that request.'),
            )
          }}
        />
        <View style={styles.spacer} />
        <Button label="Done" variant="ghost" onPress={onDone} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pay invoice {invoice.billing_cycle_key}</Text>

      <Card>
        <Field label="Unit" value={invoice.unit_code} />
        <Field label="Total" value={formatCurrency(invoice.total_amount)} />
        <Field label="Paid" value={formatCurrency(invoice.paid_amount)} />
        <Field label="Outstanding" value={formatCurrency(invoice.outstanding_amount)} />
        <View style={styles.badge}>
          <Badge label={invoice.status} />
        </View>
      </Card>

      <Text style={styles.label}>Amount to pay</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholderTextColor={theme.color.muted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button label="Pay with Razorpay" busy={busy} onPress={() => void start('RAZORPAY')} />
        <Button label="Pay with UPI" variant="ghost" busy={busy} onPress={() => void start('UPI')} />
      </View>
    </ScrollView>
  )
}

function readableError(cause: unknown): string {
  if (cause instanceof EdgeFunctionError) {
    if (cause.code === 'INVOICE_ALREADY_PAID') return 'This invoice is already paid.'
    if (cause.code === 'PERMISSION_DENIED') return 'You are not permitted to pay this invoice.'
  }
  return cause instanceof Error ? cause.message : String(cause)
}

/**
 * Razorpay's checkout is a script that must run in a browser context. The page
 * carries no secret — only the publishable key id and the order id the Edge
 * Function created — and reports back through postMessage.
 */
function razorpayPage(options: {
  keyId: string
  orderId: string
  amountPaise: number
  description: string
}): string {
  const config = JSON.stringify({
    key: options.keyId,
    order_id: options.orderId,
    amount: options.amountPaise,
    currency: 'INR',
    name: 'IIPL Renting',
    description: options.description,
    theme: { color: theme.color.accent },
  })
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:${theme.color.bg}}</style></head><body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var post = function (m) { window.ReactNativeWebView.postMessage(m) }
  var options = ${config}
  options.handler = function () { post('paid') }
  options.modal = { ondismiss: function () { post('dismissed') } }
  try { new Razorpay(options).open() } catch (e) { post('dismissed') }
</script></body></html>`
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  title: { color: theme.color.text, fontSize: 20, fontWeight: '800', marginBottom: theme.space(4) },
  body: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginBottom: theme.space(4) },
  label: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(4), marginBottom: theme.space(2) },
  input: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.color.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  badge: { marginTop: theme.space(3) },
  actions: { gap: theme.space(3), marginTop: theme.space(6) },
  spacer: { height: theme.space(3) },
  error: { color: theme.color.danger, fontSize: 13, marginTop: theme.space(4), lineHeight: 20 },
})
