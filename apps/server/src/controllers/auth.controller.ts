import { Context } from 'hono';
import { prisma } from '@namma/db';
import { SendOtpSchema, VerifyOtpSchema } from '@namma/common';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_key_karnataka_namma_ride';

// Temporary memory store for generated OTPs in dev. In prod, this would map to Redis or MSG91 verification APIs.
const otpStore = new Map<string, string>();

/**
 * Request SMS OTP
 */
export async function sendOtp(c: Context) {
  try {
    const body = await c.req.json();
    const result = SendOtpSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { phoneNumber } = result.data;
    
    // In dev: Generate static 1234 or a random 4-digit code and log it.
    const generatedOtp = process.env.NODE_ENV === 'production' 
      ? Math.floor(1000 + Math.random() * 9000).toString() 
      : '1234';
      
    otpStore.set(phoneNumber, generatedOtp);
    
    console.log(`[OTP DEBUG] Sent OTP ${generatedOtp} to ${phoneNumber} via MSG91 mock.`);

    // Real MSG91 SMS gateway request integration would happen here:
    // await fetch('https://api.msg91.com/api/v5/otp', { ... })

    return c.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Verify SMS OTP and issue Session JWT
 */
export async function verifyOtp(c: Context) {
  try {
    const body = await c.req.json();
    const result = VerifyOtpSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { phoneNumber, otp, fullName, role } = result.data;
    
    const validOtp = otpStore.get(phoneNumber);
    if (!validOtp || validOtp !== otp) {
      return c.json({ success: false, message: 'Invalid or expired OTP' }, 401);
    }

    // OTP verified, remove from store
    otpStore.delete(phoneNumber);

    // Fetch user or create if new
    let user = await prisma.user.findUnique({
      where: { phoneNumber }
    });

    if (!user) {
      if (!fullName || !role) {
        return c.json({
          success: false,
          needsProfileSetup: true,
          message: 'User does not exist. Full name and role are required to construct new profile.'
        }, 200);
      }

      user = await prisma.user.create({
        data: {
          phoneNumber,
          fullName,
          role,
          preferredLanguage: 'kn'
        }
      });

      // If user is a driver, initialize driver profile and wallet records automatically
      if (role === 'driver') {
        const driver = await prisma.driver.create({
          data: {
            userId: user.id,
            dutyStatus: 'offline',
            isActive: false,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30-day initial trial subscription
          }
        });

        await prisma.driverWallet.create({
          data: {
            driverId: driver.id,
            balance: 0.00
          }
        });
      }
    }

    // Sign session token
    const token = jwt.sign(
      { userId: user.id, role: user.role, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}
