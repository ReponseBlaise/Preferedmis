/**
 * Email Templates Utility
 * Reusable HTML email templates for system notifications
 */

const generateEmailTemplate = ({ title, content, footer = 'Preferred Contractors Team', color = '#007bff' }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background-color: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .info-box { background-color: #f0f8ff; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0; }
        .warning-box { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .success-box { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${footer}. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template: System Update
exports.systemUpdateTemplate = (updateTitle, updateDetails, userName = '') => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>We have made some exciting updates to our system!</p>
    <div class="info-box">
      <h3 style="margin-top: 0;">${updateTitle}</h3>
      <p>${updateDetails}</p>
    </div>
    <p>Login to your account to explore the new features.</p>
  `;
  return generateEmailTemplate({ title: 'System Update Notification', content, color: '#007bff' });
};

// Template: Project Update
exports.projectUpdateTemplate = (projectName, updateType, details, userName = '') => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>There is a new update for project: <strong>${projectName}</strong></p>
    <div class="warning-box">
      <p><strong>Update Type:</strong> ${updateType}</p>
      <p>${details}</p>
    </div>
    <p>Please login to view the full details.</p>
  `;
  return generateEmailTemplate({ title: 'Project Update', content, color: '#ffc107' });
};

// Template: Task Assignment
exports.taskAssignmentTemplate = (taskName, projectName, dueDate, userName = '') => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>You have been assigned a new task:</p>
    <div class="info-box">
      <p><strong>Task:</strong> ${taskName}</p>
      <p><strong>Project:</strong> ${projectName}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
    </div>
    <p>Please login to view the full task details.</p>
  `;
  return generateEmailTemplate({ title: 'New Task Assigned', content, color: '#007bff' });
};

// Template: Password Reset
exports.passwordResetTemplate = (userName, resetLink) => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>You have requested to reset your password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;
  return generateEmailTemplate({ title: 'Password Reset Request', content, color: '#28a745' });
};

// Template: Welcome Email
exports.welcomeTemplate = (userName) => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>Your account has been created successfully.</p>
    <p>You can now login to the system using your email and password.</p>
    <div class="success-box">
      <p>Welcome aboard! We're excited to have you on board.</p>
    </div>
  `;
  return generateEmailTemplate({ title: 'Welcome to Preferred Contractors', content, color: '#28a745' });
};

// Template: Payroll Notification
exports.payrollTemplate = (userName, amount, period) => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>Your payroll for the period <strong>${period}</strong> has been processed.</p>
    <div class="success-box">
      <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;">${amount} RWF</p>
    </div>
    <p>Please login to view the full payroll details.</p>
  `;
  return generateEmailTemplate({ title: 'Payroll Notification', content, color: '#28a745' });
};

// Template: Message Notification
exports.messageTemplate = (userName, subject) => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>You have received a new message:</p>
    <div class="info-box">
      <p><strong>Subject:</strong> ${subject}</p>
    </div>
    <p>Please login to the system to view the message.</p>
  `;
  return generateEmailTemplate({ title: 'New Message', content, color: '#007bff' });
};

// Template: Generic Notification
exports.genericTemplate = (title, message, userName = '') => {
  const content = `
    ${userName ? `<p>Hello ${userName},</p>` : ''}
    <p>${message}</p>
  `;
  return generateEmailTemplate({ title, content });
};
