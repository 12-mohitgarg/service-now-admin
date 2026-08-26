import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  Download,
  Award,
  FileCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  Info,
  ClipboardList
} from 'lucide-react';
import { generateCertificate } from './generateCertificate';
import { generateAttendanceReport } from './generateAttendanceReport';
import { generateTestReport } from './generateTestReport';

export default function Certifications() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // Database states
  const [testSubmission, setTestSubmission] = useState<any>(null);
  const [courseTest, setCourseTest] = useState<any>(null);
  const [attendanceEntries, setAttendanceEntries] = useState<any[]>([]);
  const [dailyVideos, setDailyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid || !profile?.internshipDomain) {
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch test submission
        const submissionRef = doc(db, 'testSubmissions', `${user.uid}-${profile.internshipDomain}`);
        const submissionSnap = await getDoc(submissionRef);
        if (submissionSnap.exists()) {
          setTestSubmission(submissionSnap.data());
        }

        // 2. Fetch course test questions
        const testRef = doc(db, 'courseTests', profile.internshipDomain);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) {
          setCourseTest(testSnap.data());
        }

        // 3. Fetch daily videos
        const videosQuery = query(
          collection(db, 'dailyVideos'),
          where('course', '==', profile.internshipDomain)
        );
        const videosSnapshot = await getDocs(videosQuery);
        setDailyVideos(videosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 4. Fetch attendance entries
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', user.uid),
          where('course', '==', profile.internshipDomain)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        setAttendanceEntries(attendanceSnapshot.docs.map(doc => doc.data()));

        // 5. Fetch course report from courseReports collection
        const reportsQuery = query(
          collection(db, 'courseReports'),
          where('course', '==', profile.internshipDomain)
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        if (!reportsSnapshot.empty) {
          const reports = reportsSnapshot.docs.map(doc => doc.data());
          reports.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
          setReportUrl(reports[0].fileUrl || null);
        } else {
          setReportUrl(null);
        }

      } catch (error) {
        console.error('Error fetching certification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  const generatePDF = async (type: string) => {
    if (!user?.uid || !profile) {
      alert('User session not found');
      return;
    }

    try {
      if (type === 'certificate') {
        await generateCertificate(profile, user.uid);
      } else if (type === 'attendance') {
        await generateAttendanceReport(profile, attendanceEntries, dailyVideos);
      } else if (type === 'marksheet') {
        if (!testSubmission || !courseTest) {
          alert('Marksheet is locked. Complete the final assessment first.');
          return;
        }
        await generateTestReport(profile, testSubmission, courseTest.questions || []);
      } else if (type === 'offerletter') {
        const { loadOfferLetterAssets, createOfferLetterPdf, getOrCreateOfferLetterNumber, offerLetterFileName } = await import('../../lib/offerLetterPdf');
        const assets = await loadOfferLetterAssets();
        if (!assets.headerImg || !assets.footerImg) {
          alert('Failed to load letterhead assets. Please try again.');
          return;
        }
        const letterNumber = await getOrCreateOfferLetterNumber(user.uid);
        const pdf = createOfferLetterPdf(profile, letterNumber, assets);
        pdf.save(offerLetterFileName(profile.fullName));
      } else if (type === 'report') {
        if (reportUrl) {
          window.open(reportUrl, '_blank');
        } else {
          alert('Report PDF not uploaded by administrator yet.');
        }
      }
    } catch (error) {
      console.error(error);
      alert(`Error downloading ${type} PDF`);
    }
  };

  const progress = profile?.progress || 0;
  const lockedDocumentDate = '15 Sep 2026';
  const lockedDocumentDateRaw = '2026-09-15';

  // Certificates list
  const initialDocs = [
    {
      id: 'offerletter',
      name: 'Internship Offer Letter',
      desc: 'Official verification and joining document',
      icon: FileText,
      type: 'offerletter',
      ready: true,
      badge: 'Verified',
      date: '14 Jun 2026',
      dateRaw: '2026-06-14',
      color: 'cyan'
    },
    {
      id: 'certificate',
      name: 'Internship Certificate',
      desc: 'UGC-compliant internship completion certificate',
      icon: Award,
      type: 'certificate',
      ready: false,
      badge: 'Available 15 Sep',
      date: lockedDocumentDate,
      dateRaw: lockedDocumentDateRaw,
      color: 'blue'
    },
    {
      id: 'marksheet',
      name: 'Graded Marksheet',
      desc: 'Detailed performance breakdown of your internship',
      icon: FileCheck,
      type: 'marksheet',
      ready: false,
      badge: 'Available 15 Sep',
      date: lockedDocumentDate,
      dateRaw: lockedDocumentDateRaw,
      color: 'purple'
    },
    {
      id: 'report',
      name: 'Internship Report',
      desc: 'Comprehensive report of your learnings and tasks',
      icon: FileText,
      type: 'report',
      ready: false,
      badge: 'Available 15 Sep',
      date: lockedDocumentDate,
      dateRaw: lockedDocumentDateRaw,
      color: 'orange'
    },
    {
      id: 'attendance',
      name: 'Attendance Record',
      desc: 'Official record of your internship attendance',
      icon: Clock,
      type: 'attendance',
      ready: false,
      badge: 'Available 15 Sep',
      date: lockedDocumentDate,
      dateRaw: lockedDocumentDateRaw,
      color: 'green'
    },
    {
      id: 'logbook',
      name: 'Internship Logbook',
      desc: 'Detailed daily activities and learning records logbook',
      icon: ClipboardList,
      type: 'logbook',
      ready: false,
      badge: 'Available 15 Sep',
      date: lockedDocumentDate,
      dateRaw: lockedDocumentDateRaw,
      color: 'orange'
    }
  ];

  const sortedDocs = [...initialDocs].sort((a, b) => {
    if (a.id === 'offerletter') return -1;
    if (b.id === 'offerletter') return 1;
    if (sortBy === 'latest') {
      return b.dateRaw.localeCompare(a.dateRaw);
    } else {
      return a.dateRaw.localeCompare(b.dateRaw);
    }
  });

  // Stats
  const totalCount = initialDocs.length;
  const downloadedCount = initialDocs.filter(d => d.ready).length;
  const pendingCount = totalCount - downloadedCount;
  const verifiedCount = downloadedCount; // Ready certificates are verified

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(`I'm thrilled to share that I have completed my internship at InternMitra in ${profile?.internshipDomain || 'Web Development'}! #Internship #Achievement #Verification`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. TOP BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none">
        <div className="space-y-3 z-10 flex-1">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Verification Center
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            Your Achievements, Verified.
          </h2>
          <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
            All your official certificates and verification documents in one place.
          </p>
        </div>
        
        {/* Banner Graphic Illustration */}
        <div className="z-10 flex-shrink-0 flex justify-center md:justify-start">
          <img
            src="/certifications_illustration.png"
            alt="Certifications Illustration"
            className="w-40 md:w-44 h-auto object-contain"
          />
        </div>

        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATS CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 select-none">
        
        {/* Total Certificates */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Award size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Certificates</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{totalCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">All time</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-3xl"></div>
        </div>

        {/* Downloaded */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 flex-shrink-0">
            <Download size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Downloaded</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{downloadedCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Certificates</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-b-3xl"></div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Clock size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Pending</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{pendingCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Certificate</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-b-3xl"></div>
        </div>

        {/* Verified */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 flex-shrink-0">
            <ShieldCheck size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Verified</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{verifiedCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Certificates</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-b-3xl"></div>
        </div>

      </div>

      {/* 3. MIDDLE VERIFICATION STRIP */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div className="text-left">
            <h5 className="font-extrabold text-xs text-slate-800">All certificates are verified and industry recognized.</h5>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Download and share them with confidence.</p>
          </div>
        </div>

        <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 leading-none">
          <CheckCircle2 size={11} />
          100% Verified
        </span>
      </div>

      {/* 4. CERTIFICATES SECTION */}
      <div className="space-y-4">
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Your Certificates</h3>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase select-none">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1 text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Certificate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDocs.map((docItem) => {
            const Icon = docItem.icon;
            
            return (
              <div
                key={docItem.id}
                className={`bg-white rounded-3xl p-6 border-l-4 shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md ${
                  docItem.color === 'purple'
                    ? 'border-l-purple-500 border border-gray-200/50'
                    : docItem.color === 'orange'
                      ? 'border-l-orange-500 border border-gray-200/50'
                      : docItem.color === 'green'
                        ? 'border-l-green-500 border border-gray-200/50'
                        : docItem.color === 'cyan'
                          ? 'border-l-cyan-550 border border-gray-200/50'
                          : 'border-l-blue-500 border border-gray-200/50'
                } ${!docItem.ready ? 'opacity-70 bg-slate-50/20' : ''}`}
              >
                <div>
                  {/* Card Header (Icon & status Badge) */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      docItem.ready
                        ? docItem.color === 'purple'
                          ? 'bg-purple-50 border-purple-100 text-purple-600'
                          : docItem.color === 'orange'
                            ? 'bg-orange-50 border-orange-100 text-orange-600'
                            : docItem.color === 'green'
                              ? 'bg-green-50 border-green-100 text-green-600'
                              : docItem.color === 'cyan'
                                ? 'bg-cyan-50 border-cyan-100 text-cyan-600'
                                : 'bg-blue-50 border-blue-100 text-blue-600'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                      <Icon size={18} />
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider leading-none ${
                      docItem.badge === 'Verified'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {docItem.badge}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="mt-4">
                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">
                      {docItem.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1.5 leading-normal">
                      {docItem.desc}
                    </p>
                    {!docItem.ready && docItem.id === 'report' && progress >= 90 && (
                      <p className="text-[10px] text-amber-600 font-bold mt-2.5 flex items-center gap-1">
                        ⚠ Not uploaded by administrator yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {docItem.ready ? 'Issued on' : 'Available from'}
                    </span>
                    <span className="text-xs text-slate-700 font-bold mt-0.5">
                      {docItem.date}
                    </span>
                  </div>

                  {docItem.ready ? (
                    <button
                      onClick={() => generatePDF(docItem.type)}
                      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white px-4 shadow-sm transition active:scale-95 cursor-pointer ${
                        docItem.color === 'purple'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : docItem.color === 'orange'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : docItem.color === 'green'
                              ? 'bg-green-600 hover:bg-green-700'
                              : docItem.color === 'cyan'
                                ? 'bg-cyan-600 hover:bg-cyan-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Download size={12} />
                      Download PDF
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex h-9 items-center justify-center gap-1.5 bg-slate-100 border border-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 cursor-not-allowed select-none"
                    >
                      <Lock size={11} />
                      Available 15 Sep
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* View My Progress Banner (Spans 2 columns on grid or acts as standard card) */}
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[220px] md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-4">
              {/* SVG Open Folder Certificate Graphic */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0 select-none">
                <span className="text-3xl">📁</span>
              </div>
              
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
                  Keep Growing, Keep Achieving!
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold max-w-sm">
                  Complete your internship successfully to unlock more achievements and opportunities.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard/course')}
              className="inline-flex h-11 items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-2xl transition shadow-md shadow-blue-500/10 active:scale-95 text-xs flex-shrink-0 cursor-pointer"
            >
              View My Progress
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

      </div>

      {/* 5. BOTTOM SHARE LINKEDIN TIP BAR */}
      <div className="bg-purple-50/40 border border-purple-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
            <Info size={16} />
          </div>
          <p className="text-xs text-slate-600 font-semibold text-left">
            Did you know? Sharing your verified certificates on LinkedIn can increase your profile views by 40%!
          </p>
        </div>

        <button
          onClick={handleShareLinkedIn}
          className="bg-white hover:bg-slate-50 border border-purple-200 text-purple-600 font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          {/* Inline LinkedIn Icon */}
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          Share on LinkedIn
        </button>
      </div>

    </div>
  );
}
