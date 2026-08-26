import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COURSE_VIDEO_DAY_LIMIT } from '../../lib/constants';

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

export interface AttendanceEntry {
  id?: string;
  userId: string;
  studentName: string;
  email?: string;
  course: string;
  day: number;
  videoId: string;
  videoTitle: string;
  watchedAt: string;
}

export interface AttendanceVideo {
  day: number;
  title?: string;
}

export interface AttendanceStudent {
  id?: string;
  uid?: string;
  fullName?: string;
  email?: string;
  college?: string;
}

const DEFAULT_ATTENDANCE_DAYS = COURSE_VIDEO_DAY_LIMIT;

const getReportDays = (videos: AttendanceVideo[] = []) => {
  const videoDays = videos
    .map((video) => Number(video.day))
    .filter((day) => Number.isFinite(day) && day > 0);

  if (videoDays.length > 0) {
    return [...new Set(videoDays)].sort((a, b) => a - b);
  }

  return Array.from({ length: DEFAULT_ATTENDANCE_DAYS }, (_, index) => index + 1);
};

const getVideoTitle = (day: number, videos: AttendanceVideo[], entry?: AttendanceEntry) => {
  return entry?.videoTitle || videos.find((video) => Number(video.day) === day)?.title || '-';
};

export const generateAttendanceReport = async (
  student: any,
  entries: AttendanceEntry[],
  videos: AttendanceVideo[] = [],
  filePrefix = 'InternMitra_Attendance'
) => {
  const sortedEntries = [...entries].sort((a, b) => a.day - b.day);
  const studentName = student?.fullName || sortedEntries[0]?.studentName || '[STUDENT NAME]';
  const rollNumber = student?.universityRoll || '[ROLL NO.]';
  const department = student?.department || student?.subject || '[BA/B.SC/B.COM]';

  let semester = student?.semester || '5th Semester';
  if (typeof semester === 'number' || !isNaN(Number(semester))) {
    const num = Number(semester);
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
    semester = `${num}${suffix} Semester`;
  } else if (semester && !semester.toLowerCase().includes('semester')) {
    semester = `${semester} Semester`;
  }

  const domain = student?.internshipDomain || sortedEntries[0]?.course || '[Teacher Training]';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const ML = 14;

  // Load template images
  const headerImg = await loadImage('/attenh.png');
  const footerImg = await loadImage('/hh.png');
  const watermarkImg = await loadImage('/dded.jpeg');
  const stampAndSignatureImg = await loadImage('/sign.png');

  // Header image
  const headerH = (492 / 2056) * W;
  doc.addImage(headerImg, 'PNG', 0, 0, W, headerH);

  // Watermark logo
  const wmSize = 90;
  const wmX = (W - wmSize) / 2;
  const wmY = (H - wmSize) / 2;
  (doc as any).saveGraphicsState();
  (doc as any).setGState((doc as any).GState({ opacity: 0.10 }));
  doc.addImage(watermarkImg, 'JPEG', wmX, wmY, wmSize, wmSize);
  (doc as any).restoreGraphicsState();

  let y = headerH + 6;

  // Title
  doc.setFontSize(13);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 64, 175); // Royal blue
  // doc.text('INTERNSHIP ATTENDENCE REPORT', W / 2, y, { align: 'center' });
  y += 3;

  // Dashed separator line
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(ML, y, W - ML, y);
  y += 5;

  // Reset line dash pattern to solid
  doc.setLineDashPattern([], 0);

  // Student details box
  const boxY = y;
  const boxH = 38;
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.25);
  doc.rect(ML, boxY, W - 2 * ML, boxH);

  // Print details inside the box
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);

  let detailY = boxY + 5.5;
  const drawLine = (label: string, val: string) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(label, ML + 5, detailY);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont('Helvetica', 'normal');
    doc.text(val, ML + 5 + labelWidth + 2.0, detailY);
    detailY += 4.8;
  };

  drawLine('Student Name: ', studentName);
  drawLine('University Roll No: ', rollNumber);
  drawLine('Department: ', department);
  drawLine('Semester : ', semester);
  drawLine('Internship Domain : ', domain);
  drawLine('Internship Period : ', '1 June 2026 to 20 June 2026');
  drawLine('Total Duration : ', '120 Hours');

  y = boxY + boxH + 4;

  // Attendance Table data (Days 1 to 20)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const tableRows = [];
  for (let i = 1; i <= 20; i++) {
    const dateStr = `${i} June 2026`;
    // June 1, 2026 is Monday
    const dayName = dayNames[(i - 1) % 7];
    tableRows.push([
      i.toString(),
      dateStr,
      dayName,
      '6 hours',
      '✓',
      'Internship activities as per schedule'
    ]);
  }

  // Draw table
  autoTable(doc, {
    startY: y,
    head: [['Day', 'Date', 'Day', 'Hours', 'Present', 'Remarks/Work Done']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, fontStyle: 'normal', font: 'Helvetica', cellPadding: 1.5, textColor: [30, 41, 59], halign: 'center' },
    headStyles: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0.2, lineColor: [156, 163, 175] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20, textColor: [34, 197, 94], fontStyle: 'bold' }, // Green checkmark
      5: { cellWidth: 57, halign: 'left' }
    },
    tableLineColor: [156, 163, 175],
    tableLineWidth: 0.2
  });

  const finalY = (doc as any).lastAutoTable.finalY || y + 120;

  // Summary Box / Table
  autoTable(doc, {
    startY: finalY + 4,
    // body: [
    //   ['Total Days : 20', 'Days Present : 20', 'Attendance % : 100%'],
    //   ['Total Hours : 120', 'Hours Completed : 120', 'Completion : 100%']
    // ],
    theme: 'grid',
    styles: { fontSize: 8, fontStyle: 'bold', cellPadding: 2.2, textColor: [15, 23, 42], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 46 },
      2: { cellWidth: 42 }
    },
    tableLineColor: [15, 23, 42],
    tableLineWidth: 0.3,
    margin: { left: ML }
  });

  // Footer image at the bottom (dd.png)
  const footerH = (400 / 1653) * W;
  doc.addImage(footerImg, 'PNG', 0, H - footerH, W, footerH);

  // Replace the footer's old signature with the approved stamp and signature.
  const signatureX = 149;
  const signatureW = 63;
  const signatureH = (344 / 724) * signatureW;
  doc.setFillColor(255, 255, 255);
  doc.rect(144, H - footerH, W - 144, 38, 'F');
  doc.addImage(
    stampAndSignatureImg,
    'PNG',
    signatureX,
    H - footerH + 4,
    signatureW,
    signatureH
  );

  doc.save(`${filePrefix}_${studentName.replace(/\s+/g, '_')}.pdf`);
};

