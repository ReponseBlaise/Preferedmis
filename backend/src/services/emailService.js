const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

transporter.verify((error) => {
  if (error) console.error('SMTP configuration error:', error);
  else console.log('SMTP server connected successfully');
});

exports.sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Preferred Contractors'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendWelcomeEmail = async (email, name) => {
  const html = `<h2>Welcome to Preferred Contractors Management System</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created successfully. You can now login to the system.</p>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, 'Welcome to Preferred Contractors', html);
};

exports.sendPayrollNotification = async (email, name, amount, period) => {
  const html = `<h2>Payroll Notification</h2>
    <p>Hello ${name},</p>
    <p>Your payroll for the period ${period} has been processed.</p>
    <p><strong>Amount: ${amount} RWF</strong></p>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, 'Payroll Notification', html);
};

exports.sendMessageNotification = async (email, name, subject) => {
  const html = `<h2>New Message</h2>
    <p>Hello ${name},</p>
    <p>You have received a new message: <strong>${subject}</strong></p>
    <p>Please login to the system to view the message.</p>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, 'New Message Notification', html);
};

exports.sendSystemUpdateNotification = async (email, name, updateTitle, updateDetails) => {
  const html = `<h2>System Update Notification</h2>
    <p>Hello ${name},</p>
    <div style="background:#f0f8ff;padding:15px;border-left:4px solid #007bff;margin:20px 0">
      <h3>${updateTitle}</h3><p>${updateDetails}</p>
    </div>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, `System Update: ${updateTitle}`, html);
};

exports.sendProjectUpdateNotification = async (email, name, projectName, updateType, details) => {
  const html = `<h2>Project Update</h2>
    <p>Hello ${name},</p>
    <div style="background:#fff3cd;padding:15px;border-left:4px solid #ffc107;margin:20px 0">
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Update Type:</strong> ${updateType}</p>
      <p>${details}</p>
    </div>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, `Project Update: ${projectName}`, html);
};

exports.sendTaskAssignmentNotification = async (email, name, taskName, projectName, dueDate) => {
  const html = `<h2>New Task Assigned</h2>
    <p>Hello ${name},</p>
    <div style="background:#e7f3ff;padding:15px;border-left:4px solid #007bff;margin:20px 0">
      <p><strong>Task:</strong> ${taskName}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
    </div>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, 'New Task Assigned', html);
};

exports.sendPasswordResetEmail = async (email, name, resetLink) => {
  const html = `<h2>Password Reset Request</h2>
    <p>Hello ${name},</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${resetLink}" style="background:#007bff;color:white;padding:12px 30px;text-decoration:none;border-radius:5px">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour. If you did not request this, ignore this email.</p>
    <p>Best regards,<br>Preferred Contractors Team</p>`;
  return exports.sendEmail(email, 'Password Reset Request', html);
};

exports.sendBulkEmail = async (recipients, subject, html) => {
  const results = [];
  for (const recipient of recipients) {
    const result = await exports.sendEmail(recipient, subject, html);
    results.push({ email: recipient, ...result });
  }
  return results;
};
