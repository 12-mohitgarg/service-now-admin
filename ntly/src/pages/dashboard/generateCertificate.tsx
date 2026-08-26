import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import autoTable from 'jspdf-autotable';

const loadImage = (src: string) => {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
    };
    img.src = src;
  });
};

const parseRobustDate = (isoStr: string | undefined): Date | null => {
  if (!isoStr) return null;
  let cleaned = isoStr.trim();

  // Fix single digit days/months:
  // e.g., 2026-5-1T... -> 2026-05-01T...
  cleaned = cleaned.replace(/-(\d)(T|$)/g, '-0$1$2');
  cleaned = cleaned.replace(/-(\d)-/g, '-0$1-');

  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    const d2 = new Date(isoStr);
    if (isNaN(d2.getTime())) {
      return null;
    }
    return d2;
  }
  return d;
};

const formatDate = (iso: string | undefined) => {
  const d = parseRobustDate(iso);
  if (!d) return '01/06/2026';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getEndDate = (isoStr?: string) => {
  const d = parseRobustDate(isoStr);
  if (!d) return '20/06/2026';
  d.setDate(d.getDate() + 20); // 20 days duration
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const parseParagraph = (text: string): Array<{ text: string; bold: boolean }> => {
  const tokens: Array<{ text: string; bold: boolean }> = [];
  const regex = /<b>(.*?)<\/b>|([^<]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      tokens.push({ text: match[2], bold: false });
    }
  }
  return tokens;
};

const drawStyledParagraph = (
  doc: jsPDF,
  phrases: Array<{ text: string; bold: boolean }>,
  startX: number,
  startY: number,
  lineHeight: number,
  maxWidth: number
) => {
  let curX = startX;
  let curY = startY;

  const tokens: Array<{ text: string; bold: boolean }> = [];
  phrases.forEach((phrase) => {
    const parts = phrase.text.split(/(\s+)/);
    parts.forEach((p) => {
      if (p !== '') {
        tokens.push({ text: p, bold: phrase.bold });
      }
    });
  });

  tokens.forEach((tok) => {
    doc.setFont('Helvetica', tok.bold ? 'bold' : 'normal');
    const tokenWidth = doc.getTextWidth(tok.text);

    if (tok.text.trim() === '') {
      if (curX === startX) return;
      if (curX + tokenWidth <= startX + maxWidth) {
        curX += tokenWidth;
      }
    } else {
      if (curX + tokenWidth > startX + maxWidth) {
        curX = startX;
        curY += lineHeight;
      }
      doc.text(tok.text, curX, curY);
      curX += tokenWidth;
    }
  });
  return curY;
};

export const generateCertificate = async (
  profile: any,
  userId: string
) => {
  if (!userId) {
    throw new Error('User ID missing');
  }

  // Fetch certificate number
  const getCertificateNumber = async (): Promise<string> => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    if (userData?.certificateNumber) {
      return userData.certificateNumber;
    }

    const counterRef = doc(db, 'counters', 'certificate');
    const nextNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, {
          count: 10001,
          lastUpdated: new Date().toISOString()
        });
        return 10001;
      }

      const currentCount = counterDoc.data().count;
      const newCount = currentCount + 1;
      transaction.update(counterRef, {
        count: newCount,
        lastUpdated: new Date().toISOString()
      });
      return newCount;
    });

    await updateDoc(doc(db, 'users', userId), {
      certificateNumber: nextNumber.toString()
    });

    return nextNumber.toString();
  };

  const certificateNumber = await getCertificateNumber();

  // Load template images
  const headerImg = await loadImage('/icomp.png');
  const footerImg = await loadImage('/ff.png');
  const backgroundImg = await loadImage('/dded.jpeg');

  // Fetch test score and grade
  let testScore = 90;
  let testGrade = 'A+';
  try {
    const subRef = doc(db, 'testSubmissions', `${userId}-${profile?.internshipDomain}`);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      const subData = subSnap.data();
      testScore = subData.scorePercentage ?? 90;
      if (testScore >= 90) testGrade = 'A+';
      else if (testScore >= 80) testGrade = 'A';
      else if (testScore >= 70) testGrade = 'B+';
      else if (testScore >= 60) testGrade = 'B';
      else if (testScore >= 50) testGrade = 'C+';
      else if (testScore >= 40) testGrade = 'C';
      else if (testScore >= 33) testGrade = 'D';
      else testGrade = 'F';
    }
  } catch (e) {
    console.error('Error fetching test submission for certificate:', e);
  }

  // PDF init
  const docPDF = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const W = 210;
  const H = 297;
  const ML = 14;

  // Background logo
  const wmSize = 130;
  const wmX = (W - wmSize) / 2;
  const wmY = 108;
  (docPDF as any).saveGraphicsState();
  (docPDF as any).setGState((docPDF as any).GState({ opacity: 0.13 }));
  docPDF.addImage(backgroundImg, 'JPEG', wmX, wmY, wmSize, wmSize);
  (docPDF as any).restoreGraphicsState();

  // Header image
  const headerH = (520 / 2060) * W;
  docPDF.addImage(headerImg, 'PNG', 0, 0, W, headerH);

  let y = headerH + 8;

  // 5. Ref and Date (below dashed line 2)
  docPDF.setFontSize(9.5);
  docPDF.setFont('Helvetica', 'bold');
  docPDF.setTextColor(15, 23, 42);
  docPDF.text('Letter Ref. No.: ', ML, y);
  docPDF.text(`IM/2026/ICC/${certificateNumber}`, ML + docPDF.getTextWidth('Letter Ref. No.: '), y);

  const startStr = '01/06/2026';
  const endStr = '20/06/2026';

  docPDF.text(`Date: ${endStr}`, W - ML, y, { align: 'right' });
  y += 7;

  // Body content paragraph (exactly like the second image template)
  const studentName = profile?.fullName || '[Student Full Name]';
  const parentName = profile?.parentName || '[Father,s/ Guardian,s Name]';
  const rollNumber = profile?.universityRoll || '[Registration No.]';
  const college = profile?.college || '[Name of the Institution]';
  const session = profile?.session || '2023-2027';
  const subject = profile?.subject || profile?.department || '[Subject]';
  const domain = profile?.internshipDomain || '[Domain Name]';
  const gender = profile?.gender?.toLowerCase() || 'male';

  docPDF.setFontSize(9.5);
  docPDF.setTextColor(30, 41, 59);

  const genderPrefix = gender === 'female' ? 'Ms.' : 'Mr.';
  const pronoun = gender === 'female' ? 'her' : 'his';
  const paragraphHTML = `This is certify that <b>${genderPrefix} ${studentName}.</b> S/o or D/o <b>${parentName}.</b> bearing University Registration / Enrolment No. <b>${rollNumber}</b> of <b>${college}.</b> Session <b>${session}</b> with Major in <b>${subject} ,</b> has successfully completed <b>${pronoun}</b> internship in <b>${domain}</b> with InternMitra.`;

  const phrases = parseParagraph(paragraphHTML);
  y = drawStyledParagraph(docPDF, phrases, ML, y, 5.3, W - 2 * ML);
  y += 7;

  // Internship duration & grade details block
  docPDF.setFont('Helvetica', 'bold');
  docPDF.setFontSize(9.5);
  docPDF.setTextColor(30, 41, 59);

  const leftColX = ML;
  const rightColX = 130;

  docPDF.text(`Internship Duration : From ${startStr} to ${endStr}`, leftColX, y);
  docPDF.text(`Grade : [${testGrade}]`, rightColX, y);

  y += 5;

  const hoursCompleted = 120;
  docPDF.text(`Total Hours Completed : ${hoursCompleted} Hours`, leftColX, y);
  docPDF.text(`Percentage : [${testScore}%]`, rightColX, y);

  y += 5;

  docPDF.text('Mode of Internship : Online', leftColX, y);

  y += 7;

  // Internship Performance Assessment Heading
  docPDF.setFont('Helvetica', 'bold');
  docPDF.setFontSize(11);
  docPDF.setTextColor(15, 23, 42);
  docPDF.text('Internship Performance Assessment', ML, y);
  y += 4.5;

  docPDF.setFont('Helvetica', 'normal');
  docPDF.setFontSize(9.2);
  docPDF.setTextColor(71, 85, 105);
  const closingText = 'During the internship, the student worked on Assigned projects and Tasks. Based on our observation and mentorship, we assess the student’s performance as follows';
  const splitClosing = docPDF.splitTextToSize(closingText, W - 2 * ML);
  docPDF.text(splitClosing, ML, y);
  y += splitClosing.length * 4.2 + 3;

  // Performance Table
  autoTable(docPDF, {
    startY: y,
    head: [['S. No.', 'Assessment Criteria', 'Rating(Outstanding/ Good/\nsatisfactory/ Needs Improvement)']],
    body: [
      ['1.', 'Technical Knowledge & Application', 'Good'],
      ['2.', 'Quality of Work & Task Completion', 'Outstanding'],
      ['3.', 'Initiative & Problem-Solving Ability', 'Good'],
      ['4.', 'Communication & Interpersonal Skills', 'Good'],
      ['5.', 'Punctuality, Discipline & Professional Conduct', 'Outstanding']
    ],
    theme: 'grid',
    styles: {
      fontSize: 9.5,
      fontStyle: 'bold',
      font: 'Helvetica',
      cellPadding: { top: 6, right: 3.5, bottom: 6, left: 3.5 },
      textColor: [15, 23, 42],
      fillColor: false as any,
      valign: 'middle'
    },
    headStyles: {
      fillColor: false as any,
      textColor: [15, 23, 42],
      fontSize: 9.6,
      fontStyle: 'bold',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 95, halign: 'center' },
      2: { cellWidth: 70, halign: 'left' }
    },
    tableLineColor: [15, 23, 42],
    tableLineWidth: 0.45
  });

  // Footer image at the bottom
  const footerH = (322 / 1002) * W;
  docPDF.addImage(footerImg, 'PNG', 0, H - footerH, W, footerH);

  // QR Code
  const qrData = `Name: ${studentName}\nRoll Number: ${rollNumber}\nCollege: ${college}\nDomain: ${domain}\nCertificate No: IM/2026/ICC/${certificateNumber}`;
  const qrImage = await QRCode.toDataURL(qrData);

  docPDF.addImage(
    qrImage,
    'PNG',
    ML + 6,
    H - footerH + 5,
    26,
    26
  );

  // Save PDF
  docPDF.save(`InternMitra_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
};
