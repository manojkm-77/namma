import { prisma } from '@namma/db';
import crypto from 'crypto';

/**
 * Generate PhonePe / UPI Direct Payment URI
 */
export function generateUpiDeepLink(upiId: string, driverName: string, amount: number, rideId: string): string {
  const encodedName = encodeURIComponent(driverName);
  const encodedNote = encodeURIComponent(`Payment for Ride ${rideId.slice(0, 8)}`);
  
  // Format: upi://pay?pa=address&pn=name&am=amount&tn=note
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount.toFixed(2)}&tn=${encodedNote}`;
}

/**
 * Handle commission deduction from Driver's Wallet
 * Deducts flat Rs 5.00 per ride. If balance falls below -Rs 100, duty status is set to 'offline'.
 */
export async function processRideCommission(driverId: string, rideId: string): Promise<void> {
  const COMMISSION_FEE = 5.00;
  
  await prisma.$transaction(async (tx) => {
    // 1. Locate or create driver wallet
    let wallet = await tx.driverWallet.findUnique({
      where: { driverId }
    });
    
    if (!wallet) {
      wallet = await tx.driverWallet.create({
        data: { driverId, balance: 0.00 }
      });
    }

    // 2. Deduct commission fee
    const updatedWallet = await tx.driverWallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: COMMISSION_FEE
        }
      }
    });

    // 3. Log transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: COMMISSION_FEE,
        transactionType: 'debit',
        description: `Platform fee deduction for Ride ID: ${rideId}`,
        referenceId: rideId
      }
    });

    // 4. If balance is below -100, toggle driver duty to offline
    if (Number(updatedWallet.balance) < -100.00) {
      await tx.driver.update({
        where: { id: driverId },
        data: {
          dutyStatus: 'offline',
          isActive: false
        }
      });
      console.log(`Driver ${driverId} wallet balance (${updatedWallet.balance}) fell below -100. Toggled offline.`);
    }
  });
}

/**
 * Verify Razorpay Webhook Signatures
 */
export function verifyRazorpaySignature(
  payloadString: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex');
      
    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay signature validation failed:', error);
    return false;
  }
}
