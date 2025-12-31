const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send Order Confirmation Email
 */
const sendOrderConfirmation = async (orderData) => {
  try {
    const { customerEmail, customerName, id, items, totalAmount, paymentMethod } = orderData;

    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">x${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
          <h1 style="color: #1a1a1a; margin: 0;">Chelky Threads</h1>
          <p style="color: #666; margin: 5px 0;">Thank you for your order!</p>
        </div>

        <div style="padding: 20px; background-color: #fff;">
          <h2 style="color: #1a1a1a;">Order Confirmation</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          
          <p>Thank you for shopping with Chelky Threads! Your order has been received and is being processed.</p>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${id}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          <h3 style="color: #1a1a1a; margin-top: 25px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px; border-top: 2px solid #ddd; padding-top: 15px;">
            <p style="font-size: 18px; color: #1a1a1a;"><strong>Total: KES ${totalAmount.toLocaleString()}</strong></p>
          </div>

          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✓ Order Received</strong></p>
            <p style="margin: 5px 0; color: #666;">We've received your order and will send you a shipping update soon.</p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 25px;">If you have any questions, please contact us at ${process.env.BUSINESS_EMAIL || 'chelkythreads@gmail.com'}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #999; font-size: 12px;">© 2025 Chelky Threads. All rights reserved.</p>
          <p style="margin: 5px 0; color: #999; font-size: 12px;">
            Follow us: 
            <a href="https://instagram.com/chelkythreads" style="color: #1a1a1a; text-decoration: none;">Instagram</a> | 
            <a href="https://tiktok.com/@chelkythreads" style="color: #1a1a1a; text-decoration: none;">TikTok</a>
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Order Confirmation - Chelky Threads #${id}`,
      html: emailHTML
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error.message);
  }
};

/**
 * Send Shipping Update Email
 */
const sendShippingUpdate = async (customerEmail, customerName, orderId, trackingNumber, status) => {
  try {
    const statusMessages = {
      'Processing': 'Your order is being prepared for shipment.',
      'Shipped': `Your order has been shipped! Track it with: ${trackingNumber}`,
      'Completed': 'Your order has been delivered. Thank you for shopping with us!',
      'Cancelled': 'Your order has been cancelled. Refund will be processed within 5-7 business days.'
    };

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
          <h1 style="color: #1a1a1a; margin: 0;">Chelky Threads</h1>
          <p style="color: #666; margin: 5px 0;">Order Update</p>
        </div>

        <div style="padding: 20px; background-color: #fff;">
          <h2 style="color: #1a1a1a;">Order Status Update</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          
          <p>${statusMessages[status]}</p>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
            ${trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 25px;">If you have any questions, please contact us at ${process.env.BUSINESS_EMAIL || 'chelkythreads@gmail.com'}</p>
        </div>

        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #999; font-size: 12px;">© 2025 Chelky Threads. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Order Update - Chelky Threads #${orderId}`,
      html: emailHTML
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Shipping update email sent to ${customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send shipping update email:', error.message);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendShippingUpdate
};
