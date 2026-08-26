import { doc, getDoc, increment, runTransaction, updateDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { db } from './firebase';
import { UserProfile } from '../types';

type OfferLetterProfile = Partial<UserProfile> & {
  uid?: string;
  modeOfInternship?: string;
  mode?: string;
};

type TextSegment = {
  text: string;
  bold?: boolean;
};

export function loadImageAsDataUrl(src: string, format: 'image/png' | 'image/jpeg' = 'image/png') {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to prepare image canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL(format));
    };
    img.onerror = () => reject(new Error(`Unable to load image ${src}`));
    img.src = src;
  });
}

export async function getOrCreateOfferLetterNumber(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  if (userData?.offerLetterNumber) {
    return userData.offerLetterNumber;
  }

  const counterRef = doc(db, 'counters', 'offerLetter');
  const nextNumber = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      transaction.set(counterRef, { count: 10001, lastUpdated: new Date().toISOString() });
      return 10001;
    }

    const currentCount = counterDoc.data().count || 10000;
    const newCount = currentCount + 1;
    transaction.update(counterRef, { count: increment(1), lastUpdated: new Date().toISOString() });
    return newCount;
  });

  await updateDoc(userRef, { offerLetterNumber: nextNumber.toString() });
  return nextNumber.toString();
}

export async function loadOfferLetterAssets() {
  const [headerImg, footerImg, watermarkImg] = await Promise.all([
    loadImageAsDataUrl('/offer-letter-header.png'),
    loadImageAsDataUrl('/ff.png'),
    loadImageAsDataUrl('/dded.jpeg', 'image/jpeg').catch(() => '')
  ]);

  return { headerImg, footerImg, watermarkImg };
}

