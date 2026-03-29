const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false otherwise
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name for personalization
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const transporter = createTransporter();
  
  // Create reset URL (frontend URL)
  const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'RideVendor'}" <${process.env.EMAIL_FROM || 'noreply@ridevendor.com'}>`,
    to: email,
    subject: 'Password Reset Request - RideVendor',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 30px;
              text-align: center;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #fff;
              margin-bottom: 20px;
            }
            .content {
              background: #fff;
              border-radius: 10px;
              padding: 30px;
              margin-top: 20px;
            }
            h1 {
              color: #333;
              margin-bottom: 15px;
            }
            .greeting {
              color: #666;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .message {
              color: #666;
              font-size: 14px;
              margin-bottom: 25px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              text-decoration: none;
              padding: 14px 40px;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .link-text {
              color: #666;
              font-size: 12px;
              margin-top: 15px;
              word-break: break-all;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              border-radius: 5px;
            }
            .warning-text {
              color: #856404;
              font-size: 13px;
              margin: 0;
            }
            .footer {
              color: #999;
              font-size: 12px;
              margin-top: 30px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">RideVendor</div>
          </div>
          
          <div class="content">
            <h1>Password Reset Request</h1>
            <p class="greeting">Hello ${userName},</p>
            
            <p class="message">
              We received a request to reset your password for your RideVendor account. 
              Click the button below to reset your password:
            </p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p class="link-text">
              Or copy and paste this link into your browser:<br>
              ${resetUrl}
            </p>
            
            <div class="warning">
              <p class="warning-text">
                <strong>⚠️ Important:</strong> This link will expire in 10 minutes. 
                If you didn't request a password reset, please ignore this email or contact support 
                if you have concerns. Your password will remain unchanged.
              </p>
            </div>
            
            <p class="message">
              For security reasons, never share your password or reset link with anyone.
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} RideVendor. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - RideVendor
      
      Hello ${userName},
      
      We received a request to reset your password for your RideVendor account.
      
      Reset your password using this link:
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you didn't request a password reset, please ignore this email.
      Your password will remain unchanged.
      
      For security reasons, never share your password or reset link with anyone.
      
      ---
      © ${new Date().getFullYear()} RideVendor. All rights reserved.
      This is an automated message, please do not reply.
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail,
};
