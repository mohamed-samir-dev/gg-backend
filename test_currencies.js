import dotenv from 'dotenv';
dotenv.config();
import { createKashierSession, getKashierSession } from './utils/kashier.js';

async function test() {
  for (const curr of ["SAR", "SAR_VIRTUAL", "EGP"]) {
    try {
      process.env.KASHIER_CURRENCY_MODE = curr;
      const s = await createKashierSession({
        amount: 10,
        orderId: `TEST-${curr}-${Date.now()}`,
        customer: { phone: "0501234567", name: "Test" }
      });
      console.log(`[${curr}] CREATED:`, s.sessionId, "URL:", s.sessionUrl);
      const fetched = await getKashierSession(s.sessionId);
      console.log(`[${curr}] Params:`, {
        amount: fetched.data.paymentParams.amount,
        currency: fetched.data.paymentParams.currency,
        virtualAmount: fetched.data.paymentParams.virtualAmount,
        virtualCurrency: fetched.data.paymentParams.virtualCurrency,
        virtualExchangeRate: fetched.data.paymentParams.virtualExchangeRate,
        hash: fetched.data.paymentParams.hash?.slice(0, 10) + '...'
      });
    } catch (e) {
      console.log(`[${curr}] ERROR:`, e.message);
    }
  }
}

test().catch(console.error);
