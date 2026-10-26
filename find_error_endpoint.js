import dotenv from 'dotenv';
dotenv.config();

const mid = process.env.KASHIER_MERCHANT_ID;
const apiKey = process.env.KASHIER_API_KEY;
const secKey = process.env.KASHIER_SECRET_KEY;

async function checkEndpoints() {
  console.log('Testing session creation endpoint...');
  try {
    const res1 = await fetch('https://api.kashier.io/v3/payment/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'invalid_secret',
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantId: mid,
        amount: "10.00",
        currency: "SAR",
        order: "TEST-" + Date.now(),
        type: 'one-time',
        merchantRedirect: 'https://www.lamsa-smartt.com',
        display: 'ar',
        allowedMethods: 'card',
        customer: { email: 't@t.com', reference: '123' }
      })
    });
    console.log('Session with bad secret:', res1.status, await res1.text());
  } catch (e) {
    console.log('Error 1:', e.message);
  }

  try {
    const res2 = await fetch('https://api.kashier.io/v3/payment/sessions', {
      method: 'POST',
      headers: {
        'Authorization': secKey,
        'api-key': 'invalid_api_key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantId: mid,
        amount: "10.00",
        currency: "SAR",
        order: "TEST-" + Date.now(),
        type: 'one-time',
        merchantRedirect: 'https://www.lamsa-smartt.com',
        display: 'ar',
        allowedMethods: 'card',
        customer: { email: 't@t.com', reference: '123' }
      })
    });
    console.log('Session with bad api-key:', res2.status, await res2.text());
  } catch (e) {
    console.log('Error 2:', e.message);
  }

  try {
    const res3 = await fetch('https://fep.kashier.io/v3/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kashier-hash': 'random'
      },
      body: JSON.stringify({
        merchantId: mid,
        sessionId: '123'
      })
    });
    console.log('FEP endpoint:', res3.status, await res3.text());
  } catch (e) {
    console.log('Error 3:', e.message);
  }
}

checkEndpoints();
