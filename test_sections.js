const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = 'admin@ridevendor.com'; // Using admin email to ensure we get admin role for user routes
const TEST_PASSWORD = 'TestPassword123!';

async function runTests() {
  console.log('--- STARTING TESTS FOR SECTION 1 (AUTH) & SECTION 2 (USERS) ---');
  let token = null;
  let userId = null;

  try {
    // ----------------------------------------------------
    // Section 1: AUTH
    // ----------------------------------------------------
    console.log('\n[1/7] Testing POST /auth/login (Attempting to log in...)');
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      console.log('✓ Login successful');
      token = loginRes.data.token || loginRes.data.data.token;
      
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('User not found or wrong password. Need to register.');
      } else {
        throw err;
      }
    }

    if (!token) {
      console.log('\n[2/7] Testing POST /auth/register');
      const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Admin Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        phone: '08123456789'
      });
      console.log('✓ Register successful');
      
      // Need to login again or get token from register
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      token = loginRes.data.token || loginRes.data.data.token;
    }

    const authHeader = { Authorization: `Bearer ${token}` };

    console.log('\n[3/7] Testing GET /auth/me');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, { headers: authHeader });
    console.log('✓ Fetched current user profile');
    userId = meRes.data.data._id || meRes.data.data.id || meRes.data.data.user._id;
    console.log(`  User ID: ${userId}, Role: ${meRes.data.data.role || meRes.data.data.user.role}`);

    // Change Password can be tested but it might lock us out if we don't change it back. Skipping to keep test idempotent.

    // ----------------------------------------------------
    // Section 2: USERS (Requires Admin role)
    // ----------------------------------------------------
    console.log('\n[4/7] Testing GET /users (List Users - Admin only)');
    const usersRes = await axios.get(`${BASE_URL}/users`, { headers: authHeader });
    console.log('✓ Fetched user list. Total users:', usersRes.data.data ? usersRes.data.data.length : usersRes.data.results);

    console.log('\n[5/7] Testing GET /users/:id');
    const userRes = await axios.get(`${BASE_URL}/users/${userId}`, { headers: authHeader });
    console.log('✓ Fetched specific user details');

    console.log('\n[6/7] Testing PATCH /users/:id');
    const updateRes = await axios.patch(`${BASE_URL}/users/${userId}`, {
      name: 'Admin Test User Updated'
    }, { headers: authHeader });
    console.log('✓ Updated user details');

    // Restore name
    await axios.patch(`${BASE_URL}/users/${userId}`, {
      name: 'Admin Test User'
    }, { headers: authHeader });

    // Section 1: AUTH (Logout)
    console.log('\n[7/7] Testing POST /auth/logout');
    await axios.post(`${BASE_URL}/auth/logout`, {}, { headers: authHeader });
    console.log('✓ Logout successful');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
      console.error(`Endpoint: ${error.config.method.toUpperCase()} ${error.config.url}`);
    } else if (error.request) {
      console.error('No response received from server');
      console.error(error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

runTests();
