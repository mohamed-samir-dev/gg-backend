async function testBin(bin) {
  const url = `https://api.kashier.io/v2/financialinstitutions/bins/public?search=${bin}`;
  const res = await fetch(url);
  console.log(`BIN ${bin}: status ${res.status}`, await res.text());
}

async function run() {
  await testBin("424242");
  await testBin("411111");
  await testBin("512345");
  await testBin("400000");
}

run().catch(console.error);