export const generateCourseAttendanceReport = (
  course: string,
  entries: AttendanceEntry[],
  students: AttendanceStudent[] = [],
  videos: AttendanceVideo[] = []
) => {
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.studentName !== b.studentName) return a.studentName.localeCompare(b.studentName);
    return a.day - b.day;
  });
  const days = getReportDays(videos);
  const studentsById = new Map<string, AttendanceStudent>();

  students.forEach((student) => {
    const id = student.uid || student.id;
    if (id) studentsById.set(id, student);
  });

  sortedEntries.forEach((entry) => {
    if (!studentsById.has(entry.userId)) {
      studentsById.set(entry.userId, {
        id: entry.userId,
        fullName: entry.studentName,
        email: entry.email
      });
    }
  });

  const reportStudents = [...studentsById.entries()].sort(([, a], [, b]) =>
    (a.fullName || '').localeCompare(b.fullName || '')
  );
  const entryByStudentAndDay = new Map(
    sortedEntries.map((entry) => [`${entry.userId}-${Number(entry.day)}`, entry])
  );
  const presentCount = sortedEntries.length;
  const totalExpected = reportStudents.length * days.length;
  const absentCount = Math.max(totalExpected - presentCount, 0);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INTERNMITRA COURSE ATTENDANCE REPORT', 148, 15, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(course || 'Course', 14, 40);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 48);
  doc.text(`Present: ${presentCount}   Absent: ${absentCount}`, 14, 55);

  autoTable(doc, {
    startY: 64,
    head: [['Student', 'Email', 'Day', 'Video Title', 'Status', 'Attendance Date']],
    body: reportStudents.flatMap(([studentId, student]) =>
      days.map((day) => {
        const entry = entryByStudentAndDay.get(`${studentId}-${day}`);

        return [
          student.fullName || entry?.studentName || 'Student',
          student.email || entry?.email || '-',
          `Day ${day}`,
          getVideoTitle(day, videos, entry),
          entry ? 'Present' : 'Absent',
          entry ? new Date(entry.watchedAt).toLocaleString('en-IN') : '-'
        ];
      })
    ),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`InternMitra_Course_Attendance_${course.replace(/\s+/g, '_')}.pdf`);
};
