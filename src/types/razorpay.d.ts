import { getPackedSettings } from "http2";

// Type declarations for Razorpay Checkout SDK
interface RazorpayOptions {
  key: string;
  amount: number;           // in paise (₹1 = 100 paise)
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;        // from backend (optional for client-only flow)
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    backdropclose?: boolean;
    escape?: boolean;
    animation?: boolean;
  };
  handler: (response: RazorpayResponse) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, callback: (response: RazorpayResponse) => void): void;
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}
n  m, , mxb, m admin getPackedSettingshbsxvjh kishan