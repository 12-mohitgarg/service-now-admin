const path = require('path');
const admin = require('firebase-admin');
const XLSX = require('xlsx');

const serviceAccount = require('../firestore-import/serviceAccountKey.json');

const TARGET_FILES = [
  'MAHILA COLLEGE TEKARI Ex-Student.xlsx',
  'Mahila_College_Tekari_Session_2023-27_Sem-V (1).xlsx',
  'Mahila_College_Tekari_Session_2024-28_Sem-V.xlsx',
];

const isDryRun = process.argv.includes('--dry-run');
const rootDir = path.resolve(__dirname, '..');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function normalizeHeader(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function findColIndex(headers, names) {
  const normalizedNames = names.map(normalizeHeader);
  return headers.findIndex((header) => normalizedNames.includes(normalizeHeader(header)));
}

function clean(value) {
  if (value instanceof Date) return value.toLocaleDateString('en-IN');
  return String(value || '').replace(/\u00a0/g, ' ').trim();
}

function normalizeSubject(value) {
  const cleaned = clean(value).replace(/^Major\s*:\s*/i, '').trim();
  const bracketMatch = cleaned.match(/^[A-Z]\.[A-Z][A-Za-z.]*\s*\((.+)\)$/i);
  return bracketMatch ? bracketMatch[1].trim() : cleaned;
}

function normalizeSemester(value) {
  const cleaned = clean(value);
  const romanMap = {
    I: 'Semester 1',
    II: 'Semester 2',
    III: 'Semester 3',
    IV: 'Semester 4',
    V: 'Semester 5',
    VI: 'Semester 6',
    VII: 'Semester 7',
    VIII: 'Semester 8',
  };
  if (romanMap[cleaned.toUpperCase()]) return romanMap[cleaned.toUpperCase()];
  if (/^\d+$/.test(cleaned)) return `Semester ${cleaned}`;
  return cleaned;
}

function normalizeCollege(value) {
  const cleaned = clean(value);
  const comparable = cleaned.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
  if (comparable === 'mahila college tekari' || comparable === 'mahila college tekari gaya') return 'Mahila College Tekari, Gaya';
  return cleaned;
}

function parseFile(fileName) {
  const workbook = XLSX.readFile(path.join(rootDir, fileName), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  const headers = (rows[0] || []).map(clean);

  const idx = {
    fullName: findColIndex(headers, ['Student Name', "Student's Name", 'Name', 'Full Name', 'fullName', 'StudentName']),
    parentName: findColIndex(headers, ["Father's Name", 'Father Name', 'Parent Name', 'parentName', 'FatherName']),
    contactNumber: findColIndex(headers, ['Mobile Number', 'Mobile', 'Phone', 'contactNumber', 'Phone Number', 'MobileNo', 'Mobile No']),
    email: findColIndex(headers, ['Email', 'email', 'Email Address', 'EmailId', 'E-mail']),
    gender: findColIndex(headers, ['Gender', 'gender', 'Sex']),
    university: findColIndex(headers, ['University', 'university', 'University Name']),
    college: findColIndex(headers, ['College Name', 'College', 'college']),
    degree: findColIndex(headers, ['Degree', 'Degree (UG/PG)']),
    department: findColIndex(headers, ['Department', 'Department Name']),
    subject: findColIndex(headers, ['Subject', 'Subjects', 'Major Subject']),
    session: findColIndex(headers, ['Session', 'Academic Session']),
    semester: findColIndex(headers, ['Semester', 'semester', 'Year/Semester']),
    universityRoll: findColIndex(headers, ['University Registration Number', 'Registration Number', 'Reg No', 'Reg. No.', 'universityRoll', 'RegNo']),
    universityRollNo: findColIndex(headers, ['University Roll No', 'University Roll Number', 'Roll Number', 'Roll No', 'universityRollNo', 'RollNo']),
    internshipDomain: findColIndex(headers, ['Internship Domain', 'Domain', 'domain']),
    internshipMode: findColIndex(headers, ['Mode', 'Mode (Online/Offline)', 'Internship Mode']),
    password: findColIndex(headers, ['Password', 'Default Password']),
  };

  return rows.slice(1)
    .filter((row) => row.some((value) => clean(value)))
    .map((row) => {
      const get = (key) => idx[key] === -1 ? '' : clean(row[idx[key]]);
      const rawDegree = get('degree');
      const internshipDomain = get('internshipDomain');

      return {
        fullName: get('fullName'),
        parentName: get('parentName'),
        contactNumber: get('contactNumber').replace(/\D/g, '').slice(-10),
        email: get('email').toLowerCase(),
        gender: get('gender') || 'Female',
        district: 'Gaya',
        college: normalizeCollege(get('college')) || 'Mahila College Tekari, Gaya',
        university: get('university') || 'Magadh University (MU), Bodh Gaya',
        degree: rawDegree === 'UG' || rawDegree === 'PG' ? rawDegree : (rawDegree.includes('B.') ? 'UG' : rawDegree),
        department: get('department') || 'B.A.',
        subject: normalizeSubject(get('subject')),
        session: get('session'),
        semester: normalizeSemester(get('semester')),
        course: internshipDomain,
        internshipDomain,
        internshipMode: get('internshipMode') || 'Online',
        universityRoll: get('universityRoll'),
        universityRollNo: get('universityRollNo'),
        industrialRegNo: '',
        academicDetails: [get('department') || rawDegree, normalizeSubject(get('subject'))].filter(Boolean).join(' | '),
        sourceFile: fileName,
      };
    });
}

async function loadExistingRolls(collectionName) {
  const snapshot = await db.collection(collectionName).select('universityRoll').get();
  const rolls = new Set();
  snapshot.forEach((doc) => {
    const roll = clean(doc.data().universityRoll);
    if (roll) rolls.add(roll);
  });
  return rolls;
}

async function run() {
  const importedRef = db.collection('importedStudents');
  const seenRolls = new Set();
  const importedStudents = TARGET_FILES.flatMap(parseFile);
  const skipped = [];
  const ready = [];
  const [registeredRolls, importedRolls] = await Promise.all([
    loadExistingRolls('users'),
    loadExistingRolls('importedStudents'),
  ]);

  for (const student of importedStudents) {
    if (!student.universityRoll) {
      skipped.push({ student, reason: 'Missing registration number' });
      continue;
    }
    if (!student.universityRollNo) {
      skipped.push({ student, reason: 'Missing roll number' });
      continue;
    }
    if (seenRolls.has(student.universityRoll)) {
      skipped.push({ student, reason: 'Duplicate registration number in selected files' });
      continue;
    }
    seenRolls.add(student.universityRoll);

    if (registeredRolls.has(student.universityRoll)) {
      skipped.push({ student, reason: 'Already registered with this registration number' });
      continue;
    }
    if (importedRolls.has(student.universityRoll)) {
      skipped.push({ student, reason: 'Already exists in importedStudents' });
      continue;
    }

    ready.push(student);
  }

  console.log(`Parsed rows: ${importedStudents.length}`);
  console.log(`Ready to import: ${ready.length}`);
  console.log(`Skipped: ${skipped.length}`);

  const skippedByReason = skipped.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});
  console.log('Skipped by reason:', skippedByReason);

  if (isDryRun) {
    console.log('Dry run only. No Firestore writes performed.');
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let written = 0;
  const now = new Date().toISOString();

  for (const student of ready) {
    const docRef = importedRef.doc();
    batch.set(docRef, {
      ...student,
      importedAt: now,
      paymentStatus: 'Pending',
      whatsappSent: false,
    });
    batchCount += 1;
    written += 1;

    if (batchCount === 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();
  console.log(`Import complete. Written: ${written}. Skipped: ${skipped.length}.`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
