const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  debug: true,
  logger: true
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server connected successfully, ready to send emails');
  }
});

exports.sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Preferred Contractors'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    console.log('Accepted recipients:', info.accepted);
    console.log('Rejected recipients:', info.rejected);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
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

// System Update Notifications
exports.sendSystemUpdateNotification = async (email, name, updateTitle, updateDetails) => {
  const html = `
    <h2>System Update Notification</h2>
    <p>Hello ${name},</p>
    <p>We have made some exciting updates to our system!</p>
    <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
      <h3 style="margin-top: 0;">${updateTitle}</h3>
      <p>${updateDetails}</p>
    </div>
    <p>Login to your account to explore the new features.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, `System Update: ${updateTitle}`, html);
};

exports.sendProjectUpdateNotification = async (email, name, projectName, updateType, details) => {
  const html = `
    <h2>Project Update</h2>
    <p>Hello ${name},</p>
    <p>There is a new update for project: <strong>${projectName}</strong></p>
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p><strong>Update Type:</strong> ${updateType}</p>
      <p>${details}</p>
    </div>
    <p>Please login to view the full details.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, `Project Update: ${projectName}`, html);
};

exports.sendTaskAssignmentNotification = async (email, name, taskName, projectName, dueDate) => {
  const html = `
    <h2>New Task Assigned</h2>
    <p>Hello ${name},</p>
    <p>You have been assigned a new task:</p>
    <div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
      <p><strong>Task:</strong> ${taskName}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
    </div>
    <p>Please login to view the full task details.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, 'New Task Assigned', html);
};

exports.sendPasswordResetEmail = async (email, name, resetLink) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>You have requested to reset your password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Preferred Contractors Team</p>
  `;
  return this.sendEmail(email, 'Password Reset Request', html);
};

exports.sendBulkEmail = async (recipients, subject, html) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const result = await this.sendEmail(recipient, subject, html);
      results.push({ email: recipient, success: true, messageId: result.messageId });
    } catch (error) {
      results.push({ email: recipient, success: false, error: error.message });
    }
  }
  return results;
};
