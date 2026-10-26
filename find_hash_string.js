import crypto from 'crypto';

const targetHash = "052f0d475603f23455ea14215a456de656f15eec99fa0497eec465bd3e191b51";
const mid = "MID-51995-388";
const order = "TEST-1792979463709";
const amounts = ["148.47", "148.5", "148", "10", "10.00", "10.0"];
const currencies = ["EGP", "SAR", "SAR_VIRTUAL"];
const keys = [
  "a019fca6-f3ba-4eba-aab7-84995481dc7d",
  "38130367e4218e7561fc534d377261f2$03e013f3c681a3d2b466ebca90a1f47dcb369c6e30a31186e9206db01fc0d157eae8069b96a29a08e14bbfaa52061ddf"
];

const templates = [
  (m, o, a, c) => `/?payment=${m}.${o}.${a}.${c}`,
  (m, o, a, c) => `?payment=${m}.${o}.${a}.${c}`,
  (m, o, a, c) => `/?payment=${m}${o}${a}${c}`,
  (m, o, a, c) => `?payment=${m}${o}${a}${c}`,
  (m, o, a, c) => `${m}.${o}.${a}.${c}`,
  (m, o, a, c) => `${m}${o}${a}${c}`,
  (m, o, a, c) => `payment=${m}.${o}.${a}.${c}`,
  (m, o, a, c) => `payment=${m}${o}${a}${c}`,
  (m, o, a, c) => `${o}.${a}.${c}`,
  (m, o, a, c) => `${m}.${a}.${c}`,
  (m, o, a, c) => `/?payment=${o}.${a}.${c}`,
];

for (const key of keys) {
  for (const a of amounts) {
    for (const c of currencies) {
      for (const t of templates) {
        const str = t(mid, order, a, c);
        const h = crypto.createHmac('sha256', key).update(str).digest('hex');
        if (h === targetHash) {
          console.log(`FOUND! String: "${str}", Key: ${key.slice(0, 10)}...`);
        }
      }
    }
  }
}
console.log('Finished testing combinations');
