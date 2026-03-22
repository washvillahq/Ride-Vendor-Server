const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function verify() {
  console.log('--- Verifying Fixes ---');

  // 1. Verify Car Query with empty strings
  console.log('\nTesting /cars with empty query params...');
  const carsRes = await axios.get(`${BASE_URL}/cars?type=&category=&location=&searchTerm=`);
  console.log('✅ GET /cars (empty params) - Status:', carsRes.status, 'Count:', carsRes.data.data.data.length);

  // 2. Verify /orders/my (requires token)
  console.log('\nTesting /orders/my (expect 401 if unauthorized, not 400)...');
  try {
    await axios.get(`${BASE_URL}/orders/my`);
  } catch (err) {
    console.log('GET /orders/my - Status:', err.response.status, 'Message:', err.response.data.message);
  }

  // 3. Verify /bookings/my (expect 401 if unauthorized, not 403 or 404)...
  console.log('\nTesting /bookings/my (expect 401 if unauthorized, not 403)...');
  try {
    await axios.get(`${BASE_URL}/bookings/my`);
  } catch (err) {
    console.log('GET /bookings/my - Status:', err.response.status, 'Message:', err.response.data.message);
  }

  console.log('\n--- Verification Complete ---');
}

verify();
