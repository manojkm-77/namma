import { Hono } from 'hono';
import { prisma } from '@namma/db';
import { authGuard } from '../middleware/auth';
import {
  verifyPhonePeWebhookSignature,
  buildPhonePeInitPayload
} from '../services/phonepe';
import { sendGenericNotification } from '../services/fcm';
import crypto from 'crypto';

export const paymentRouter = new Hono();

// Required type import for PhonePe body
interface PhonePeWebhookBody {
  response: string;
}

// ─── PhonePe Webhook (Public — Signature Verified) ────────────────────────────

paymentRouter.post('/phonepe/webhook', async (c) => {
  const xVerifyHeader = c.req.header('X-VERIFY');
  const merchantTransactionId = c.req.header('X-MERCHANT-TRANSACTION-ID');

  if (!xVerifyHeader || !merchantTransactionId) {
    console.error('[PhonePe Webhook]: Missing required security headers.');
    return c.json({ code: 'HEADER_MISSING' }, 400);
  }

  let rawBody: PhonePeWebhookBody;
  try {
    rawBody = await c.req.json() as PhonePeWebhookBody;
  } catch {
    return c.json({ code: 'INVALID_JSON_BODY' }, 400);
  }

  const verifyResult = verifyPhonePeWebhookSignature(
    rawBody.response,
    xVerifyHeader,
    merchantTransactionId
  );

  if (!verifyResult.valid) {
    console.error('[PhonePe Webhook Signature Failure]:', verifyResult.error);
    return c.json({ code: 'SIGNATURE_INVALID' }, 401);
  }

  const { data: callbackData } = verifyResult;

  try {
    if (callbackData.data.state === 'COMPLETED') {
      const amountRupees = callbackData.data.amount / 100;
      const driverId = callbackData.data.merchantTransactionId.split('_')[1];

      if (!driverId) {
        console.error('[PhonePe Webhook]: Cannot parse driverId from merchantTransactionId.');
        return c.json({ code: 'TRANSACTION_PARSE_ERROR' }, 422);
      }

      const wallet = await prisma.driverWallet.findFirst({ where: { driverId } });
      if (!wallet) {
        console.error(`[PhonePe Webhook]: Wallet not found for driver ${driverId}.`);
        return c.json({ code: 'WALLET_NOT_FOUND' }, 404);
      }

      await prisma.$transaction([
        prisma.driverWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amountRupees }, updatedAt: new Date() }
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: amountRupees,
            transactionType: 'credit',
            description: `PhonePe top-up — Ref: ${callbackData.data.transactionId}`,
            referenceId: callbackData.data.transactionId
          }
        }),
        prisma.systemAuditLog.create({
          data: {
            actionType: 'WALLET_TOPUP_PHONEPE',
            details: {
              driverId,
              amountRupees,
              transactionId: callbackData.data.transactionId,
              utr: callbackData.data.paymentInstrument.utr ?? null
            }
          }
        })
      ]);

      // Notify driver of successful wallet top-up
      const driverUser = await prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: { select: { fcmToken: true } } }
      });

      if (driverUser?.user.fcmToken) {
        await sendGenericNotification([driverUser.user.fcmToken], {
          title: '💰 Wallet Credited',
          body: `₹${amountRupees.toFixed(2)} added to your Namma Ride wallet.`,
          data: { type: 'WALLET_CREDIT', amount: amountRupees.toString() }
        });
      }

      console.log(`[PhonePe Webhook]: Credited ₹${amountRupees} to driver ${driverId}.`);
    } else if (callbackData.data.state === 'FAILED') {
      console.warn('[PhonePe Webhook]: Payment failed.', {
        transactionId: callbackData.data.merchantTransactionId,
        code: callbackData.data.responseCode
      });
    }

    return c.json({ code: 'SUCCESS' }, 200);
  } catch (err) {
    console.error('[PhonePe Webhook Processing Exception]:', err);
    return c.json({ code: 'INTERNAL_ERROR' }, 500);
  }
});

// ─── Razorpay Webhook (Public — HMAC Verified) ────────────────────────────────

