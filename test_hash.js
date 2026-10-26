import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const merchantId = "MID-51995-388";
const orderId = "TEST-1792979463709";
const amount = 148.47;
const currency = "EGP";
const targetHash = "052f0d475603f23455ea14215a456de656f15eec99fa0497eec465bd3e191b51";

const apiKey = process.env.KASHIER_API_KEY;
const secretKey = process.env.KASHIER_SECRET_KEY;

const formats = [
  `/?payment=${merchantId}.${orderId}.${amount}.${currency}`,
  `/?payment=${merchantId}.${orderId}.${Number(amount).toFixed(2)}.${currency}`,
  `?payment=${merchantId}.${orderId}.${amount}.${currency}`,
  `?payment=${merchantId}.${orderId}.${Number(amount).toFixed(2)}.${currency}`,
  `?payment=${merchantId}${orderId}${amount}${currency}`,
  `?payment=${merchantId}${orderId}${Number(amount).toFixed(2)}${currency}`,
  `/?payment=${merchantId}.${orderId}.10.SAR`,
  `/?payment=${merchantId}.${orderId}.10.00.SAR`,
  `/?payment=${merchantId}.${orderId}.10.SAR_VIRTUAL`,
  `/?payment=${merchantId}.${orderId}.10.00.SAR_VIRTUAL`,
  `/?payment=${merchantId}.${orderId}.${amount}.EGP`,
];

const keys = [
  { name: 'apiKey', key: apiKey },
  { name: 'secretKey', key: secretKey },
];

for (const { name, key } of keys) {
  for (const fmt of formats) {
    const h = crypto.createHmac('sha256', key).update(fmt).digest('hex');
    if (h === targetHash) {
      console.log(`MATCH! Key: ${name}, Format: "${fmt}"`);
    }
  }
}
console.log('Done checking exact matches');
