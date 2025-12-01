import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SchoolEmailContext {
  schoolName: string;
  schoolLogo?: string;
  primaryColor?: string;
}

function getEmailTemplate(content: string, context?: SchoolEmailContext) {
  const primaryColor = context?.primaryColor || '#3b82f6';
  const schoolName = context?.schoolName || 'StudentDrive';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  ${context?.schoolLogo ? `<img src="${context.schoolLogo}" alt="${schoolName}" style="height: 48px; margin-bottom: 10px;">` : ''}
                  <h1 style="margin: 0; color: ${primaryColor}; font-size: 24px; font-weight: 600;">${schoolName}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    This is an automated message from ${schoolName}.
                    <br>Powered by StudentDrive
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(to: string, token: string, baseUrl: string) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Welcome to StudentDrive!</h2>
    <p style="color: #4b5563; line-height: 1.6;">Thank you for signing up. Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Verify Email
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: 'Verify your StudentDrive account',
    html: getEmailTemplate(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendAttendanceAlert(
  to: string,
  studentName: string,
  status: 'absent' | 'late',
  date: string,
  context: SchoolEmailContext
) {
  const statusText = status === 'absent' ? 'was marked absent' : 'arrived late';
  const statusColor = status === 'absent' ? '#ef4444' : '#f59e0b';
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Attendance Alert</h2>
    <div style="background-color: #fef2f2; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <p style="color: #1f2937; margin: 0; font-weight: 600;">
        ${studentName} ${statusText} on ${date}
      </p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      This is an automated notification to inform you about your child's attendance status.
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      If you have any questions or concerns, please contact the school administration.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/school/parent-dashboard" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View Dashboard
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Attendance Alert: ${studentName} - ${context.schoolName}`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Attendance alert sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending attendance alert:', error);
    return false;
  }
}

export async function sendGradeUpdateNotification(
  to: string,
  studentName: string,
  subjectName: string,
  assessmentType: string,
  score: number,
  maxScore: number,
  context: SchoolEmailContext
) {
  const percentage = Math.round((score / maxScore) * 100);
  let gradeColor = '#22c55e';
  if (percentage < 50) gradeColor = '#ef4444';
  else if (percentage < 70) gradeColor = '#f59e0b';
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Grade Update</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      A new grade has been recorded for ${studentName}.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Subject:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${subjectName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Assessment:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${assessmentType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Score:</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="color: ${gradeColor}; font-weight: 700; font-size: 18px;">${score}/${maxScore}</span>
            <span style="color: #6b7280; margin-left: 8px;">(${percentage}%)</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/school/parent/grades" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View All Grades
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Grade Update: ${studentName} - ${subjectName} - ${context.schoolName}`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Grade update notification sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending grade update:', error);
    return false;
  }
}

export async function sendFeeReminderEmail(
  to: string,
  studentName: string,
  feeType: string,
  amount: number,
  dueDate: string,
  isOverdue: boolean,
  context: SchoolEmailContext
) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount / 100);
  
  const urgencyColor = isOverdue ? '#ef4444' : '#f59e0b';
  const urgencyText = isOverdue ? 'OVERDUE' : 'DUE SOON';
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Fee Payment Reminder</h2>
    <div style="background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${urgencyColor}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <span style="background-color: ${urgencyColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
        ${urgencyText}
      </span>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      This is a reminder about an outstanding fee payment for ${studentName}.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fee Type:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${feeType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 700; font-size: 18px; text-align: right;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; color: ${isOverdue ? '#ef4444' : '#1f2937'}; font-weight: 600; text-align: right;">${dueDate}</td>
        </tr>
      </table>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      Please make the payment at your earliest convenience to avoid any inconvenience.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/school/parent/fees" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Pay Now
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `${isOverdue ? 'OVERDUE: ' : ''}Fee Reminder: ${feeType} - ${context.schoolName}`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Fee reminder sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending fee reminder:', error);
    return false;
  }
}

export async function sendPaymentConfirmation(
  to: string,
  studentName: string,
  feeType: string,
  amount: number,
  paymentReference: string,
  paymentDate: string,
  context: SchoolEmailContext
) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount / 100);
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Payment Confirmation</h2>
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <p style="color: #166534; margin: 0; font-weight: 600;">
        Payment Successful!
      </p>
    </div>
    <p style="color: #4b5563; line-height: 1.6;">
      Thank you for your payment. Here are the details:
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Student:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Fee Type:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${feeType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
          <td style="padding: 8px 0; color: #22c55e; font-weight: 700; font-size: 18px; text-align: right;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Reference:</td>
          <td style="padding: 8px 0; color: #1f2937; font-family: monospace; text-align: right;">${paymentReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date:</td>
          <td style="padding: 8px 0; color: #1f2937; text-align: right;">${paymentDate}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/school/parent/fees" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View Payment History
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Payment Confirmation: ${feeType} - ${context.schoolName}`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Payment confirmation sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return false;
  }
}

export async function sendAnnouncementNotification(
  to: string,
  title: string,
  excerpt: string,
  type: string,
  context: SchoolEmailContext
) {
  const typeColors: Record<string, string> = {
    urgent: '#ef4444',
    event: '#8b5cf6',
    holiday: '#22c55e',
    general: '#3b82f6',
  };
  
  const typeColor = typeColors[type] || '#3b82f6';
  
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">New Announcement</h2>
    <div style="margin-bottom: 20px;">
      <span style="background-color: ${typeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        ${type}
      </span>
    </div>
    <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">${title}</h3>
    <p style="color: #4b5563; line-height: 1.6;">
      ${excerpt}
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/school/announcements" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Read More
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `${type === 'urgent' ? '[URGENT] ' : ''}${title} - ${context.schoolName}`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Announcement notification sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  role: string,
  tempPassword: string,
  loginUrl: string,
  context: SchoolEmailContext
) {
  const content = `
    <h2 style="color: #1f2937; margin: 0 0 20px;">Welcome to ${context.schoolName}!</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      Hello ${firstName},
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      An account has been created for you on the ${context.schoolName} portal as a <strong>${role}</strong>.
    </p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #6b7280; margin: 0 0 8px;">Your login credentials:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Temporary Password:</td>
          <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-weight: 600;">${tempPassword}</td>
        </tr>
      </table>
    </div>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Important:</strong> Please change your password after your first login.
      </p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" 
         style="display: inline-block; padding: 14px 28px; background-color: ${context.primaryColor || '#3b82f6'}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Login Now
      </a>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: `Welcome to ${context.schoolName} - Your Account Details`,
    html: getEmailTemplate(content, context),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', to);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
