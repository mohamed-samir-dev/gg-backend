import dotenv from 'dotenv';
dotenv.config();
import { createKashierSession, getKashierSession } from './utils/kashier.js';

async function test() {
  const session = await createKashierSession({
    amount: 10,
    orderId: 'TEST-' + Date.now(),
    customer: { phone: '0501234567', name: 'Test' }
  });
  console.log('Session result:', session);

  const fetched = await getKashierSession(session.sessionId);
  console.log('Fetched session data:', JSON.stringify(fetched, null, 2));
}

test().catch(console.error);
