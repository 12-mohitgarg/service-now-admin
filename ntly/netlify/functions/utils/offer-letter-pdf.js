const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

function imageDataUrl(relativePublicPath, mimeType) {
  const candidates = [
    path.join(process.cwd(), 'public', relativePublicPath),
    path.join(process.cwd(), relativePublicPath),
    path.join(__dirname, '..', '..', '..', 'public', relativePublicPath),
    path.join(__dirname, '..', '..', relativePublicPath),
  ];

  const filePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!filePath) {
    throw new Error(`Offer letter asset not found: ${relativePublicPath}`);
  }

  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function formatDate(iso) {
  if (!iso) return '........./........./2026';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '........./........./2026';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function renderRichText(pdf, segments, x, y, maxWidth, lineHeight, fontSize) {
  let cursorX = x;
  let cursorY = y;

  pdf.setFontSize(fontSize);
  segments.forEach((segment) => {
    const words = segment.text.split(/(\s+)/).filter(Boolean);
    pdf.setFont('Helvetica', segment.bold ? 'bold' : 'normal');

    words.forEach((word) => {
      const wordWidth = pdf.getTextWidth(word);
      if (cursorX > x && cursorX + wordWidth > x + maxWidth) {
        cursorX = x;
        cursorY += lineHeight;
      }
      pdf.text(word, cursorX, cursorY);
      cursorX += wordWidth;
    });
  });

  return cursorY + lineHeight;
}

async function getOrCreateOfferLetterNumber(firebaseAdmin, userId) {
  const db = firebaseAdmin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  if (userData?.offerLetterNumber) {
    return userData.offerLetterNumber;
  }

  return db.runTransaction(async (transaction) => {
    const freshUserSnap = await transaction.get(userRef);
    const freshUserData = freshUserSnap.data();
    if (freshUserData?.offerLetterNumber) {
      return freshUserData.offerLetterNumber;
    }

    const counterRef = db.collection('counters').doc('offerLetter');
    const counterSnap = await transaction.get(counterRef);
    const currentCount = counterSnap.exists ? Number(counterSnap.data().count || 10000) : 10000;
    const nextNumber = currentCount + 1;

    if (counterSnap.exists) {
      transaction.update(counterRef, {
        count: firebaseAdmin.firestore.FieldValue.increment(1),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      transaction.set(counterRef, {
        count: nextNumber,
        lastUpdated: new Date().toISOString(),
      });
    }

    transaction.set(userRef, { offerLetterNumber: String(nextNumber) }, { merge: true });
    return String(nextNumber);
  });
}

function createOfferLetterPdf(profile, letterNumber) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const ML = 12;

  const headerImg = imageDataUrl('offer-letter-header.png', 'image/png');
  const footerImg = imageDataUrl('ff.png', 'image/png');
  let watermarkImg = '';
  try {
    watermarkImg = imageDataUrl('dded.jpeg', 'image/jpeg');
  } catch {
    watermarkImg = '';
  }

  const studentName = profile.fullName || '[Student Full Name]';
  const registrationNumber = profile.universityRoll || profile.universityRegistrationNumber || '[Registration Number]';
  const rollNumber = profile.universityRollNo || '[Roll Number]';
  const college = profile.college || '[Name Of College]';
  const deptSemester = `${profile.department || 'B.A.(Pol. Sci.)'} - ${profile.semester || '5th Semester'}`;
  const domain = profile.internshipDomain || '[Domain as per Subject / Interest]';
  const internshipMode = profile.internshipMode || profile.modeOfInternship || profile.mode || 'Online';

  const headerH = (206 / 808) * W;
  const footerH = (322 / 1002) * W;

  pdf.addImage(headerImg, 'PNG', -0.6, 0, W + 1.2, headerH);

  if (watermarkImg) {
    const wmSize = 150;
    const wmX = (W - wmSize) / 2;
    const wmY = headerH + 24;
    pdf.saveGraphicsState();
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.addImage(watermarkImg, 'JPEG', wmX, wmY, wmSize, wmSize);
    pdf.restoreGraphicsState();
  }

  const x = ML;
  let y = headerH + 3;
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);

  pdf.setFont('Times', 'bold');
  pdf.text('Letter Ref. No.:', x, y);
  pdf.setFont('Times', 'normal');
  pdf.text(`IM/2026/IAL/${letterNumber}`, x + pdf.getTextWidth('Letter Ref. No.:') + 2, y);
  pdf.setFont('Times', 'bold');
  pdf.text('Date:', 163, y);
  pdf.setFont('Times', 'normal');
  pdf.text(` ${formatDate(profile.registrationDate)}`, 174, y);
  y += 10;

  pdf.setFont('Helvetica', 'normal');
  pdf.text('To,', x, y);
  y += 6;
  pdf.setFont('Helvetica', 'bold');
  pdf.text(profile.fullName ? studentName : `[${studentName}]`, x, y);
  y += 6;

  pdf.setFont('Helvetica', 'bold');
  const detailColonX = x + 45;
  const detailValueX = detailColonX + 5;
  pdf.text('University Reg. Number', x, y);
  pdf.text(':', detailColonX, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(profile.universityRoll ? registrationNumber : `[${registrationNumber}]`, detailValueX, y);
  y += 6;

  pdf.setFont('Helvetica', 'bold');
  pdf.text('College / Institution', x, y);
  pdf.text(':', detailColonX, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(profile.college ? college : `[${college}]`, detailValueX, y);
  y += 12;

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Dear Candidate,', x, y);
  y += 4.8;
  y = renderRichText(pdf, [
    { text: 'We are pleased to accept your application and formally offer you an internship at ' },
    { text: 'Internmitra Technologies Private Limited(InternMitra).', bold: true },
    { text: ' Our internship programmes are designed in full alignment with ' },
    { text: 'NEP-2020, AICTE and UGC Internship Guidelines,', bold: true },
    { text: " and your university's specific internship framework." },
  ], x, y, W - 2 * ML, 4.3, 9.5) + 7;

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Your internship details are as follows:', x, y);
  y += 7;

  const rowX = x + 8;
  const colC = 78;
  const colV = 82;
  const rows = [
    ['Name of the Student', profile.fullName ? studentName : `[${studentName}]`],
    ['University Roll Number', profile.universityRollNo ? rollNumber : `[${rollNumber}]`],
    ['College / Institution', profile.college ? college : `[${college}]`],
    ['Department & Semester', deptSemester],
    ['Internship Domain', profile.internshipDomain ? domain : `[${domain}]`],
    ['Internship Duration', '120 Hours'],
    ['Mode of Internship', `${internshipMode} (as approved by College)`],
    // ['Internship Start Date', '16/08/2026'],
    // ['Expected End Date', '15/09/2026'],
  ];

  rows.forEach(([label, value]) => {
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(label, rowX, y);
    pdf.text(':', colC, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(String(value), colV, y);
    y += 6;
  });
  y += 5;

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(9.5);
  y = renderRichText(pdf, [
    { text: 'Please report to us on your start date as per the schedule above and bring this letter along with the ' },
    { text: 'Consent Letter', bold: true },
    { text: ' issued by your College. We also request that you inform your ' },
    { text: 'College Internship Nodal Officer (CINO)', bold: true },
    { text: ' upon receiving this acceptance letter. During the programme, you are required to maintain the minimum required attendance and complete all tasks and assignments given by your mentor.' },
  ], x, y, W - 2 * ML, 4.2, 9.5) + 4;

  renderRichText(pdf, [
    { text: 'We look forward to a meaningful and enriching internship experience and appreciate your interest in ' },
    { text: 'InternMitra.', bold: true },
  ], x, y, W - 2 * ML, 4.2, 9.5);

  pdf.addImage(footerImg, 'PNG', 0, H - footerH, W, footerH);

  return pdf;
}

function offerLetterFileName(studentName) {
  return `InternMitra_Offer_Letter_${(studentName || 'Student').replace(/\s+/g, '_')}.pdf`;
}

async function createOfferLetterAttachment(firebaseAdmin, userId, profile) {
  const letterNumber = await getOrCreateOfferLetterNumber(firebaseAdmin, userId);
  const pdf = createOfferLetterPdf(profile, letterNumber);
  return {
    filename: offerLetterFileName(profile.fullName),
    content: Buffer.from(pdf.output('arraybuffer')).toString('base64'),
  };
}

module.exports = {
  createOfferLetterAttachment,
};
