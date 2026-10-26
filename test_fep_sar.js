async function testFepSession(sessionId, orderRef, amount, currency, hash) {
  const fepBody = {
    apiOperation: "PAY",
    merchantId: "MID-51995-388",
    sessionId,
    order: {
      reference: orderRef,
      amount,
      currency
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
      'kashier-hash': hash
    },
    body: JSON.stringify(fepBody)
  });

  console.log(`[FEP ${currency}]: Status ${fepRes.status}:`, await fepRes.text());
}

async function run() {
  await testFepSession("6adf4579a04de02bfac66d83", "TEST-SAR-1793017208880", 10, "SAR", "59b7ec7e02e078ec9ae67dd3f3f619e8cf1689ea52a06ee7b24eeafb646c87e4");
  await testFepSession("6adf457a2b11f04883fe93a9", "TEST-SAR_VIRTUAL-1793017210217", 149.17, "EGP", "5697bf5c65b50df607d722bf85d688cf6621a6448378bfb0e3dd8279bb95ee5d");
}

run().catch(console.error);
