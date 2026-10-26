import crypto from 'crypto';
import { formatEGPString } from './finance.js';

export const STORE_CURRENCY = 'EGP';
export const ALLOWED_CURRENCIES = ['EGP', 'SAR'];

/**
 * Verify HMAC-SHA256 signature for incoming Kashier webhooks
 * @param {string|Buffer} rawPayload - Raw body string
 * @param {string} signature - Header signature
 * @returns {boolean}
 */
export const verifyKashierWebhookSignature = (rawPayload, signature) => {
  if (!signature || !rawPayload) {
    return false;
  }

  const secretKey = process.env.KASHIER_SECRET_KEY;
  const apiKey = process.env.KASHIER_API_KEY;

  const payloadStr = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);

  // Check using Secret Key
  if (secretKey) {
    const computedSecret = crypto
      .createHmac('sha256', secretKey)
      .update(payloadStr)
      .digest('hex');
    if (computedSecret.toLowerCase() === signature.toLowerCase()) {
      return true;
    }
  }

  // Check using Payment API Key
  if (apiKey) {
    const computedApiKey = crypto
      .createHmac('sha256', apiKey)
      .update(payloadStr)
      .digest('hex');
    if (computedApiKey.toLowerCase() === signature.toLowerCase()) {
      return true;
    }
  }

  return false;
};

/**
 * Create a Payment Session with Kashier in EGP
 * @param {object} orderData
 * @returns {Promise<{ sessionUrl: string, sessionId: string, currency: string, amount: string }>}
 */
export const createKashierSession = async (orderData) => {
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const mode = process.env.KASHIER_MODE || 'live';
  let appUrl = process.env.APP_URL || 'https://www.lamsa-smartt.com';

  // Kashier URL validator requires a valid domain with a dot (localhost is rejected by Kashier API)
  if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    console.warn(`[Kashier] APP_URL contains localhost (${appUrl}). Kashier requires a valid domain for redirects. Falling back to public URL.`);
    appUrl = 'https://www.lamsa-smartt.com';
  }

  if (!merchantId || !apiKey || !secretKey) {
    throw new Error('Kashier credentials not configured');
  }

  // Store and Gateway currency (supports EGP and SAR dynamically)
  const gatewayCurrency = orderData.currency || process.env.KASHIER_CURRENCY_MODE || 'EGP';
  const numAmount = typeof orderData.amount === 'number' ? orderData.amount : parseFloat(orderData.amount);
  const gatewayAmount = numAmount.toFixed(2);
  const currencyLabel = gatewayCurrency === 'SAR' ? 'ريال سعودي' : 'جنيه مصري';

  const apiUrl = mode === 'live'
    ? 'https://api.kashier.io/v3/payment/sessions'
    : 'https://test-api.kashier.io/v3/payment/sessions';

  const payload = {
    merchantId,
    amount: gatewayAmount,
    currency: gatewayCurrency,
    order: orderData.orderId,
    type: 'one-time',
    merchantRedirect: `${appUrl}/?paymentStatus=SUCCESS&orderId=${orderData.orderId}`,
    display: 'ar',
    allowedMethods: 'card,wallet',
    description: `طلب ${orderData.orderId} - جرين لاين (${gatewayAmount} ${currencyLabel})`,
    customer: {
      email: orderData.customer?.email || `customer-${orderData.customer?.phone || Date.now()}@temp.kashier.local`,
      reference: orderData.customer?.phone || String(Date.now()),
    },
    metaData: {
      ...(orderData.customer?.name && { customerName: orderData.customer.name }),
      ...(orderData.customer?.phone && { phone: orderData.customer.phone }),
      storeCurrency: gatewayCurrency,
      storeAmount: gatewayAmount,
      gatewayCurrency: gatewayCurrency,
      gatewayAmount: gatewayAmount,
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': secretKey,
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    throw new Error(errorData.message || 'Kashier API error');
  }

  const sessionData = await response.json();
  
  return {
    sessionUrl: sessionData.sessionUrl,
    sessionId: sessionData._id || sessionData.sessionId,
    currency: gatewayCurrency,
    amount: gatewayAmount,
    storeCurrency: gatewayCurrency,
    storeAmount: gatewayAmount,
    settlementCurrency: sessionData.paymentParams?.currency || gatewayCurrency,
    settlementAmount: sessionData.paymentParams?.amount || gatewayAmount,
  };
};

/**
 * Fetch and verify session status from Kashier API
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export const getKashierSession = async (sessionId) => {
  const apiKey = process.env.KASHIER_API_KEY;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const mode = process.env.KASHIER_MODE || 'live';

  if (!sessionId || !apiKey || !secretKey) {
    throw new Error('Missing session ID or credentials');
  }

  const apiUrl = mode === 'live'
    ? `https://api.kashier.io/v3/payment/sessions/${sessionId}`
    : `https://test-api.kashier.io/v3/payment/sessions/${sessionId}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': secretKey,
      'api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Kashier session: ${response.status}`);
  }

  return response.json();
};
