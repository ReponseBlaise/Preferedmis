const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

exports.sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

exports.sendWelcomeEmail = async (email, name) => {
  const html = `
    <h2>Welcome to Preferred Contractors Management System</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created successfully.</p>
    <p>You can now login to the system using your email and password.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, 'Welcome to Preferred Contractors', html);
};

exports.sendPayrollNotification = async (email, name, amount, period) => {
  const html = `
    <h2>Payroll Notification</h2>
    <p>Hello ${name},</p>
    <p>Your payroll for the period ${period} has been processed.</p>
    <p><strong>Amount: ${amount} RWF</strong></p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, 'Payroll Notification', html);
};

exports.sendMessageNotification = async (email, name, subject) => {
  const html = `
    <h2>New Message</h2>
    <p>Hello ${name},</p>
    <p>You have received a new message: <strong>${subject}</strong></p>
    <p>Please login to the system to view the message.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, 'New Message Notification', html);
};
