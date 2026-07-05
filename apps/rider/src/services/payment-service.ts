import type { PaymentMethod } from '../types';

export const PAYMENT_METHODS: { key: PaymentMethod; name: string; icon: string }[] = [
  { key: 'cash', name: 'Cash', icon: '💵' },
  { key: 'upi', name: 'UPI', icon: '📱' },
  { key: 'phonepe', name: 'PhonePe', icon: '📲' },
  { key: 'google_pay', name: 'Google Pay', icon: '🟢' },
  { key: 'paytm', name: 'Paytm', icon: '🔷' },
  { key: 'wallet', name: 'Namma Wallet', icon: '👛' },
];

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function generateInvoiceNumber(rideId: string): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const shortId = rideId.substring(0, 8).toUpperCase();
  return `INV-NR-${dateStr}-${shortId}`;
}

export function calculateGst(amount: number, gstPercent: number = 5): { taxableAmount: number; gst: number; total: number } {
  const taxableAmount = amount / (1 + gstPercent / 100);
  const gst = amount - taxableAmount;
  return { taxableAmount, gst, total: amount };
}
