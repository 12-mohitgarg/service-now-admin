import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
  FileText,
  Award,
  BarChart2,
  FileCheck,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Calendar,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  HelpCircle,
  MapPin,
  Bell,
  BookOpen
} from 'lucide-react';
import { generateCertificate } from './generateCertificate';
import { generateAttendanceReport, AttendanceEntry, AttendanceVideo } from './generateAttendanceReport';
import { generateTestReport } from './generateTestReport';

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  createdAt?: string;
  isActive?: boolean;
}

export default function MainDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [learningProgress, setLearningProgress] = useState(0);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [dailyVideos, setDailyVideos] = useState<AttendanceVideo[]>([]);
  const [testSubmission, setTestSubmission] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (!user || !profile?.internshipDomain) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const course = profile.internshipDomain;

        // 1. Fetch daily videos in course
        const videosQuery = query(
          collection(db, 'dailyVideos'),
          where('course', '==', course)
        );
        const videosSnapshot = await getDocs(videosQuery);
        const videos = videosSnapshot.docs
          .map(videoDoc => {
            const data = videoDoc.data();
            return {
              id: videoDoc.id,
              day: Number(data.day),
              title: data.title || data.videoTitle || data.name || `Day ${data.day}`,
            } as AttendanceVideo;
          })
          .filter((video) => Number.isFinite(Number(video.day)) && Number(video.day) > 0)
          .sort((a, b) => Number(a.day) - Number(b.day));
        setDailyVideos(videos);
        const uploadedDays = new Set(
          videos
            .map((video) => String(video.day || '').trim())
            .filter(Boolean)
        );

        // 2. Fetch student attendance
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', user.uid),
          where('course', '==', course)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const entries = attendanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AttendanceEntry));
        setAttendanceEntries(entries);

        // Calculate progress percentage
        if (uploadedDays.size > 0) {
          const completedDays = new Set<string>();
          
          // Get unique completed days from video watch progress
          const progressRef = doc(db, 'userVideoProgress', `${user.uid}-${course}`);
          const progressSnapshot = await getDoc(progressRef);

          if (progressSnapshot.exists()) {
            const completedVideos = progressSnapshot.data().completedVideos || {};
            Object.entries(completedVideos).forEach(([day, completed]) => {
              const normalizedDay = String(day).trim();
              if (completed && uploadedDays.has(normalizedDay)) {
                completedDays.add(normalizedDay);
              }
            });
          }

          // Add completed days from attendance
          entries.forEach(entry => {
            const normalizedDay = String(entry.day || '').trim();
            if (uploadedDays.has(normalizedDay)) {
              completedDays.add(normalizedDay);
            }
          });

          const calculatedProgress = Math.round((completedDays.size / uploadedDays.size) * 100);
          setLearningProgress(calculatedProgress);
          setTotalHours(completedDays.size * 4); // Assume 4 hours per class/day watched
        } else {
          setLearningProgress(0);
          setTotalHours(0);
        }

        // 3. Fetch test submissions
        const subRef = doc(db, 'testSubmissions', `${user.uid}-${course}`);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          setTestSubmission(subSnap.data());
        }

        const notificationsQuery = query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc'),
          limit(2)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationData = notificationsSnapshot.docs
          .map((notificationDoc) => ({
            id: notificationDoc.id,
            ...notificationDoc.data()
          } as DashboardNotification))
          .filter((notification) => notification.isActive !== false);
        setAnnouncements(notificationData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile]);

  const handleDownloadCertificate = async () => {
    if (!user?.uid || !profile) return;
    try {
      await generateCertificate(profile, user.uid);
    } catch (error) {
      console.error(error);
      alert('Error downloading certificate');
    }
  };

  const handleDownloadAttendance = async () => {
    if (!profile) return;
    if (dailyVideos.length === 0) {
      alert('Attendance report will be available after lectures are uploaded.');
      return;
    }
    try {
      await generateAttendanceReport(profile, attendanceEntries, dailyVideos);
    } catch (error) {
      console.error(error);
      alert('Error downloading attendance report');
    }
  };

  const handleDownloadMarksheet = async () => {
    if (!testSubmission || !profile?.internshipDomain) {
      alert('Please complete the assessment test under the Learning tab to unlock the Marksheet.');
      return;
    }
    try {
      const testRef = doc(db, 'courseTests', profile.internshipDomain);
      const testSnap = await getDoc(testRef);
      const questions = testSnap.exists() ? (testSnap.data().questions || []) : [];
      await generateTestReport(profile, testSubmission, questions);
    } catch (error) {
      console.error(error);
      alert('Error generating marksheet');
    }
  };

  // Check if course requirements met
  const isPaymentCompleted = Boolean(profile?.isPaid || profile?.hasPaid);
  const isAssessmentCompleted = !!testSubmission;
  const isCertificateReady = learningProgress >= 100 && isAssessmentCompleted;

  // Stepper steps configuration
  const steps = [
    { label: 'Registration', completed: true, desc: 'Completed' },
    { label: 'Payment', completed: isPaymentCompleted, desc: isPaymentCompleted ? 'Completed' : 'Pending' },
    { label: 'Assessment', completed: isAssessmentCompleted, desc: isAssessmentCompleted ? 'Completed' : 'In Progress' },
    { label: 'Certification', completed: isCertificateReady, desc: isCertificateReady ? 'Completed' : 'Upcoming' }
  ];

  // Dynamic values
  const uploadedVideoDays = Array.from(new Set<number>(
    dailyVideos
      .map((video) => Number(video.day))
      .filter((day) => Number.isFinite(day) && day > 0)
  )).sort((a, b) => a - b);
  const uploadedDaySet = new Set(uploadedVideoDays.map(String));
  const attendedVideoDays = new Set(
    attendanceEntries
      .map((entry) => String(entry.day || '').trim())
      .filter((day) => uploadedDaySet.has(day))
  );
  const hasUploadedVideos = uploadedVideoDays.length > 0;
  const attendancePercentage = hasUploadedVideos ? Math.round((attendedVideoDays.size / uploadedVideoDays.length) * 100) : 0;
  const totalDays = uploadedVideoDays.length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalDays / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDays = uploadedVideoDays.slice(startIndex, startIndex + pageSize);

  const WhatsAppIcon = () => (
    <svg className="w-8 h-8 text-white fill-current flex-shrink-0" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.003 0a11.948 11.948 0 0 1 8.502 3.506 11.95 11.95 0 0 1 3.5 8.5c-.003 6.634-5.377 12.005-12.003 12.005-2.002-.001-3.97-.502-5.713-1.458L0 24zM6.59 5.86c-.148-.328-.305-.335-.447-.341-.116-.005-.249-.005-.382-.005-.133 0-.349.05-.532.249-.183.199-.698.68-.698 1.66 0 .98.714 1.925.814 2.059.1.133 1.405 2.145 3.404 3.01.476.206.847.329 1.137.422.478.152.913.13 1.258.079.384-.057 1.18-.482 1.346-.947.166-.465.166-.864.116-.947-.05-.083-.183-.133-.382-.233-.199-.1-.18-.947-.282-1.047-.102-.1-.2-.149-.3-.05-.1.1-.432.548-.53.648-.098.1-.197.116-.396.016a5.617 5.617 0 0 1-1.469-.907 6.19 6.19 0 0 1-1.017-1.266c-.116-.199-.012-.307.088-.407.09-.09.199-.233.299-.349.098-.116.133-.199.199-.332.066-.133.033-.249-.016-.349-.05-.1-.447-1.077-.612-1.472z"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      
      {/* 1. TOP SECTION GRID (Greeting Banner & Metrics Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        
        {/* Welcome Greeting Banner */}
        <div className="lg:col-span-2 md:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex items-center justify-between relative overflow-hidden h-44 select-none">
          <div className="space-y-2 z-10">
            <p className="text-xs font-bold text-slate-400">Welcome back,</p>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {profile?.fullName || 'Learner'}!
            </h2>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
              Keep going! You're doing great in your internship journey.
            </p>
          </div>
          
          <img
            src="/welcome_illustration.png"
            alt="Greeting illustration"
            className="w-32 h-auto object-contain flex-shrink-0 z-10"
          />
        </div>

        {/* Total Progress Metric Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between h-44 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Progress</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart2 size={14} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{learningProgress}%</h3>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 mb-2">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${learningProgress}%` }}></div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Keep it up!</span>
        </div>

        {/* Certificates Metric Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between h-44 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Certificates</span>
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-blue-600 flex items-center justify-center border border-blue-100">
              <Award size={14} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{isCertificateReady ? 2 : 1}</h3>
            <span className="text-[10px] font-bold text-slate-400 mt-2 block">of 5 Completed</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Issued digitally</span>
        </div>

        {/* Assignments Metric Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between h-44 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Assignments</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <FileCheck size={14} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">
              {profile?.pendingAssignmentsCount ?? 6}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-2 block">Pending</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Next evaluation soon</span>
        </div>

        {/* Attendance Metric Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between h-44 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Attendance</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Calendar size={14} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">{attendancePercentage}%</h3>
            <span className="text-[10px] font-bold text-slate-400 mt-2 block">
              {hasUploadedVideos ? `${attendedVideoDays.size}/${totalDays} Lectures` : 'Not Started'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {hasUploadedVideos ? 'Checked dynamically' : 'After videos upload'}
          </span>
        </div>

      </div>

      {/* 2. MIDDLE SECTION GRID (Milestones, Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Milestone Progress Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between min-h-[220px]">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-6">
            <MapPin size={16} className="text-blue-600" /> Internship Milestone Progress
          </h3>
          
          <div className="flex items-center justify-between relative px-2 mb-2">
            {steps.map((step, idx) => {
              const isStepCompleted = step.completed;
              const isStepActive = !isStepCompleted && (idx === 0 || steps[idx - 1].completed);
              
              return (
                <div key={step.label} className="flex-1 flex flex-col items-center relative text-center">
                  
                  {/* Stepper Connecting Line */}
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-4 left-1/2 w-full h-[3px] -z-10 transition-all ${
                      steps[idx + 1].completed ? 'bg-green-500' : 'bg-slate-100'
                    }`} />
                  )}
                  
                  {/* Step Bubble */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isStepCompleted
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                      : isStepActive
                        ? 'bg-[#eff6ff] text-blue-600 border-2 border-blue-600 shadow-sm shadow-blue-500/10'
                        : 'bg-slate-150 text-slate-400 border border-slate-200'
                  }`}>
                    {isStepCompleted ? '✓' : idx + 1}
                  </div>
                  
                  {/* Stepper Info Label */}
                  <p className={`font-extrabold text-xs mt-3 ${
                    isStepCompleted ? 'text-slate-800' : isStepActive ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcements Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-amber-500" /> Announcements
              </h3>
              {announcements.length > 0 && (
                <span className="bg-[#eff6ff] text-blue-600 border border-blue-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Latest
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((announcement, index) => (
                  <React.Fragment key={announcement.id}>
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-green-500'} mt-1.5 flex-shrink-0`} />
                      <div>
                        <h4 className="font-bold text-[11px] text-slate-800 leading-tight">{announcement.title || 'Admin Announcement'}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">
                          {announcement.message || 'Open messages to view the full announcement.'}
                        </p>
                      </div>
                    </div>
                    {index < announcements.length - 1 && <div className="h-px bg-slate-100" />}
                  </React.Fragment>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <h4 className="font-bold text-[11px] text-slate-800 leading-tight">No announcements right now</h4>
                  <p className="text-[9px] text-slate-400 mt-1">New admin updates will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard/messages')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-600 rounded-xl transition border border-slate-100 hover:border-slate-200 cursor-pointer text-center uppercase tracking-wider"
          >
            View All
          </button>
        </div>

      </div>

      {/* 3. WHATSAPP STUDENT CHANNEL BANNER */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 select-none relative overflow-hidden">
        
        {/* Left Info Column */}
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner border border-white/10">
            <WhatsAppIcon />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-black text-base">
              Join WhatsApp Student Channel
            </h4>
            <p className="text-green-50 text-xs font-semibold">
              Get instant updates on classes, assignments, and important announcements.
            </p>
          </div>
        </div>

        {/* Right Button Call To Action */}
        <a
          href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-green-700 font-bold px-6 py-3 rounded-2xl hover:bg-green-50 transition shadow-sm active:scale-95 flex-shrink-0 text-xs flex items-center gap-2 z-10"
        >
          <span>Join Now</span>
          <ArrowRight size={14} />
        </a>

        {/* Decorative glowing background blobs */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4. RECORDED ATTENDANCE TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
        
        {/* Table Stats & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Recorded Attendance</h3>
              <p className="text-xs text-slate-400 font-medium">Verified attendance dossier logs</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Stats Block */}
            <div className="flex gap-4 text-xs font-bold text-slate-600 bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100">
              <div>
                Total: <span className="text-slate-900">{totalDays} Days</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                Attended: <span className="text-green-600">{attendedVideoDays.size} Days</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div>
                Percentage: <span className="text-blue-600">{attendancePercentage}%</span>
              </div>
            </div>

            {hasUploadedVideos && (
              <button
                onClick={handleDownloadAttendance}
                className="inline-flex h-9 items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 rounded-xl text-xs font-bold border border-emerald-100 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Download size={13} />
                Download Report
              </button>
            )}

            {hasUploadedVideos && (
              <div className="relative">
                <button className="inline-flex h-9 items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold px-4 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Uploaded Lectures</span>
                </button>
              </div>
            )}
            {!hasUploadedVideos && (
              <div className="inline-flex h-9 items-center justify-center gap-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold px-4 text-slate-500">
                <Calendar size={13} className="text-slate-400" />
                <span>No lectures uploaded</span>
              </div>
            )}
          </div>
        </div>

        {/* Database Loading State */}
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-semibold text-sm">
            Loading attendance records...
          </div>
        ) : !hasUploadedVideos ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <Calendar size={20} />
            </div>
            <h4 className="text-sm font-black text-slate-900">Attendance will start after lectures are uploaded</h4>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Once daily videos are added for your internship domain, attendance rows and report download will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="pb-3 px-4">Day</th>
                  <th className="pb-3 px-4">Date</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Class Topic</th>
                  <th className="pb-3 px-4 text-right">Credit Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDays.map((dayNum) => {
                  const entry = attendanceEntries.find(e => Number(e.day) === Number(dayNum));
                  const video = dailyVideos.find((item) => Number(item.day) === Number(dayNum));

                  let dateStr = '-';
                  let status = 'Absent';
                  let topic = video?.title || 'Uploaded lecture';
                  const hours = 2;

                  if (entry) {
                    dateStr = entry.watchedAt 
                      ? new Date(entry.watchedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-';
                    status = 'Present';
                    topic = entry.videoTitle || video?.title || 'Class Session';
                  }

                  return (
                    <tr key={dayNum} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                      <td className="py-3.5 px-4 font-bold text-slate-900">Day {dayNum}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-400">{dateStr}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          status === 'Present' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`} />
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 truncate max-w-xs font-semibold text-slate-600">{topic}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{hours} Hrs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* local Frontend Table Pagination Controls */}
        {hasUploadedVideos && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 select-none">
          
          {/* Navigation Control Buttons */}
          <div className="flex items-center gap-1">
            
            {/* Go First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
            >
              <ChevronsLeft size={14} />
            </button>

            {/* Go Prev Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page number buttons */}
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

            {/* Go Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>

            {/* Go Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
            >
              <ChevronsRight size={14} />
            </button>
          </div>

          {/* Page items size selector dropdown */}
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

    </div>
  );
}
