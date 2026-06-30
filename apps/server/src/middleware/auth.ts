import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_key_karnataka_namma_ride';

export function authGuard() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized. Token missing.' }, 401);
    }

    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      c.set('jwtPayload', payload);
      await next();
    } catch (err) {
      return c.json({ success: false, error: 'Unauthorized. Invalid token.' }, 401);
    }
  };
}
