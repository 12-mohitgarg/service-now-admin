exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { studentName, studentEmail, category, subject, description } = JSON.parse(event.body || '{}');

    if (!studentEmail || !subject || !description) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student email, subject, and description are required' }),
      };
    }

    const { sendEmail } = require('./utils/mailer');

    console.log(`[Netlify Function] Sending support ticket notification to info@internmitra.com from ${studentEmail}`);

    const result = await sendEmail({
      to: 'info@internmitra.com',
      subject: `[Support Ticket] ${category}: ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;max-width:600px;border:1px solid #e2e8f0;padding:20px;border-radius:12px;background-color:#ffffff;">
          <h2 style="color:#2563eb;margin-top:0;">New Support Ticket Received</h2>
          <p style="color:#64748b;font-size:13px;margin-top:-5px;">InternMitra Portal Support Node</p>
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:15px 0;"/>
          
          <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#475569;width:120px;">Student Name:</td>
              <td style="padding:4px 0;color:#0f172a;">${studentName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#475569;">Student Email:</td>
              <td style="padding:4px 0;color:#0f172a;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#475569;">Category:</td>
              <td style="padding:4px 0;color:#2563eb;font-weight:bold;">${category}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-weight:bold;color:#475569;">Subject:</td>
              <td style="padding:4px 0;color:#0f172a;">${subject}</td>
            </tr>
          </table>

          <p style="font-weight:bold;color:#475569;margin-bottom:6px;">Message Description:</p>
          <div style="background-color:#f8fafc;padding:15px;border-radius:8px;border:1px solid #e2e8f0;color:#334155;white-space:pre-wrap;font-size:13px;line-height:1.5;">${description}</div>
          
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="font-size:11px;color:#94a3b8;margin-bottom:0;text-align:center;">This is a computer-generated support notice sent automatically via Gmail SMTP.</p>
        </div>
      `,
    });

    console.log('[Netlify Function] Support ticket email SMTP send result:', result);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent', id: result.messageId || null }),
    };
  } catch (error) {
    console.error('Support ticket email error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Unable to send support ticket email',
        details: error?.message || 'Unknown error',
      }),
    };
  }
};
