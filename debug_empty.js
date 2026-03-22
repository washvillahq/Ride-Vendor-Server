const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function verify() {
  try {
    console.log('--- Debugging Empty Result Issue ---');

    // 1. Get all cars without ANY filters
    console.log('\nTesting /cars (No filters)...');
    const allRes = await axios.get(`${BASE_URL}/cars`);
    console.log('Response body:', JSON.stringify(allRes.data, null, 2));
    
    if (allRes.data?.data?.cars?.length > 0) {
      console.log('First car type:', allRes.data.data.cars[0].type);
    }

    // 2. Get cars with the EXACT query the user reported
    console.log('\nTesting /cars with user reported query...');
    const userQuery = 'type=&category=&searchTerm=&location=&sort=-createdAt&page=1&limit=12';
    const userRes = await axios.get(`${BASE_URL}/cars?${userQuery}`);
    console.log('User query response data keys:', Object.keys(userRes.data?.data || {}));
    console.log('Data length:', userRes.data?.data?.cars?.length);

    console.log('\n--- Debug Complete ---');
  } catch (err) {
    console.error('Debug failed:', err.message);
    if (err.response) console.error('Data:', err.response.data);
  }
}

verify();
