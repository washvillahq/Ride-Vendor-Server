const axios = require('axios');
const config = require('../../config/config');

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${config.paystack.secretKey}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initializes a transaction with Paystack
 * @param {string} email User email
 * @param {number} amount Amount in default currency (Paystack expects base units e.g., kobo/cents)
 * @param {string} reference Unique transaction reference
 * @param {Object} metadata Custom metadata
 * @returns {Promise<Object>} Paystack initialization response data
 */
const initializeTransaction = async (email, amount, reference, metadata = {}) => {
  const response = await paystackClient.post('/transaction/initialize', {
    email,
    amount,
    reference,
    metadata,
  });
  return response.data; // { status, message, data: { authorization_url, access_code, reference } }
};

/**
 * Verifies a transaction with Paystack
 * @param {string} reference 
 * @returns {Promise<Object>} Paystack verification response data
 */
const verifyTransaction = async (reference) => {
  const response = await paystackClient.get(`/transaction/verify/${reference}`);
  return response.data; // { status, message, data: { status, reference, amount, metadata... } }
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
};
