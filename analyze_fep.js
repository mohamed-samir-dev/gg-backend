async function run() {
  const sRes = await fetch('https://payments.kashier.io/main-CRF5NX4C.js');
  const text = await sRes.text();
  const chunks = [...new Set([...text.matchAll(/chunk-[A-Za-z0-9]+\.js/g)].map(m => m[0]))];

  for (const chunk of chunks) {
    const chunkRes = await fetch(`https://payments.kashier.io/${chunk}`);
    const chunkText = await chunkRes.text();
    if (chunkText.includes('invalid credentials')) {
      console.log('Found "invalid credentials" in chunk:', chunk);
    }
  }
  console.log('Done scanning for invalid credentials');
}

run().catch(console.error);
