const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  prefill?: { name?: string; email?: string }
  handler?: () => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayCheckout {
  open: () => void
}

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayCheckout

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

let scriptPromise: Promise<RazorpayConstructor> | null = null

/** Loaded on demand so the gateway script is not fetched until a payment is started. */
function loadCheckoutScript(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)

  scriptPromise ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay checkout could not be loaded.'))
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Razorpay checkout could not be loaded. Check your connection.'))
    }
    document.head.append(script)
  })

  return scriptPromise
}

export interface RazorpayCheckoutRequest {
  keyId: string
  orderId: string
  amountPaise: number
  description: string
  ownerName: string
  ownerEmail: string
}

/**
 * Opens Razorpay Checkout and resolves once it closes, whether the owner completed or
 * dismissed it. The gateway webhook is the only authority on the outcome, so neither
 * path is treated as a confirmed payment here (Requirements 9.2, 9.5).
 */
export async function openRazorpayCheckout(request: RazorpayCheckoutRequest): Promise<void> {
  const Razorpay = await loadCheckoutScript()

  await new Promise<void>((resolve) => {
    const checkout = new Razorpay({
      key: request.keyId,
      order_id: request.orderId,
      amount: request.amountPaise,
      currency: 'INR',
      name: 'IIPL office rentals',
      description: request.description,
      prefill: { name: request.ownerName, email: request.ownerEmail },
      handler: () => resolve(),
      modal: { ondismiss: () => resolve() },
    })
    checkout.open()
  })
}
