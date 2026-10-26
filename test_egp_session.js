import dotenv from 'dotenv';
dotenv.config();

const merchantId = process.env.KASHIER_MERCHANT_ID;
const apiKey = process.env.KASHIER_API_KEY;
const secretKey = process.env.KASHIER_SECRET_KEY;

async function testEgpSession() {
  const payload = {
    merchantId,
    amount: "100.00",
    currency: "EGP",
    order: "TEST-EGP-" + Date.now(),
    type: 'one-time',
    merchantRedirect: 'https://www.lamsa-smartt.com/?paymentStatus=SUCCESS',
    display: 'ar',
    allowedMethods: 'card',
    customer: {
      email: "test@example.com",
      reference: "0501234567"
    }
  };

  const res = await fetch('https://api.kashier.io/v3/payment/sessions', {
    method: 'POST',
    headers: {
      'Authorization': secretKey,
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const session = await res.json();
  console.log('Session response:', JSON.stringify(session, null, 2));

  // Now test fep with this session
  const fepBody = {
    apiOperation: "PAY",
    merchantId,
    sessionId: session._id,
    order: {
      reference: payload.order,
      amount: 100,
      currency: "EGP"
    },
    paymentMethod: {
      type: "CARD",
      card: {
        expiry: { month: "12", year: "28" },
        number: "4242424242424242",
        nameOnCard: "Test",
        securityCode: "123"
      }
    }
  };

  const fepRes = await fetch('https://fep.kashier.io/v3/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'kashier-hash': session.paymentParams.hash
    },
    body: JSON.stringify(fepBody)
  });

  console.log('FEP Status with EGP:', fepRes.status);
  console.log('FEP Body:', await fepRes.text());
}

testEgpSession().catch(console.error);
