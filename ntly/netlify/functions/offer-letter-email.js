exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { to, studentName, internshipDomain, fileName, pdfBase64 } = JSON.parse(event.body || '{}');

    if (!to || !pdfBase64) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student email and PDF attachment are required' }),
      };
    }

    const { sendEmail } = require('./utils/mailer');

    console.log(`[Netlify Function] Sending offer letter via Gmail SMTP to: ${to}, Name: ${studentName}`);

    const result = await sendEmail({
      to,
      subject: 'Your InternMitra Internship Acceptance Letter',
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <p>Dear ${studentName || 'Student'},</p>
          <p>Greetings from InternMitra!</p>
          <p>Congratulations! You have been successfully enrolled in the ${internshipDomain || 'Internship'} Internship Program.</p>
          <p>This email serves as your official Internship Acceptance Letter and confirms your participation in the internship program.</p>
          <p>Further details, including internship access, training schedules, assignments, and guidelines, will be shared on your registered email address.</p>
          <p>We wish you a successful and rewarding internship journey.</p>
          <p>Best Regards,<br/>InternMitra Team</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName || 'InternMitra_Offer_Letter.pdf',
          content: pdfBase64,
        },
      ],
    });

    console.log('[Netlify Function] SMTP send result:', result);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent', id: result.messageId || null }),
    };
  } catch (error) {
    console.error('Offer letter email error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Unable to send offer letter email',
        details: error?.message || 'Unknown error',
      }),
    };
  }
};
