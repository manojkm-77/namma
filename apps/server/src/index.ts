import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { config } from 'dotenv';

// Load environmental variables
config();

import { sendOtp, verifyOtp } from './controllers/auth.controller';
import {
  requestRide,
  acceptRide,
  verifyOtpAndStartRide,
  completeRide,
  getActiveRide,
  cancelRide
} from './controllers/ride.controller';
import { updateDutyStatus, syncTelemetryLocation, updateDutyStatusAuth, syncTelemetryLocationAuth, getDriverDashboard } from './controllers/driver.controller';
import { performKycOcr, getFareExplanation, classifySupportTicket } from './services/ai.service';
import { prisma } from '@namma/db';
import { paymentRouter } from './routes/payment';
import { authGuard } from './middleware/auth';

const app = new Hono();

// Middlewares
app.use('*', cors());

// Basic sanity check
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date() }));

// Authentication API
app.post('/api/auth/otp/send', sendOtp);
app.post('/api/auth/otp/verify', verifyOtp);

// Rider API
app.post('/api/rider/rides/request', requestRide);
app.post('/api/rider/rides/cancel', cancelRide);
app.get('/api/rider/rides/active', getActiveRide);

// Driver API
app.get('/api/driver/dashboard', authGuard(), getDriverDashboard);
app.put('/api/driver/status', authGuard(), updateDutyStatusAuth);
app.post('/api/driver/location', authGuard(), syncTelemetryLocationAuth);
app.post('/api/driver/rides/accept', acceptRide);
app.post('/api/driver/rides/verify-otp', verifyOtpAndStartRide);
app.post('/api/driver/rides/complete', completeRide);

// Payments & Webhooks API
app.route('/api/payments', paymentRouter);

// AI APIs
app.post('/api/ai/kyc-ocr', async (c) => {
  try {
    const { documentUrl, documentType } = await c.req.json();
    if (!documentUrl || !documentType) {
      return c.json({ success: false, message: 'documentUrl and documentType are required' }, 400);
    }
    const ocrResult = await performKycOcr(documentUrl, documentType);
    return c.json({ success: true, data: ocrResult });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/ai/fare-explain', async (c) => {
  try {
    const { baseFare, distanceFare, surgeMultiplier, pickup, drop } = await c.req.json();
    const explanation = await getFareExplanation(baseFare, distanceFare, surgeMultiplier, pickup, drop);
    return c.json({ success: true, explanation });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/ai/support-ticket', async (c) => {
  try {
    const { userId, rideId, category, issueDescription } = await c.req.json();
    if (!userId || !category || !issueDescription) {
      return c.json({ success: false, message: 'Missing required support ticket fields' }, 400);
    }

    // Process using AI ticket classifier
    const classification = await classifySupportTicket(issueDescription);

    // Save ticket in Postgres DB
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        rideId: rideId || null,
        category,
        issueDescription,
        aiUrgency: classification.urgency,
        aiClassification: classification.classification,
        status: 'open'
      }
    });

    return c.json({ success: true, ticket });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Map Landmarks Configuration API
app.get('/api/maps/landmarks', (c) => {
  const city = c.req.query('city');
  const cityData = [
    {
      city: "Mysuru",
      center: { lat: 12.2958, lng: 76.6394 },
      landmarks: [
        { name: "Mysore Palace (Kote Anjaneya Swamy Temple)", lat: 12.3051, lng: 76.6552 },
        { name: "Mysuru Junction Railway Station", lat: 12.3162, lng: 76.6436 },
        { name: "KSRTC Suburb Bus Stand", lat: 12.3103, lng: 76.6601 }
      ]
    },
    {
      city: "Hubli-Dharwad",
      center: { lat: 15.3647, lng: 75.1240 },
      landmarks: [
        { name: "Hubli Railway Station (Siddharoodha Swamiji)", lat: 15.3526, lng: 75.1485 },
        { name: "Dharwad New Bus Stand", lat: 15.4589, lng: 75.0078 }
      ]
    },
    {
      city: "Mangaluru",
      center: { lat: 12.9141, lng: 74.8560 },
      landmarks: [
        { name: "Mangaluru Central Railway Station", lat: 12.8682, lng: 74.8437 },
        { name: "KSRTC Bus Stand Bejai", lat: 12.8906, lng: 74.8400 },
        { name: "Panambur Beach Entry", lat: 12.9482, lng: 74.8211 }
      ]
    }
  ];

  if (city) {
    const matched = cityData.find((c) => c.city.toLowerCase() === city.toLowerCase());
    return matched
      ? c.json({ success: true, data: matched })
      : c.json({ success: false, message: 'City metadata not found' }, 404);
  }

  return c.json({ success: true, data: cityData });
});

// Run server
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
console.log(`Starting Hono API server on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});
