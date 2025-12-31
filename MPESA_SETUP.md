# M-Pesa Integration Guide

## Overview
The Chelky Threads app now has full M-Pesa integration using Safaricom's Daraja API. Customers can pay via:
- **M-Pesa Express (STK Push)**: Automatic prompt on customer's phone
- **Manual Paybill**: Direct paybill entry (existing method)

## Setup Instructions

### 1. Get M-Pesa Credentials

**For Testing (Sandbox)**:
1. Go to https://developer.safaricom.co.ke
2. Log in or create an account
3. Go to **My Apps** → **Create New App**
4. Select app type: **Sandbox**
5. You'll receive:
   - **Consumer Key**
   - **Consumer Secret**
   - Test phone numbers

**For Production**:
1. Apply for production API access at https://developer.safaricom.co.ke
2. Get approval from Safaricom (takes 2-3 weeks)
3. You'll receive production Consumer Key & Secret

### 2. Configure Environment Variables

Update your `.env` file:

```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key_from_daraja
MPESA_CONSUMER_SECRET=your_consumer_secret_from_daraja
MPESA_SHORTCODE=6514541
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=http://your-domain.com/api/payments/mpesa-callback
```

**Important Notes**:
- `MPESA_SHORTCODE`: Use the actual business shortcode (6514541 for this setup)
- `MPESA_PASSKEY`: Get this from Safaricom (used to generate payment authorization)
- `MPESA_CALLBACK_URL`: Must be publicly accessible for Safaricom to send payment notifications

### 3. Test with Sandbox Credentials

Use these test credentials:
```env
MPESA_CONSUMER_KEY=sandbox_key_here
MPESA_CONSUMER_SECRET=sandbox_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=http://localhost:5000/api/payments/mpesa-callback
```

## API Endpoints

### 1. Initiate STK Push
**POST** `/api/payments/initiate-stk`

Request:
```json
{
  "phoneNumber": "254712345678",
  "amount": 1500,
  "orderId": "ORD-123456"
}
```

Response:
```json
{
  "success": true,
  "checkoutRequestId": "ws_co_abc123...",
  "message": "STK Push sent to your phone. Please enter your M-Pesa PIN."
}
```

### 2. Query Payment Status
**POST** `/api/payments/query-status`

Request:
```json
{
  "checkoutRequestId": "ws_co_abc123..."
}
```

Response:
```json
{
  "success": true,
  "resultDesc": "The service request has been processed successfully.",
  "message": "Payment successful!"
}
```

### 3. M-Pesa Callback
**POST** `/api/payments/mpesa-callback`

Safaricom will send payment notifications to this endpoint. No action needed from you—it's handled automatically.

## How It Works for Customers

### M-Pesa Express (Recommended)
1. Customer goes to checkout
2. Selects **M-Pesa Express (Auto)** payment method
3. Enters their M-Pesa registered phone number
4. Clicks **Confirm Payment**
5. STK prompt appears on their phone
6. Customer enters M-Pesa PIN
7. Payment confirms and order is created
8. Order status updates to "Processing"

### Manual Paybill
1. Customer selects **Manual Paybill**
2. Enters phone number
3. Makes manual payment to:
   - **Paybill**: 6514541
   - **Account**: Order ID
4. Enters M-Pesa transaction code
5. Order is created manually

## Testing

### Test Numbers (Sandbox Only)
```
254712345678 - Test number 1
254700000000 - Test number 2
```

### Test Flow
1. Start Checkout
2. Select M-Pesa Express
3. Enter test phone: `0712345678`
4. Click "Confirm Payment"
5. Check server console for STK initiation logs
6. Check `/api/payments/query-status` to simulate payment confirmation

## Troubleshooting

### "Bad Auth" Error
- Check `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`
- Ensure they're from Daraja API, not old credentials
- Regenerate keys in Daraja dashboard

### "Invalid Passkey" Error
- Verify `MPESA_PASSKEY` is correct
- Check for whitespace in the passkey
- Request new passkey from Safaricom

### STK Not Appearing on Phone
- Check phone number format (must be valid Kenya number)
- Ensure shortcode is correct
- Try with a different test number
- Check if you're in sandbox or production environment

### Callback Not Received
- Ensure `MPESA_CALLBACK_URL` is publicly accessible
- Whitelist Safaricom IPs on your firewall
- Check server logs for incoming POST requests
- In production, use HTTPS with valid SSL certificate

## Production Deployment

When moving to production:

1. **Get Production Credentials**
   - Apply at Safaricom Developer Portal
   - Wait for approval (2-3 weeks)
   - Generate production Consumer Key/Secret

2. **Update Configuration**
   ```env
   MPESA_CONSUMER_KEY=production_key
   MPESA_CONSUMER_SECRET=production_secret
   MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa-callback
   NODE_ENV=production
   ```

3. **Security Checklist**
   - Use HTTPS for all endpoints
   - Validate all M-Pesa callbacks
   - Store sensitive data in environment variables
   - Enable rate limiting on payment endpoints
   - Log all payment transactions

4. **Test in Production**
   - Use real money for first test (small amount)
   - Verify order creation and payment confirmation
   - Check callback handling

## Support

- Safaricom Daraja Docs: https://developer.safaricom.co.ke/documentation
- Email: developer-support@safaricom.co.ke
- Slack: Safaricom Developer Community

## File Changes

**New Files**:
- `mpesaService.js` - M-Pesa API client

**Modified Files**:
- `.env` - Added M-Pesa configuration
- `server.cjs` - Added M-Pesa payment endpoints
- `pages/Checkout.tsx` - Updated to call real M-Pesa API

## Next Steps

1. Get M-Pesa credentials from Safaricom
2. Update `.env` with your credentials
3. Restart the server
4. Test the payment flow in checkout
5. Monitor logs for successful transactions
