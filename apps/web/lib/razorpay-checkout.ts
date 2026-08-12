/**
 * Opens Razorpay Checkout for an invoice payment.
 * Publishable key is fetched from the backend — never stored in the frontend bundle.
 */
export async function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
}): Promise<void> {
  await loadRazorpayScript();

  const RazorpayConstructor = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!RazorpayConstructor) {
    throw new Error("Razorpay SDK failed to load");
  }

  const rzp = new RazorpayConstructor({
    key: options.keyId,
    amount: Math.round(options.amount * 100),
    currency: options.currency.toUpperCase(),
    name: "Workforce 360",
    description: options.description,
    order_id: options.orderId,
    theme: { color: "#2563eb" },
  });

  rzp.open();
}

type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void };

function loadRazorpayScript(): Promise<void> {
  if ((window as Window & { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}
