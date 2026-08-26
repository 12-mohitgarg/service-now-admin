import React, { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthContext';
import {
  Download,
  FileText,
  Upload,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  Plus,
  X,
  ExternalLink,
  BarChart2
} from 'lucide-react';
import { generateTestReport } from './generateTestReport';

interface Assignment {
  id: string;
  title: string;
  course: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface StudentReport {
  id: string;
  userId: string;
  studentName: string;
  email: string;
  course?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
}

export default function Reports() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Form states
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Assessment results
  const [courseTest, setCourseTest] = useState<any>(null);
  const [testSubmission, setTestSubmission] = useState<any>(null);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const normalizeCourseName = (value?: string) => value?.trim().toLowerCase() || '';

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      : 'Recent';

  const fetchStudentReports = async (courseAssignments: Assignment[]) => {
    if (!user?.uid) {
      setStudentReports([]);
      return;
    }

    const studentCourse = normalizeCourseName(profile?.internshipDomain);
    const courseAssignmentIds = new Set(courseAssignments.map((assignment) => assignment.id));
    const submissionsQuery = query(
      collection(db, 'studentReports'),
      where('userId', '==', user.uid)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);
    const submissions = submissionsSnapshot.docs
      .map((submissionDoc) => ({ id: submissionDoc.id, ...submissionDoc.data() } as StudentReport))
      .filter((submission) =>
        normalizeCourseName(submission.course) === studentCourse ||
        Boolean(submission.assignmentId && courseAssignmentIds.has(submission.assignmentId))
      )
      .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

    setStudentReports(submissions);
  };

  useEffect(() => {
    const fetchReports = async () => {
      const studentCourse = normalizeCourseName(profile?.internshipDomain);

      if (!studentCourse) {
        setAssignments([]);
        setStudentReports([]);
        setSelectedAssignmentId('');
        setLoading(false);
        return;
      }

      try {
        const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
        const courseAssignments = assignmentsSnapshot.docs
          .map((assignmentDoc) => ({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment))
          .filter((assignment) =>
            assignment.isActive !== false &&
            normalizeCourseName(assignment.course) === studentCourse
          )
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        setAssignments(courseAssignments);
        setSelectedAssignmentId((currentAssignmentId) => {
          if (currentAssignmentId && courseAssignments.some((assignment) => assignment.id === currentAssignmentId)) {
            return currentAssignmentId;
          }
          return courseAssignments[0]?.id || '';
        });
        await fetchStudentReports(courseAssignments).catch((err) => {
          console.error('Error fetching student uploaded reports:', err);
          setStudentReports([]);
        });

        // Fetch test and submission if course exists
        if (profile?.internshipDomain) {
          const testRef = doc(db, 'courseTests', profile.internshipDomain);
          const testSnap = await getDoc(testRef);
          if (testSnap.exists()) {
            setCourseTest(testSnap.data());
          }

          if (user?.uid) {
            const subRef = doc(db, 'testSubmissions', `${user.uid}-${profile.internshipDomain}`);
            const subSnap = await getDoc(subRef);
            if (subSnap.exists()) {
              setTestSubmission(subSnap.data());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
        setStudentReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [profile?.internshipDomain, user?.uid]);

  const handleUploadStudentReport = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user?.uid) {
      alert('Please login before uploading.');
      return;
    }

    const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId);

    if (!selectedAssignment) {
      alert('Please select an assignment before uploading.');
      return;
    }

    if (!selectedFile) {
      alert('Please select a PDF file.');
      return;
    }

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.');
      return;
    }

    const cloudName = 'de6uqmt1m';
    const uploadPreset = 'hm8borsg';

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary configuration error.');
      return;
    }
      
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `internmitra/student-reports/${selectedAssignment.course.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Cloudinary upload failed');
      }

      const uploadResult = await response.json();

      const uploadedReport = {
        userId: user.uid,
        studentName: profile?.fullName || user.displayName || 'Student',
        email: profile?.email || user.email || '',
        course: selectedAssignment.course,
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        description: description.trim(),
        fileName: selectedFile.name,
        fileUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        uploadedAt: new Date().toISOString()
      };

      let reportDoc;
      try {
        reportDoc = await addDoc(collection(db, 'studentReports'), uploadedReport);
      } catch (firestoreError: any) {
        if (firestoreError?.code !== 'permission-denied') {
          throw firestoreError;
        }
        reportDoc = await addDoc(collection(db, 'submissions'), {
          ...uploadedReport,
          type: 'studentReport'
        });
      }

      setSelectedFile(null);
      setDescription('');
      setFileInputKey((key) => key + 1);
      setStudentReports((currentReports) => [
        { id: reportDoc.id, ...uploadedReport },
        ...currentReports
      ]);
      setShowUploadModal(false);
      alert('PDF uploaded successfully.');
    } catch (error: any) {
      console.error('Error uploading student report:', error);
      alert(error?.message || 'Error uploading PDF.');
    } finally {
      setUploading(false);
    }
  };

  const getAssignmentTitle = (submission: StudentReport) =>
    submission.assignmentTitle ||
    assignments.find((assignment) => assignment.id === submission.assignmentId)?.title ||
    'Legacy upload';

  // Filtering submitted reports
  const filteredReports = studentReports.filter(report => {
    const title = getAssignmentTitle(report);
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           report.fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pagination calculations
  const totalFiltered = filteredReports.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

  // Metrics
  const submittedCount = studentReports.length;
  const avgScore = testSubmission ? `${testSubmission.scorePercentage}%` : 'N/A';

  const latestReport = studentReports[0];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. TOP BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none">
        <div className="space-y-3 z-10 flex-1">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Performance Hub
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            Track. Analyze. Improve.
          </h2>
          <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
            View your assignment reports, scores, and upload submissions.
          </p>
        </div>
        
        {/* Banner Graphic Illustration */}
        <div className="z-10 flex-shrink-0 flex justify-center md:justify-start">
          <img
            src="/reports_illustration.png"
            alt="Reports Illustration"
            className="w-40 md:w-44 h-auto object-contain"
          />
        </div>

        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. SIMPLIFIED STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 select-none">
        
        {/* Reports Submitted */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 flex-shrink-0">
              <ClipboardList size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Reports Submitted</span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{submittedCount}</h4>
              <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">All Time</span>
            </div>
          </div>
          {/* Subtle SVG Graph decoration at the bottom */}
          <div className="absolute bottom-0 left-0 w-full px-2">
            <svg viewBox="0 0 100 20" className="w-full h-8 text-blue-500/10 fill-current">
              <path d="M0,20 Q15,5 30,12 T60,5 T90,15 T100,5 L100,20 L0,20 Z" />
              <path d="M0,20 Q15,5 30,12 T60,5 T90,15 T100,5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500/30" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-3xl"></div>
        </div>

        {/* Average Assessment Score */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 flex-shrink-0">
              <Star size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Average Score</span>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{avgScore}</h4>
              <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Overall Performance</span>
            </div>
          </div>
          {/* Subtle SVG Graph decoration at the bottom */}
          <div className="absolute bottom-0 left-0 w-full px-2">
            <svg viewBox="0 0 100 20" className="w-full h-8 text-purple-500/10 fill-current">
              <path d="M0,20 Q20,15 40,8 T80,12 T100,4 L100,20 L0,20 Z" />
              <path d="M0,20 Q20,15 40,8 T80,12 T100,4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-500/30" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-b-3xl"></div>
        </div>

      </div>

      {/* 3. LATEST SUBMISSION & QUICK UPLOAD ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Submission Display */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
              Latest Submission
            </span>
            {latestReport ? (
              <div className="mt-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
                    {getAssignmentTitle(latestReport)}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Submitted on {formatDate(latestReport.uploadedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400 mt-4 leading-normal">
                No reports submitted yet. Submit your first PDF report.
              </p>
            )}
          </div>

          {latestReport && (
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
              <a
                href={latestReport.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex h-9 items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold px-4 rounded-xl transition cursor-pointer"
              >
                View PDF
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Submit New Report Callout */}
        <div className="bg-slate-50/60 border border-slate-200/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[140px]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border border-slate-200 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Upload size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
                Submit New Report
              </h4>
              <p className="text-xs text-slate-450 mt-1 font-semibold max-w-xs leading-normal">
                Upload your assignment report in PDF format for archiving.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex h-11 items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-2xl transition shadow-md shadow-blue-500/10 active:scale-95 text-xs flex-shrink-0 cursor-pointer"
          >
            <Plus size={15} />
            Upload Report
          </button>
        </div>

      </div>

      {/* 4. ALL SUBMITTED REPORTS TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
        
        {/* Section Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">All Submitted Reports</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Archived performance documentation</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold w-52 bg-white text-slate-800 outline-none focus:border-blue-500 shadow-sm transition"
            />
          </div>
        </div>

        {/* Database Loading State */}
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-semibold text-sm">
            Loading performance reports...
          </div>
        ) : paginatedReports.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-150 rounded-2xl select-none">
            <ClipboardList size={40} className="mx-auto mb-3 text-slate-300" />
            <h4 className="font-extrabold text-sm text-slate-700">No reports found</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Your uploaded assignment PDF answers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="pb-3 px-4">#</th>
                  <th className="pb-3 px-4">Report Title</th>
                  <th className="pb-3 px-4">Assignment / Domain</th>
                  <th className="pb-3 px-4">Submitted On</th>
                  <th className="pb-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReports.map((report, idx) => {
                  const idxStr = String(startIndex + idx + 1).padStart(2, '0');
                  
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                      {/* Index */}
                      <td className="py-4 px-4 font-bold text-slate-400 w-10">{idxStr}</td>
                      
                      {/* Title */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={15} />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 leading-tight">
                              {getAssignmentTitle(report)}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[220px] truncate">
                              {report.fileName}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Domain */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wide leading-none">
                          {report.course || profile?.internshipDomain}
                        </span>
                      </td>

                      {/* Submitted On */}
                      <td className="py-4 px-4 font-semibold text-xs text-slate-400">
                        {formatDate(report.uploadedAt)}
                      </td>

                      {/* Download button */}
                      <td className="py-4 px-4 text-right">
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex h-8 items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-700 px-3 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                          <Download size={11} />
                          Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition active:scale-95 cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronsRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* 5. UPLOAD MODAL DIALOG OVERLAY */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Submit Assignment Report</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Upload your assignment answer report in PDF format.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDescription('');
                  }
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadStudentReport} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 select-none">
                  Assignment Title
                </label>
                <select
                  value={selectedAssignmentId}
                  onChange={(event) => setSelectedAssignmentId(event.target.value)}
                  disabled={assignments.length === 0 || uploading}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                >
                  <option value="">Select assignment</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 select-none">
                  PDF Answer File
                </label>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="w-full text-slate-750 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 select-none">
                  Description Note (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Write a short message for the coordinator..."
                  className="w-full min-h-24 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-4 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner leading-relaxed"
                />
              </div>

              {/* Form Actions footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDescription('');
                  }}
                  className="h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || assignments.length === 0}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/10 transition cursor-pointer active:scale-95"
                >
                  <Upload size={13} />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}

    </div>
  );
}