function renderRichText(
  pdf: jsPDF,
  segments: TextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontSize: number
) {
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

export function createOfferLetterPdf(profile: OfferLetterProfile, letterNumber: string, assets: { headerImg: string; footerImg: string; watermarkImg?: string }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, ML = 12;

  const studentName = profile.fullName || '[Student Full Name]';
  const registrationNumber = profile.universityRoll || '[Registration Number]';
  const rollNumber = profile.universityRollNo || '[Roll Number]';
  const college = profile.college || '[Name Of College]';
  const deptSemester = `${profile.department || 'B.A.(Pol. Sci.)'} - ${profile.semester || '5th Semester'}`;
  const domain = profile.internshipDomain || '[Domain as per Subject / Interest]';
  const internshipMode = profile.internshipMode || profile.modeOfInternship || profile.mode || 'Online';

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '........./........./2026';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const letterDate = formatDate(profile.registrationDate);

  const headerH = (206 / 808) * W;
  const footerH = (322 / 1002) * W;

  pdf.addImage(assets.headerImg, 'PNG', -0.6, 0, W + 1.2, headerH);

  if (assets.watermarkImg) {
    const wmSize = 150;
    const wmX = (W - wmSize) / 2;
    const wmY = headerH + 24;
    (pdf as any).saveGraphicsState();
    (pdf as any).setGState((pdf as any).GState({ opacity: 0.1 }));
    pdf.addImage(assets.watermarkImg, 'JPEG', wmX, wmY, wmSize, wmSize);
    (pdf as any).restoreGraphicsState();
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
  pdf.text(` ${letterDate}`, 174, y);
  y += 10;

  pdf.setFont('Helvetica', 'normal');
  pdf.text('To,', x, y); y += 6;
  pdf.setFont('Helvetica', 'bold');
  pdf.text(profile.fullName ? studentName : `[${studentName}]`, x, y); y += 6;
  pdf.setFont('Helvetica', 'bold');
  const detailColonX = x + 45;
  const detailValueX = detailColonX + 5;
  pdf.text('University Reg. Number', x, y);
  pdf.text(':', detailColonX, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(profile.universityRoll ? registrationNumber : `[${registrationNumber}]`, detailValueX, y); y += 6;
  pdf.setFont('Helvetica', 'bold');
  pdf.text('College / Institution', x, y);
  pdf.text(':', detailColonX, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(profile.college ? college : `[${college}]`, detailValueX, y); y += 12;

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text('Dear Candidate,', x, y); y += 4.8;
  y = renderRichText(pdf, [
    { text: 'We are pleased to accept your application and formally offer you an internship at ' },
    { text: 'Internmitra Technologies Private Limited(InternMitra).', bold: true },
    { text: ' Our internship programmes are designed in full alignment with ' },
    { text: 'NEP-2020, AICTE and UGC Internship Guidelines,', bold: true },
    { text: " and your university's specific internship framework." }
  ], x, y, W - 2 * ML, 4.3, 9.5) + 7;

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Your internship details are as follows:', x, y); y += 7;

  const rowX = x + 8;
  const colC = 78, colV = 82, rH = 6;
  const rows: [string, string][] = [
    ['Name of the Student', profile.fullName ? studentName : `[${studentName}]`],
    ['University Roll Number', profile.universityRollNo ? rollNumber : `[${rollNumber}]`],
    ['College / Institution', profile.college ? college : `[${college}]`],
    ['Department & Semester', deptSemester],
    ['Internship Domain', profile.internshipDomain ? domain : `[${domain}]`],
    ['Internship Duration', '120 Hours'],
    ['Mode of Internship', `${internshipMode} (as approved by College)`],
    // ['Internship Start Date', '01/08/2026'],
    // ['Expected End Date', '20/08/2026'],
  ];
  rows.forEach(([label, value]) => {
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(label, rowX, y);
    pdf.text(':', colC, y);
    pdf.setFont('Helvetica', 'normal');
    pdf.text(value, colV, y);
    y += rH;
  });
  y += 5;

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(9.5);
  y = renderRichText(pdf, [
    { text: 'Please report to us on your start date as per the schedule above and bring this letter along with the ' },
    { text: 'Consent Letter', bold: true },
    { text: ' issued by your College. We also request that you inform your ' },
    { text: 'College Internship Nodal Officer (CINO)', bold: true },
    { text: ' upon receiving this acceptance letter. During the programme, you are required to maintain the minimum required attendance and complete all tasks and assignments given by your mentor.' }
  ], x, y, W - 2 * ML, 4.2, 9.5) + 4;

  renderRichText(pdf, [
    { text: 'We look forward to a meaningful and enriching internship experience and appreciate your interest in ' },
    { text: 'InternMitra.', bold: true }
  ], x, y, W - 2 * ML, 4.2, 9.5);

  pdf.addImage(assets.footerImg, 'PNG', 0, H - footerH, W, footerH);

  return pdf;
}

export function offerLetterFileName(studentName?: string) {
  return `InternMitra_Offer_Letter_${(studentName || 'Student').replace(/\s+/g, '_')}.pdf`;
}

export async function createOfferLetterPdfForUser(userId: string, profile: OfferLetterProfile) {
  const [letterNumber, assets] = await Promise.all([
    getOrCreateOfferLetterNumber(userId),
    loadOfferLetterAssets()
  ]);

  return createOfferLetterPdf(profile, letterNumber, assets);
}

export async function emailOfferLetter(userId: string, profile: OfferLetterProfile) {
  if (!profile.email) {
    throw new Error('Student email is missing');
  }

  const pdf = await createOfferLetterPdfForUser(userId, profile);
  const dataUri = pdf.output('datauristring');
  const pdfBase64 = dataUri.split(',')[1];

  const response = await fetch('/api/offer-letter-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: profile.email,
      studentName: profile.fullName || 'Student',
      internshipDomain: profile.internshipDomain || 'Internship',
      fileName: offerLetterFileName(profile.fullName),
      pdfBase64
    })
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.details || result?.error || 'Unable to send offer letter email');
  }

  return result;
}
