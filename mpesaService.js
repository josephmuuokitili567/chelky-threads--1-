const axios = require('axios');
require('dotenv').config();

const MPESA_API_BASE = 'https://sandbox.safaricom.co.ke'; // Sandbox for testing
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

let accessToken = null;
let tokenExpiry = null;

/**
 * Get OAuth2 Access Token from Safaricom
 */
const getAccessToken = async () => {
  try {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    
    const response = await axios.get(`${MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000); // Set expiry
    
    console.log('✅ M-Pesa access token obtained');
    return accessToken;
  } catch (error) {
    console.error('❌ Failed to get M-Pesa access token:', error.response?.data || error.message);
    throw new Error('M-Pesa authentication failed');
  }
};

/**
 * Initiate STK Push (Direct M-Pesa Prompt on Customer's Phone)
 */
const initiateSTKPush = async (phoneNumber, amount, orderId) => {
  try {
    const token = await getAccessToken();
    
    // Format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 9 ? `254${cleanPhone}` : `254${cleanPhone.slice(-9)}`;
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];
    
    // Generate password: Base64(shortcode + passkey + timestamp)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
    
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `Order-${orderId}`,
      TransactionDesc: `Chelky Threads Order ${orderId}`
    };

    const response = await axios.post(
      `${MPESA_API_BASE}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ STK Push initiated:', response.data);
    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      message: response.data.ResponseDescription
    };
  } catch (error) {
    console.error('❌ STK Push failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate payment');
  }
};

/**
 * Query Payment Status
 */
const queryPaymentStatus = async (checkoutRequestId) => {
  try {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      `${MPESA_API_BASE}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: response.data.ResultCode === '0',
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      checkoutRequestId: response.data.CheckoutRequestID
    };
  } catch (error) {
    console.error('❌ Payment query failed:', error.response?.data || error.message);
    throw new Error('Failed to query payment status');
  }
};

module.exports = {
  getAccessToken,
  initiateSTKPush,
  queryPaymentStatus
};
