import dotenv from 'dotenv';
dotenv.config();

const hash = "052f0d475603f23455ea14215a456de656f15eec99fa0497eec465bd3e191b51";

const body = {
  apiOperation: "PAY",
  merchantId: "MID-51995-388",
  sessionId: "6adeb20828132acbaf3a3346",
  order: {
    reference: "TEST-1792979463709",
    amount: 148.47,
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

async function testWithOrigin() {
  const res = await fetch('https://fep.kashier.io/v3/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'kashier-hash': hash,
      'Origin': 'https://payments.kashier.io',
      'Referer': 'https://payments.kashier.io/session/6adeb20828132acbaf3a3346?mode=live',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify(body)
  });

  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

testWithOrigin();