paymentRouter.post('/razorpay/webhook', async (c) => {
  const signatureHeader = c.req.header('X-Razorpay-Signature');
  if (!signatureHeader) {
    return c.json({ success: false, error: 'Missing X-Razorpay-Signature header.' }, 401);
  }

  const rawBodyText = await c.req.text();

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Razorpay Webhook]: RAZORPAY_WEBHOOK_SECRET not configured.');
    return c.json({ success: false, error: 'Webhook secret not configured.' }, 500);
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyText)
    .digest('hex');

  if (expectedSignature !== signatureHeader) {
    console.error('[Razorpay Webhook]: HMAC signature mismatch.');
    return c.json({ success: false, error: 'Invalid signature.' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBodyText) as Record<string, unknown>;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  try {
    if (payload['event'] === 'payment.captured') {
      const paymentEntity = (
        (payload['payload'] as Record<string, unknown>)['payment'] as Record<string, unknown>
      )['entity'] as Record<string, unknown>;

      const notes = paymentEntity['notes'] as Record<string, string>;
      const driverId = notes['driverId'];
      const amountRupees = (paymentEntity['amount'] as number) / 100;
      const razorpayPaymentId = paymentEntity['id'] as string;

      if (!driverId) {
        console.error('[Razorpay Webhook]: driverId missing from payment notes.');
        return c.json({ success: false, error: 'driverId missing from notes.' }, 422);
      }

      const wallet = await prisma.driverWallet.findFirst({ where: { driverId } });
      if (!wallet) {
        return c.json({ success: false, error: 'Driver wallet not found.' }, 404);
      }

      await prisma.$transaction([
        prisma.driverWallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amountRupees }, updatedAt: new Date() }
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: amountRupees,
            transactionType: 'credit',
            description: `Razorpay top-up — Ref: ${razorpayPaymentId}`,
            referenceId: razorpayPaymentId
          }
        })
      ]);

      console.log(`[Razorpay Webhook]: Credited ₹${amountRupees} to driver ${driverId}.`);
    }

    return c.json({ status: 'ACCEPTED' }, 200);
  } catch (err) {
    console.error('[Razorpay Webhook Processing Exception]:', err);
    return c.json({ success: false, error: 'Webhook processing failure.' }, 500);
  }
});

// ─── PhonePe Initiate Top-up (Authenticated) ──────────────────────────────────

paymentRouter.post('/wallet/topup/initiate', authGuard(), async (c) => {
  try {
    const jwtPayload = (c as any).get('jwtPayload') as { userId: string };
    const { amountRupees } = await c.req.json() as { amountRupees: number };

    if (!amountRupees || amountRupees < 50 || amountRupees > 10000) {
      return c.json({ success: false, error: 'Amount must be between ₹50 and ₹10,000.' }, 400);
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: jwtPayload.userId },
      include: { user: { select: { phoneNumber: true } } }
    });

    if (!driver) {
      return c.json({ success: false, error: 'Driver profile not found.' }, 404);
    }

    const merchantTransactionId = `TOPUP_${driver.id}_${Date.now()}`;
    const amountPaise = Math.round(amountRupees * 100);

    const { payload, xVerifyHeader } = buildPhonePeInitPayload({
      merchantTransactionId,
      amountPaise,
      userId: jwtPayload.userId,
      mobileNumber: driver.user.phoneNumber.replace('+91', ''),
      redirectUrl: `${process.env.DRIVER_APP_DEEP_LINK ?? 'namma-ride://wallet/topup/result'}`
    });

    const phonePeApiUrl = process.env.PHONEPE_ENV === 'production'
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
      : 'https://api-preprod.phonepe.com/apis/hermes/pg/v1/pay';

    const phonePeResponse = await fetch(phonePeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerifyHeader,
        'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID ?? ''
      },
      body: JSON.stringify({ request: payload }),
      signal: AbortSignal.timeout(10000)
    });

    if (!phonePeResponse.ok) {
      const errBody = await phonePeResponse.text();
      console.error('[PhonePe Initiate Fault]:', errBody);
      return c.json({ success: false, error: 'Payment gateway initiation failed.' }, 502);
    }

    const phonePeData = await phonePeResponse.json() as {
      success: boolean;
      data: { instrumentResponse: { redirectInfo: { url: string } } };
    };

    return c.json({
      success: true,
      redirectUrl: phonePeData.data.instrumentResponse.redirectInfo.url,
      merchantTransactionId
    });
  } catch (err) {
    console.error('[Wallet Top-up Initiate Exception]:', err);
    return c.json({ success: false, error: 'Top-up initiation pipeline failure.' }, 500);
  }
});

// ─── FCM Token Registration (Authenticated) ───────────────────────────────────

paymentRouter.post('/fcm/register', authGuard(), async (c) => {
  try {
    const jwtPayload = (c as any).get('jwtPayload') as { userId: string };
    const { fcmToken } = await c.req.json() as { fcmToken: string };

    if (!fcmToken || fcmToken.trim().length < 10) {
      return c.json({ success: false, error: 'Valid FCM token is required.' }, 400);
    }

    await prisma.user.update({
      where: { id: jwtPayload.userId },
      data: { fcmToken: fcmToken.trim() }
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('[FCM Token Registration Exception]:', err);
    return c.json({ success: false, error: 'FCM token registration failure.' }, 500);
  }
});
