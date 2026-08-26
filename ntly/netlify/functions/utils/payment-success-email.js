const { sendEmail } = require('./mailer');
const { createOfferLetterAttachment } = require('./offer-letter-pdf');

function successEmailHtml(student) {
  const studentName = student?.fullName || 'Student';
  const internshipDomain = student?.internshipDomain || 'Internship';

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
      <p>Dear ${studentName},</p>
      <p>Greetings from InternMitra!</p>
      <p>Congratulations! You have been successfully enrolled in the ${internshipDomain} Internship Program.</p>
      <p>This email serves as your official Internship Acceptance Letter and confirms your participation in the internship program.</p>
      <p>Further details, including internship access, training schedules, assignments, and guidelines, will be shared on your registered email address.</p>
      <p>We wish you a successful and rewarding internship journey.</p>
      <p>Best Regards,<br/>InternMitra Team</p>
    </div>
  `;
}

async function sendPaymentSuccessEmail(firebaseAdmin, userId, paymentId) {
  const userRef = firebaseAdmin.firestore().collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`Student ${userId} not found for success email`);
  }

  const student = userSnap.data();
  const to = student?.email;

  if (!to) {
    throw new Error(`Student ${userId} does not have an email address`);
  }

  if (student.paymentSuccessEmailSentAt) {
    return { skipped: true, reason: 'already_sent' };
  }

  const attachment = await createOfferLetterAttachment(firebaseAdmin, userId, student);

  const result = await sendEmail({
    to,
    subject: 'Your InternMitra Internship Acceptance Letter',
    html: successEmailHtml(student),
    attachments: [attachment],
  });

  await userRef.set({
    paymentSuccessEmailSentAt: new Date().toISOString(),
    paymentSuccessEmailAttachment: attachment.filename,
    paymentSuccessEmailProvider: result.provider || 'smtp',
    paymentSuccessEmailId: result.messageId || null,
    paymentSuccessEmailForPaymentId: paymentId || null,
  }, { merge: true });

  return { sent: true, to, id: result.messageId || null };
}

module.exports = {
  sendPaymentSuccessEmail,
};
