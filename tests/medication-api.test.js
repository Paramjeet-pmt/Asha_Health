/**
 * Automated Verification Suite for Medications & Clinical Precautions API
 * Run with: node tests/medication-api.test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🩺 Starting Medications & Clinical Precautions API Tests...\n');
  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${desc} -> ${e.message}`);
      failed++;
    }
  }

  // 1. Check Root route fallback
  await assert('Root / responds with 200 and loads HTML', async () => {
    const res = await makeRequest('/');
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
  });

  // 2. Fetch all medications
  await assert('GET /api/medications returns list of generic medicines', async () => {
    const res = await makeRequest('/api/medications');
    if (res.status !== 200 || !res.data.success || res.data.count < 10) {
      throw new Error(`Invalid response: count=${res.data?.count}`);
    }
  });

  // 3. Search by symptom/condition
  await assert('GET /api/medications?q=fever returns Paracetamol & antibiotics', async () => {
    const res = await makeRequest('/api/medications?q=fever');
    if (res.status !== 200 || !res.data.data.some(m => m.name.includes('Paracetamol'))) {
      throw new Error('Paracetamol not found in fever search results');
    }
  });

  // 4. Filter OTC medicines
  await assert('GET /api/medications?otc=true returns non-prescription medications', async () => {
    const res = await makeRequest('/api/medications?otc=true');
    if (res.status !== 200 || res.data.data.some(m => m.prescription_required !== 0)) {
      throw new Error('Filtered list contains prescription medications');
    }
  });

  // 5. Clinical precautions query
  await assert('GET /api/medications/search/precautions?condition=pregnancy warns on contraindicated drugs', async () => {
    const res = await makeRequest('/api/medications/search/precautions?condition=pregnancy');
    if (res.status !== 200 || res.data.count < 1) {
      throw new Error('No precautions found for pregnancy condition');
    }
  });

  // 6. Categories breakdown
  await assert('GET /api/medications/categories returns distinct therapeutic classes', async () => {
    const res = await makeRequest('/api/medications/categories');
    if (res.status !== 200 || !Array.isArray(res.data.categories) || res.data.categories.length < 5) {
      throw new Error('Failed to retrieve categories');
    }
  });

  // 7. Single medicine profile with savings percentage
  await assert('GET /api/medications/1 returns full profile and Jan Aushadhi savings %', async () => {
    const res = await makeRequest('/api/medications/1');
    if (res.status !== 200 || !res.data.data.savings_percentage) {
      throw new Error('Missing savings calculation');
    }
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
