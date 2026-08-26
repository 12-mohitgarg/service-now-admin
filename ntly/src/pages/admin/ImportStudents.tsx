import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Sparkles, Upload, FileText, CheckCircle2, AlertCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, limit } from 'firebase/firestore';

interface ParsedStudent {
  fullName: string;
  parentName: string;
  contactNumber: string;
  email: string;
  gender: string;
  district: string;
  college: string;
  university: string;
  degree: string;
  department: string;
  subject: string;
  session: string;
  course: string;
  semester: string;
  universityRoll: string;
  universityRollNo: string;
  industrialRegNo: string;
  internshipDomain: string;
  internshipMode: string;
  password?: string;
  motherName?: string;
  dateOfBirth?: string;
  academicDetails?: string;
}

interface ImportSkippedStudent extends ParsedStudent {
  reason: string;
}

interface ImportSummary {
  importedCount: number;
  skippedCount: number;
  importedStudents: ParsedStudent[];
  skippedStudents: ImportSkippedStudent[];
}

export default function ImportStudents() {
  const navigate = useNavigate();
  const { user, adminProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setParsedData([]);
    setHeaders([]);
    setErrorMsg('');
    setSuccessMsg('');
    setWarnings([]);
    setImportSummary(null);

    if (!selectedFile) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error("Could not read file data");

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length < 2) {
          throw new Error("Excel sheet must contain a header row and at least one data row.");
        }

        const rawHeaders = json[0].map((h: any) => String(h || '').replace(/\u00a0/g, ' ').trim());
        setHeaders(rawHeaders);

        // Find mappings
        const mappedStudents: ParsedStudent[] = [];
        const fileWarnings: string[] = [];

        // Helper to find column index by multiple potential names
        const normalizeHeader = (value: string) =>
          value
            .replace(/\u00a0/g, ' ')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');

        const normalizeDepartment = (value: string) => {
          const cleaned = value.replace(/\u00a0/g, ' ').trim();
          const match = cleaned.match(/^(B\.A\.|B\.Sc\.|B\.Com\.|M\.A\.|M\.Sc\.|M\.Com\.)/i);
          return match ? match[1].replace(/(^|\.)([a-z])/g, s => s.toUpperCase()) : cleaned;
        };

        const normalizeSubjectValue = (value: string) => {
          const cleaned = value
            .replace(/\u00a0/g, ' ')
            .replace(/^Major\s*:\s*/i, '')
            .trim();
          const bracketMatch = cleaned.match(/^[A-Z]\.[A-Z][A-Za-z.]*\s*\((.+)\)$/i);
          return bracketMatch ? bracketMatch[1].trim() : cleaned;
        };

        const normalizeSemesterValue = (value: string) => {
          const cleaned = value.replace(/\u00a0/g, ' ').trim();
          const romanMap: Record<string, string> = {
            I: 'Semester 1',
            II: 'Semester 2',
            III: 'Semester 3',
            IV: 'Semester 4',
            V: 'Semester 5',
            VI: 'Semester 6',
            VII: 'Semester 7',
            VIII: 'Semester 8',
          };
          const upper = cleaned.toUpperCase();
          if (romanMap[upper]) return romanMap[upper];
          if (/^\d+$/.test(cleaned)) return `Semester ${cleaned}`;
          return cleaned;
        };

        const normalizeCollegeValue = (value: string) => {
          const cleaned = value.replace(/\u00a0/g, ' ').trim();
          const comparable = cleaned.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
          if (comparable === 'mahila college tekari' || comparable === 'mahila college tekari gaya') return 'Mahila College Tekari, Gaya';
          return cleaned;
        };

        const findColIndex = (names: string[]) => {
          const normalizedNames = names.map(normalizeHeader);
          return rawHeaders.findIndex((h) => normalizedNames.includes(normalizeHeader(h)));
        };

        const nameIdx = findColIndex(['Student Name', "Student's Name", 'Name', 'Full Name', 'fullName', 'StudentName']);
        const parentIdx = findColIndex(["Father's Name", 'Father Name', 'Parent Name', 'parentName', 'FatherName']);
        const motherIdx = findColIndex(["Mother's Name", 'Mother Name', 'MotherName']);
        const dobIdx = findColIndex(['Date of Birth', 'DOB', 'Birth Date']);
        const phoneIdx = findColIndex(['Mobile Number', 'Mobile', 'Phone', 'contactNumber', 'Phone Number', 'MobileNo', 'Mobile No']);
        const emailIdx = findColIndex(['Email', 'email', 'Email Address', 'EmailId', 'E-mail']);
        const genderIdx = findColIndex(['Gender', 'gender', 'Sex']);
        const collegeIdx = findColIndex(['College Name', 'College', 'college']);
        const uniIdx = findColIndex(['University', 'university', 'University Name']);
        const degreeIdx = findColIndex(['Degree', 'Degree (UG/PG)']);
        const departmentIdx = findColIndex(['Department', 'Department Name']);
        const subjectIdx = findColIndex(['Subject', 'Subjects', 'Major Subject']);
        const sessionIdx = findColIndex(['Session', 'Academic Session']);
        const courseIdx = findColIndex(['Course', 'course']);
        const domainIdx = findColIndex(['Internship Domain', 'Domain', 'domain']);
        const modeIdx = findColIndex(['Mode', 'Mode (Online/Offline)', 'Internship Mode']);
        const passwordIdx = findColIndex(['Password', 'Default Password']);
        const semIdx = findColIndex(['Semester', 'semester', 'Year/Semester']);
        const rollIdx = findColIndex(['University Registration Number', 'Registration Number', 'Reg No', 'Reg. No.', 'universityRoll', 'RegNo']);
        const rollNoIdx = findColIndex(['University Roll No', 'University Roll Number', 'Roll Number', 'Roll No', 'universityRollNo', 'RollNo']);
        const indIdx = findColIndex(['Industrial Registration Number', 'Industrial Reg No', 'industrialRegNo', 'IndustrialRegNo']);
        const acadIdx = findColIndex(['Academic Details', 'Academic', 'academicDetails']);

        // Check required fields
        if (rollIdx === -1) fileWarnings.push("Missing University Registration Number column. Students won't be able to verify.");
        if (nameIdx === -1) fileWarnings.push("Missing Student Name column.");
        if (phoneIdx === -1) fileWarnings.push("Missing Mobile Number column.");
        if (emailIdx === -1) fileWarnings.push("Missing Email column.");
        if (domainIdx === -1) fileWarnings.push("Missing Internship Domain column. Students can still import, but the domain will need to be selected during registration.");
        if (sessionIdx === -1) fileWarnings.push("Missing Session column. Students can still import, but session may need manual confirmation.");
        if (semIdx === -1) fileWarnings.push("Missing Semester column. Students can still import, but semester may need manual confirmation.");

        // Parse rows
        for (let r = 1; r < json.length; r++) {
          const row = json[r];
          if (!row || row.length === 0) continue;

          // Skip completely empty rows
          const hasData = row.some((val: any) => val !== null && val !== undefined && String(val).trim() !== '');
          if (!hasData) continue;

          const getVal = (idx: number) => {
            if (idx === -1 || idx >= row.length) return '';
            const value = row[idx];
            if (value instanceof Date) {
              return value.toLocaleDateString('en-IN');
            }
            return String(value || '').replace(/\u00a0/g, ' ').trim();
          };

          const fileName = selectedFile.name.toLowerCase();
          const isMahilaTekariSheet = fileName.includes('mahila') && fileName.includes('tekari');
          const isExStudentSheet = fileName.includes('ex-student');
          const sessionFromFile = fileName.includes('2024-28') ? '2024-28' : fileName.includes('2023-27') ? '2023-27' : '';
          const rawDegree = getVal(degreeIdx);
          const department = getVal(departmentIdx) || normalizeDepartment(rawDegree);
          const subject = normalizeSubjectValue(getVal(subjectIdx));
          const internshipDomain = getVal(domainIdx) || getVal(courseIdx);

          mappedStudents.push({
            fullName: getVal(nameIdx),
            parentName: getVal(parentIdx),
            contactNumber: getVal(phoneIdx),
            email: getVal(emailIdx),
            gender: getVal(genderIdx) || (isMahilaTekariSheet ? 'Female' : ''),
            district: isMahilaTekariSheet ? 'Gaya' : '',
            college: normalizeCollegeValue(getVal(collegeIdx)) || (isMahilaTekariSheet ? 'Mahila College Tekari, Gaya' : ''),
            university: getVal(uniIdx) || (isMahilaTekariSheet ? 'Magadh University (MU), Bodh Gaya' : ''),
            degree: rawDegree === 'UG' || rawDegree === 'PG' ? rawDegree : (rawDegree.includes('B.') ? 'UG' : ''),
            department,
            subject,
            session: getVal(sessionIdx) || sessionFromFile,
            course: internshipDomain,
            semester: normalizeSemesterValue(getVal(semIdx)) || (isExStudentSheet ? '' : 'Semester 5'),
            universityRoll: getVal(rollIdx),
            universityRollNo: getVal(rollNoIdx),
            industrialRegNo: getVal(indIdx),
            internshipDomain,
            internshipMode: getVal(modeIdx) || 'Online',
            password: getVal(passwordIdx),
            motherName: getVal(motherIdx),
            dateOfBirth: getVal(dobIdx),
            academicDetails: getVal(acadIdx) || [rawDegree, subject].filter(Boolean).join(' | '),
          });
        }

        if (mappedStudents.length === 0) {
          throw new Error("No valid student rows found in the uploaded sheet.");
        }

        const countDuplicates = (values: string[]) =>
          values.reduce((count, value, _index, list) => count + (value && list.indexOf(value) !== list.lastIndexOf(value) ? 1 : 0), 0);
        const duplicatePhoneRows = countDuplicates(mappedStudents.map(student => student.contactNumber.replace(/\D/g, '').slice(-10)));
        const duplicateEmailRows = countDuplicates(mappedStudents.map(student => student.email.trim().toLowerCase()));
        if (duplicatePhoneRows > 0) {
          fileWarnings.push(`${duplicatePhoneRows} rows share a mobile number. They will still import because registration number is used as the unique student ID.`);
        }
        if (duplicateEmailRows > 0) {
          fileWarnings.push(`${duplicateEmailRows} rows share an email address. They will still import because registration number is used as the unique student ID.`);
        }

        setWarnings(fileWarnings);
        setParsedData(mappedStudents);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to parse Excel sheet. Check formatting.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("Failed to read file.");
      setLoading(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const importStudentsClientSide = async (students: ParsedStudent[]) => {
    const importedRef = collection(db, "importedStudents");
    const usersRef = collection(db, "users");
    let importedCount = 0;
    const importedStudents: ParsedStudent[] = [];
    const skippedStudents: ImportSkippedStudent[] = [];
    const seenRolls = new Set<string>();
    const CHUNK_SIZE = 100;

    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const student of chunk) {
        const roll = student.universityRoll.trim();
        const email = student.email.trim().toLowerCase();
        const phone = student.contactNumber.replace(/\D/g, '').slice(-10);

        if (!roll) {
          skippedStudents.push({ ...student, reason: "Missing Roll Number" });
          continue;
        }

        if (roll && seenRolls.has(roll)) {
          skippedStudents.push({ ...student, reason: "Duplicate roll number in uploaded file" });
          continue;
        }
        if (roll) seenRolls.add(roll);

        const existingChecks = await Promise.all([
          getDocs(query(usersRef, where("universityRoll", "==", roll), limit(1))),
          getDocs(query(importedRef, where("universityRoll", "==", roll), limit(1))),
        ]);

        if (!existingChecks[0].empty) {
          skippedStudents.push({ ...student, reason: "Student already registered with this roll number" });
          continue;
        }
        if (!existingChecks[1].empty) {
          skippedStudents.push({ ...student, reason: "Student already exists in imported list" });
          continue;
        }

        const docData = {
          fullName: student.fullName || "",
          parentName: student.parentName || "",
          contactNumber: phone || student.contactNumber || "",
          email: email || "",
          gender: student.gender || "",
          district: student.district || "",
          college: student.college || "",
          university: student.university || "",
          degree: student.degree || "",
          department: student.department || "",
          subject: student.subject || "",
          session: student.session || "",
          course: student.course || "",
          semester: student.semester || "",
          universityRoll: roll,
          universityRollNo: student.universityRollNo || "",
          industrialRegNo: student.industrialRegNo || "",
          internshipDomain: student.internshipDomain || student.course || "",
          internshipMode: student.internshipMode || "Online",
          motherName: student.motherName || "",
          dateOfBirth: student.dateOfBirth || "",
          academicDetails: student.academicDetails || "",
          importedAt: new Date().toISOString(),
          paymentStatus: "Pending",
          whatsappSent: false,
        };

        const newRef = doc(collection(db, "importedStudents"));
        batch.set(newRef, docData);
        importedCount += 1;
        importedStudents.push(docData);
      }

      await batch.commit();
    }

    return {
      importedCount,
      skippedCount: skippedStudents.length,
      importedStudents,
      skippedStudents,
    };
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0 || !user) return;

    // Additional check
    const hasUnverifiable = parsedData.some(s => !s.universityRoll);
    if (hasUnverifiable) {
      if (!confirm("Some rows are missing University Registration Number. These students will not be able to complete their registration. Do you want to proceed?")) {
        return;
      }
    }

    setImporting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setImportSummary(null);

    try {
      const token = await user.getIdToken();
      let result: any = null;
      let responseText = '';
      let isFallback = false;

      try {
        const response = await fetch('/api/admin/import-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ students: parsedData })
        });

        try {
          responseText = await response.text();
          result = JSON.parse(responseText);
        } catch (e) {
          // Not JSON
        }

        if (!response.ok) {
          const serverError = result?.details || result?.error || responseText || `Status: ${response.status} ${response.statusText}`;
          throw new Error(serverError);
        }
      } catch (err: any) {
        console.warn("Backend student import failed, checking fallback:", err);
        const errStr = err.message || '';
        if (
          errStr.includes("credentials") || 
          errStr.includes("default credentials") ||
          errStr.includes("500") ||
          errStr.includes("Failed to fetch") ||
          errStr.includes("Error occurred during Excel student import")
        ) {
          isFallback = true;
        } else {
          throw err;
        }
      }

      if (isFallback) {
        console.log("Attempting direct client-side Firestore import...");
        try {
          console.log("Current user:", user?.email, "Admin profile role:", adminProfile?.role);
          const summary = await importStudentsClientSide(parsedData);
          setImportSummary(summary);
          setSuccessMsg(`Imported ${summary.importedCount} students and skipped ${summary.skippedCount} duplicate/existing rows directly from the browser. WhatsApp reminders were not queued.`);
        } catch (clientErr: any) {
          console.error("Client-side fallback import failed:", clientErr);
          throw new Error(`Direct database import failed: "${clientErr.message}". This usually means your logged-in user (${user?.email}) does not have an active 'admin' or 'super_admin' role in your Firestore 'admins' collection, or security rules are blocking it.`);
        }
      } else {
        const summary: ImportSummary = {
          importedCount: Number(result?.importedCount || 0),
          skippedCount: Number(result?.skippedCount || 0),
          importedStudents: Array.isArray(result?.importedStudents) ? result.importedStudents : [],
          skippedStudents: Array.isArray(result?.skippedStudents) ? result.skippedStudents : [],
        };
        setImportSummary(summary);
        setSuccessMsg(`Imported ${summary.importedCount} students and skipped ${summary.skippedCount} duplicate/existing rows. Automated WhatsApp payment reminders have been queued for imported students.`);
      }

      setFile(null);
      setParsedData([]);
      setHeaders([]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin-dashboard')}
            variant="outline"
            className="rounded-xl h-10 px-3 flex items-center gap-2 transition-all hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-indigo-600 size-6 animate-pulse" />
              Excel Import Students
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Upload an Excel or CSV file to pre-register students and automatically send WhatsApp reminders.
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="student-card p-6 bg-white/80 border border-slate-100/50 shadow-xl rounded-3xl space-y-6">
        {/* Help Tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 flex gap-3">
          <HelpCircle className="size-5 shrink-0 mt-0.5 text-blue-600" />
          <div className="space-y-1">
            <span className="font-black">Supported Columns:</span>
            <p className="text-xs font-semibold leading-relaxed">
              For best results, name columns exactly like this in the sheet:
              <br />
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Student Name</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Father's Name</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Mobile Number</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Email</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Gender</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">College Name</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">University</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Course</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">Semester</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">University Registration Number</code>
              <code className="bg-white/80 px-1.5 py-0.5 rounded font-black text-indigo-600 mx-1">University Roll No</code>
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Label className="student-label block font-black text-slate-700">Choose Excel / CSV File</Label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="student-input h-12 py-2.5 rounded-2xl bg-white border border-slate-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Error / Success / Warning Messages */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-bold flex items-center gap-2.5">
            <AlertCircle className="size-5 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-bold flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {importSummary && (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="text-emerald-600 size-5" />
                Import Result
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Imported {importSummary.importedCount} new students. Skipped {importSummary.skippedCount} duplicate or already existing rows.
              </p>
            </div>

            {importSummary.importedStudents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700">Imported Students</h4>
                <div className="overflow-x-auto border border-emerald-100 rounded-2xl">
                  <table className="w-full text-left border-collapse table-auto text-xs min-w-[900px]">
                    <thead className="bg-emerald-50">
                      <tr className="border-b border-emerald-100">
                        <th className="p-3 font-black text-emerald-800 uppercase tracking-wider">Student</th>
                        <th className="p-3 font-black text-emerald-800 uppercase tracking-wider">Contact</th>
                        <th className="p-3 font-black text-emerald-800 uppercase tracking-wider">College</th>
                        <th className="p-3 font-black text-emerald-800 uppercase tracking-wider">Course</th>
                        <th className="p-3 font-black text-emerald-800 uppercase tracking-wider">Registration / Roll</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 bg-white">
                      {importSummary.importedStudents.map((student, idx) => (
                        <tr key={`${student.universityRoll}-${idx}`} className="hover:bg-emerald-50/40">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{student.fullName || '-'}</div>
                            <div className="text-[10px] font-semibold text-slate-400">S/o: {student.parentName || '-'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{student.email || '-'}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{student.contactNumber || '-'}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{student.college || '-'}</td>
                          <td className="p-3">
                            <div className="font-bold text-indigo-600">{student.course || '-'}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{student.semester || '-'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">Reg: {student.universityRoll || '-'}</div>
                            <div className="text-[10px] font-bold text-slate-500">Roll: {student.universityRollNo || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importSummary.skippedStudents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Skipped Rows</h4>
                <div className="overflow-x-auto border border-amber-100 rounded-2xl">
                  <table className="w-full text-left border-collapse table-auto text-xs min-w-[900px]">
                    <thead className="bg-amber-50">
                      <tr className="border-b border-amber-100">
                        <th className="p-3 font-black text-amber-800 uppercase tracking-wider">Student</th>
                        <th className="p-3 font-black text-amber-800 uppercase tracking-wider">Contact</th>
                          <th className="p-3 font-black text-amber-800 uppercase tracking-wider">Registration / Roll</th>
                        <th className="p-3 font-black text-amber-800 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50 bg-white">
                      {importSummary.skippedStudents.map((student, idx) => (
                        <tr key={`${student.universityRoll}-${idx}`} className="hover:bg-amber-50/40">
                          <td className="p-3 font-bold text-slate-900">{student.fullName || '-'}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{student.email || '-'}</div>
                            <div className="text-[10px] font-semibold text-slate-400">{student.contactNumber || '-'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">Reg: {student.universityRoll || '-'}</div>
                            <div className="text-[10px] font-bold text-slate-500">Roll: {student.universityRollNo || '-'}</div>
                          </td>
                          <td className="p-3 font-bold text-amber-700">{student.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold space-y-1">
            <div className="flex items-center gap-2 text-sm text-amber-900 mb-1">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span>Import Column Mapping Warnings:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Parse Preview */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Parsing Spreadsheet...</span>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="text-slate-500 size-5" />
                  File parsed successfully
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Detected {parsedData.length} students. Here is a preview of the first 5 records:
                </p>
              </div>
              <Button
                onClick={handleImportSubmit}
                disabled={importing}
                className="rounded-2xl h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-indigo-600/10 hover:shadow-lg flex items-center gap-1.5 transition-all"
              >
                {importing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Confirm & Start Import
                  </>
                )}
              </Button>
            </div>

            {/* Table Preview */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse table-auto text-xs min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-150">
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">Student Details</th>
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">Gender</th>
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">College & University</th>
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">Course / Sem</th>
                    <th className="p-3 font-black text-slate-500 uppercase tracking-wider">Verification IDs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedData.slice(0, 5).map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{student.fullName}</div>
                        <div className="text-[10px] font-semibold text-slate-400">S/o: {student.parentName || '-'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-700">{student.email}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{student.contactNumber}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{student.gender || '-'}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 truncate max-w-[200px]">{student.college}</div>
                        <div className="text-[10px] font-semibold text-slate-400 truncate max-w-[200px]">{student.university}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-indigo-600">{student.course}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{student.semester}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">Reg: {student.universityRoll || <span className="text-rose-500">Missing</span>}</div>
                        <div className="text-[10px] font-bold text-slate-500">Roll: {student.universityRollNo || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
