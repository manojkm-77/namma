import { KycOcrResult } from '@namma/common';

/**
 * Perform AI OCR on driver documentation front/back.
 */
export async function performKycOcr(documentUrl: string, documentType: 'driving_license' | 'aadhar'): Promise<KycOcrResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!anthropicKey && !geminiKey) {
    console.warn('AI API Keys missing. Executing OCR mock engine fallback.');
    return {
      document_type: documentType,
      document_number: documentType === 'aadhar' ? '123456789012' : 'KA-03-20230009876',
      name: 'Ramesh Gowda',
      expiry_date: documentType === 'driving_license' ? '2035-12-31' : null,
      date_of_birth: '1985-05-15',
      confidence_score: 0.98,
      issues_detected: []
    };
  }

  try {
    const prompt = `
      You are an expert OCR parser. Analyze the uploaded document URL: "${documentUrl}".
      It is a ${documentType}.
      Extract the document number, full name, expiry date (if any, format YYYY-MM-DD), and note any validation flags.
      Return ONLY a JSON block:
      {
        "document_type": "${documentType}",
        "document_number": "string",
        "name": "string",
        "expiry_date": "YYYY-MM-DD or null",
        "confidence_score": 0.0 to 1.0,
        "issues_detected": []
      }
    `;

    let resultJsonStr = '';

    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = (await response.json()) as any;
      resultJsonStr = data.content[0].text;
    } else if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = (await response.json()) as any;
      resultJsonStr = data.candidates[0].content.parts[0].text;
    }

    // Clean markdown blocks if LLM outputs them
    const cleaned = resultJsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as KycOcrResult;
  } catch (error) {
    console.error('Error during AI OCR processing:', error);
    throw new Error('KYC Document OCR parse failed.');
  }
}

/**
 * Dynamic Fare explainer in mixed Kannada & English (Kannada script & English keywords)
 */
export async function getFareExplanation(
  baseFare: number,
  distanceFare: number,
  surgeMultiplier: number,
  pickup: string,
  drop: string
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const prompt = `
    You are Namma Ride Fare Assistant. Explain the fare details to the rider:
    - Base Fare: Rs ${baseFare}
    - Distance Fare: Rs ${distanceFare}
    - Surge Multiplier: ${surgeMultiplier}x
    - Total Fare: Rs ${(baseFare + distanceFare) * surgeMultiplier}
    - Route: From ${pickup} to ${drop}

    Provide the explanation in a friendly mixed language (Kannada script and English phrases) popular in Karnataka.
    Keep it concise (max 3 sentences).
  `;

  if (!anthropicKey && !geminiKey) {
    return `ನಮಸ್ಕಾರ! ನಿಮ್ಮ Ride Fare Rs ${((baseFare + distanceFare) * surgeMultiplier).toFixed(2)} ಆಗಿದೆ. ಇದರಲ್ಲಿ base charge Rs ${baseFare} ಮತ್ತು distance travel ಚಾರ್ಜ್ Rs ${distanceFare} ಸೇರಿದೆ. Peak hours ಇರೋದರಿಂದ ${surgeMultiplier}x surge ಅನ್ವಯಿಸಿದೆ. ಧನ್ಯವಾದಗಳು!`;
  }

  try {
    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = (await response.json()) as any;
      return data.content[0].text;
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = (await response.json()) as any;
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error('Error generating fare description:', error);
    return `ನಮಸ್ಕಾರ! ನಿಮ್ಮ Ride Fare Rs ${((baseFare + distanceFare) * surgeMultiplier).toFixed(2)} ಆಗಿದೆ.`;
  }
}

/**
 * Classify complaints to flag urgency status (normal, high, or emergency sos)
 */
export async function classifySupportTicket(
  description: string
): Promise<{ urgency: 'normal' | 'high' | 'sos'; classification: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!anthropicKey && !geminiKey) {
    const isSos = /sos|accident|danger|police|harass|abuse|safety/i.test(description);
    return {
      urgency: isSos ? 'sos' : 'normal',
      classification: isSos ? 'Safety Complaint / Urgent Intervention' : 'General Support Inquiry'
    };
  }

  try {
    const prompt = `
      Analyze the ride complaint: "${description}".
      Classify the category and urgency level.
      Urgency must be strictly one of: "normal", "high", "sos" (use "sos" if there is physical danger, harassment, or accident).
      Return JSON only:
      {
        "urgency": "normal" | "high" | "sos",
        "classification": "Brief category description"
      }
    `;

    let responseText = '';
    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = (await response.json()) as any;
      responseText = data.content[0].text;
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = (await response.json()) as any;
      responseText = data.candidates[0].content.parts[0].text;
    }

    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as { urgency: 'normal' | 'high' | 'sos'; classification: string };
  } catch (error) {
    console.error('Error classifying support ticket:', error);
    return { urgency: 'normal', classification: 'General Support' };
  }
}
