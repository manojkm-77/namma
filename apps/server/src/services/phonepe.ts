import crypto from 'crypto';

interface PhonePeWebhookBody {
  response: string; // base64 encoded
}

export interface PhonePeCallbackData {
  success: boolean;
  code: string;
  message: string;
  data: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number; // in paise
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
      upiTransactionId?: string;
    };
  };
}

type PhonePeVerifyResult =
  | { valid: true; data: PhonePeCallbackData }
  | { valid: false; error: string };

/**
 * Verifies the X-VERIFY header from PhonePe webhook using SHA256 HMAC.
 * Formula: SHA256(base64(response) + "/pg/v1/status/{merchantId}/{merchantTransactionId}" + saltKey) + "###" + saltIndex
 */
export function verifyPhonePeWebhookSignature(
  base64Response: string,
  xVerifyHeader: string,
  merchantTransactionId: string
): PhonePeVerifyResult {
  try {
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX ?? '1';
    const merchantId = process.env.PHONEPE_MERCHANT_ID;

    if (!saltKey || !merchantId) {
      throw new Error('PhonePe credentials not configured in environment.');
    }

    const statusPath = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const stringToHash = base64Response + statusPath + saltKey;
    const computedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const expectedHeader = `${computedHash}###${saltIndex}`;

    if (expectedHeader !== xVerifyHeader) {
      return { valid: false, error: 'X-VERIFY signature mismatch — potential replay attack.' };
    }

    const decodedBuffer = Buffer.from(base64Response, 'base64').toString('utf-8');
    const parsed = JSON.parse(decodedBuffer) as PhonePeCallbackData;

    return { valid: true, data: parsed };
  } catch (err) {
    console.error('[PhonePe Signature Verification Exception]:', err);
    return { valid: false, error: err instanceof Error ? err.message : 'Verification failed.' };
  }
}

/**
 * Generates a PhonePe payment initiation payload (for wallet top-up flows).
 */
export function buildPhonePeInitPayload(params: {
  merchantTransactionId: string;
  amountPaise: number;
  userId: string;
  mobileNumber: string;
  redirectUrl: string;
}): { payload: string; xVerifyHeader: string } {
  const saltKey = process.env.PHONEPE_SALT_KEY ?? '';
  const saltIndex = process.env.PHONEPE_SALT_INDEX ?? '1';
  const merchantId = process.env.PHONEPE_MERCHANT_ID ?? '';

  const payloadObject = {
    merchantId,
    merchantTransactionId: params.merchantTransactionId,
    merchantUserId: params.userId,
    amount: params.amountPaise,
    redirectUrl: params.redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl: `${process.env.API_BASE_URL}/api/payments/phonepe/webhook`,
    mobileNumber: params.mobileNumber,
    paymentInstrument: { type: 'PAY_PAGE' }
  };

  const base64Payload = Buffer.from(JSON.stringify(payloadObject)).toString('base64');
  const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
  const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  const xVerifyHeader = `${sha256Hash}###${saltIndex}`;

  return { payload: base64Payload, xVerifyHeader };
}
