import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  PlayCircle,
  FileText,
  FileVideo,
  Download,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  ClipboardList,
  ExternalLink,
  Info,
  Clock,
  BookOpen,
  Filter,
  Search,
  Star,
  Lock,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { generateCertificate } from './generateCertificate';
import { AttendanceEntry } from './generateAttendanceReport';
import { generateTestReport } from './generateTestReport';
import { COURSE_VIDEO_DAY_LIMIT } from '../../lib/constants';

interface VideoProgress {
  [day: number]: boolean;
}

export default function LMS() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [dailyVideos, setDailyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState<VideoProgress>({});
  const [currentDay, setCurrentDay] = useState(1);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Assessment (Test) States
  const [courseTest, setCourseTest] = useState<any>(null);
  const [testSubmission, setTestSubmission] = useState<any>(null);
  const [takingTest, setTakingTest] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Payment QR Code modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Search & Filter UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'pending'>('all');
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(1);
  const [currentLmsPage, setCurrentLmsPage] = useState(1);
  const [lmsPageSize, setLmsPageSize] = useState(5);


  useEffect(() => {
    fetchDailyVideos();
    fetchVideoProgress();
    fetchAttendance();
    calculateCurrentDay();
    fetchTestAndSubmission();
  }, [profile, user]);

  useEffect(() => {
    if (dailyVideos.length > 0) {
      const completedCount = getCompletedVideoDays(videoProgress, attendanceEntries).size;
      setIsCourseCompleted(completedCount === dailyVideos.length);
    }
  }, [dailyVideos, videoProgress, attendanceEntries]);

  const fetchTestAndSubmission = async () => {
    if (!profile?.internshipDomain || !user?.uid) return;
    try {
      const testRef = doc(db, 'courseTests', profile.internshipDomain);
      const testSnap = await getDoc(testRef);
      if (testSnap.exists()) setCourseTest(testSnap.data());

      const submissionRef = doc(db, 'testSubmissions', `${user.uid}-${profile.internshipDomain}`);
      const submissionSnap = await getDoc(submissionRef);
      if (submissionSnap.exists()) setTestSubmission(submissionSnap.data());
    } catch (error) {
      console.error('Error fetching test/submission:', error);
    }
  };

  const calculateCurrentDay = () => {
    if (!profile?.registrationDate) {
      setCurrentDay(1);
      return;
    }
    let dateStr = profile.registrationDate.replace(/-(\d)T/g, '-0$1T');
    const registrationDate = new Date(dateStr);
    if (isNaN(registrationDate.getTime())) {
      setCurrentDay(1);
      return;
    }
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setCurrentDay(Math.min(diffDays, COURSE_VIDEO_DAY_LIMIT));
  };

  const fetchDailyVideos = async () => {
    try {
      const videosRef = collection(db, 'dailyVideos');
      const userCourse = profile?.internshipDomain || '';
      const q = query(videosRef, where('course', '==', userCourse), orderBy('day'));
      const snapshot = await getDocs(q);
      const videosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDailyVideos(videosData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily videos:', error);
      setLoading(false);
    }
  };

  const fetchVideoProgress = async () => {
    if (!user || !profile?.internshipDomain) return;
    try {
      const progressRef = doc(db, 'userVideoProgress', `${user.uid}-${profile.internshipDomain}`);
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        setVideoProgress(progressDoc.data().completedVideos || {});
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    }
  };

  const fetchAttendance = async () => {
    if (!user || !profile?.internshipDomain) return;
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid),
        where('course', '==', profile.internshipDomain),
        orderBy('day')
      );
      const snapshot = await getDocs(attendanceQuery);
      setAttendanceEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceEntry)));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const hasAttendanceForDay = (day: number) => {
    return Boolean(videoProgress[day] || attendanceEntries.some((entry) => Number(entry.day) === Number(day)));
  };

  const getUploadedVideoDays = () => new Set(dailyVideos.map((video) => String(video.day || '').trim()).filter(Boolean));

  const getCompletedVideoDays = (progress: VideoProgress = videoProgress, attendance: AttendanceEntry[] = attendanceEntries) => {
    const uploadedDays = getUploadedVideoDays();
    const completedDays = new Set<string>();
    Object.entries(progress).forEach(([day, completed]) => {
      if (completed && uploadedDays.has(String(day).trim())) completedDays.add(String(day).trim());
    });
    attendance.forEach((entry) => {
      if (uploadedDays.has(String(entry.day).trim())) completedDays.add(String(entry.day).trim());
    });
    return completedDays;
  };

  const getProgressPercentage = (progress: VideoProgress = videoProgress, attendance: AttendanceEntry[] = attendanceEntries) => {
    const uploadedCount = getUploadedVideoDays().size;
    return uploadedCount === 0 ? 0 : Math.round((getCompletedVideoDays(progress, attendance).size / uploadedCount) * 100);
  };

  const isAssessmentCompleted = !!testSubmission;
  const isCertificateReady = getProgressPercentage() >= 100 && isAssessmentCompleted;

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

  const markVideoAsDone = async (video: any) => {
    if (!user || !profile?.internshipDomain) return;
    try {
      setAttendanceSaving(true);
      const day = video.day;
      const progressRef = doc(db, 'userVideoProgress', `${user.uid}-${profile.internshipDomain}`);
      const newProgress = { ...videoProgress, [day]: true };
      const attendanceRef = doc(db, 'attendance', `${user.uid}-${profile.internshipDomain}-day-${day}`);

      await setDoc(attendanceRef, {
        userId: user.uid,
        studentName: profile.fullName || '',
        email: profile.email || user.email || '',
        course: profile.internshipDomain,
        day,
        videoId: video.id,
        videoTitle: video.title,
        watchedAt: new Date().toISOString()
      });

      await setDoc(progressRef, {
        userId: user.uid,
        course: profile.internshipDomain,
        completedVideos: newProgress,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setVideoProgress(newProgress);
      const completedDays = getCompletedVideoDays(newProgress);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalHoursCompleted: completedDays.size,
        progress: getProgressPercentage(newProgress),
        lastVideoCompletedAt: new Date().toISOString()
      });

      setIsCourseCompleted(completedDays.size === dailyVideos.length && dailyVideos.length > 0);
      await fetchAttendance();
    } catch (error) {
      console.error('Error marking video as done:', error);
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleStartTest = () => {
    if (!courseTest || !courseTest.questions || courseTest.questions.length === 0) {
      alert('No test available for this course yet.');
      return;
    }
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTakingTest(true);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitTest = async () => {
    if (!user || !profile || !courseTest) return;
    if (Object.keys(selectedAnswers).length < courseTest.questions.length) {
      if (!confirm("You have unanswered questions. Are you sure you want to submit?")) return;
    }
    setSubmittingTest(true);
    try {
      let correctCount = 0;
      courseTest.questions.forEach((q: any) => {
        if (selectedAnswers[q.id] === q.correctOptionIndex) correctCount++;
      });
      const submissionData = {
        userId: user.uid,
        studentName: profile.fullName || 'Student',
        email: profile.email || user.email || '',
        course: profile.internshipDomain,
        answers: selectedAnswers,
        correctCount,
        wrongCount: courseTest.questions.length - correctCount,
        totalQuestions: courseTest.questions.length,
        scorePercentage: Math.round((correctCount / courseTest.questions.length) * 100),
        submittedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'testSubmissions', `${user.uid}-${profile.internshipDomain}`), submissionData);
      setTestSubmission(submissionData);
      setTakingTest(false);
      setShowReportModal(true);
    } catch (error) {
      alert('Error submitting test');
    } finally {
      setSubmittingTest(false);
    }
  };

  // Test Taking Mode JSX
  if (takingTest && courseTest) {
    const q = courseTest.questions[currentQuestionIndex];
    const percentage = Math.round(((currentQuestionIndex) / courseTest.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 select-none">

        {/* Test title & progress bar */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>Assessment: {profile?.internshipDomain}</span>
            <span>Question {currentQuestionIndex + 1} of {courseTest.questions.length}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/50 shadow-sm space-y-6">
          <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
            {q.questionText}
          </h2>

          {/* Options grid */}
          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => {
              const isSelected = selectedAnswers[q.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(q.id, i)}
                  className={`block w-full text-left p-4 rounded-2xl border text-sm transition-all active:scale-99 cursor-pointer font-bold ${isSelected
                      ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm'
                      : 'border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <span className={`inline-flex w-6 h-6 rounded-full border items-center justify-center text-xs mr-3 font-extrabold ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-400 bg-white'
                    }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question navigation footer */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            Previous
          </button>

          {currentQuestionIndex === courseTest.questions.length - 1 ? (
            <button
              onClick={handleSubmitTest}
              disabled={submittingTest}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-500/10 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {submittingTest ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            >
              Next Question
            </button>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <Routes>
        <Route
          index
          element={
            <CourseDashboard
              dailyVideos={dailyVideos}
              videoProgress={videoProgress}
              attendanceEntries={attendanceEntries}
              currentDay={currentDay}
              courseTest={courseTest}
              testSubmission={testSubmission}
              handleStartTest={handleStartTest}
              setShowPaymentModal={setShowPaymentModal}
              setShowReportModal={setShowReportModal}
              hasAttendanceForDay={hasAttendanceForDay}
              getProgressPercentage={getProgressPercentage}
              getCompletedVideoDays={getCompletedVideoDays}
            />
          }
        />
        <Route
          path="recordings"
          element={
            <RecordingsList
              dailyVideos={dailyVideos}
              currentDay={currentDay}
              hasAttendanceForDay={hasAttendanceForDay}
            />
          }
        />
        <Route
          path="recordings/:dayNum"
          element={
            <VideoPlayerView
              dailyVideos={dailyVideos}
              currentDay={currentDay}
              attendanceEntries={attendanceEntries}
              attendanceSaving={attendanceSaving}
              markVideoAsDone={markVideoAsDone}
              hasAttendanceForDay={hasAttendanceForDay}
            />
          }
        />
      </Routes>

      {/* Unlock exam QR Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm space-y-4 shadow-xl border border-slate-100 select-none">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Unlock Course Assessment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-500 leading-relaxed text-center">
              Scan QR to pay ₹248 final assessment evaluation fee and unlock the graded test.
            </p>

            <div className="rounded-2xl border border-slate-100 p-2 bg-slate-50/50 flex justify-center">
              <img src="/payment/shivam-qr.jpeg" alt="Payment QR" className="w-48 h-auto object-contain rounded-xl shadow-sm" />
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Assessment report/score card modal */}
      {showReportModal && testSubmission && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm space-y-6 shadow-xl border border-slate-100 text-center select-none">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-left">
              <h2 className="text-base font-black text-slate-900">Assessment Report</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mx-auto shadow-sm">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800">
                You Scored: {testSubmission.scorePercentage}%
              </h3>
              <p className="text-xs text-slate-500 font-semibold px-2">
                Great job completing the course evaluation! Your graded marksheet is now available for download.
              </p>
            </div>

            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl text-left space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between">
                <span>Correct Answers</span>
                <span className="text-green-600">{testSubmission.correctCount}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <span>Incorrect Answers</span>
                <span className="text-red-500">{testSubmission.wrongCount}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <span>Evaluation Date</span>
                <span className="text-slate-800">
                  {new Date(testSubmission.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadMarksheet}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
              >
                Download Marksheet (PDF)
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Top-Level Extracted Components & Helper Functions ---

const getModulesData = (internshipDomain: string) => {
  const modules = [
    {
      id: 1,
      indexStr: '01',
      title: `${internshipDomain || 'Web Development'} Day 01`,
      subtitle: 'Introduction to Web Development',
      dayMin: 1,
      dayMax: 5
    },
    {
      id: 2,
      indexStr: '02',
      title: `${internshipDomain || 'Web Development'} Day 02`,
      subtitle: 'HTML Basics',
      dayMin: 6,
      dayMax: 10
    },
    {
      id: 3,
      indexStr: '03',
      title: `${internshipDomain || 'Web Development'} Day 03`,
      subtitle: 'CSS Fundamentals',
      dayMin: 11,
      dayMax: 15
    },
    {
      id: 4,
      indexStr: '04',
      title: `${internshipDomain || 'Web Development'} Day 04`,
      subtitle: 'JavaScript Basics',
      dayMin: 16,
      dayMax: 20
    }
  ];

  if (!internshipDomain?.toLowerCase().includes('web')) {
    modules.forEach(m => {
      m.title = `${internshipDomain || 'Course'} Module ${m.indexStr}`;
      if (m.id === 1) m.subtitle = 'Introduction & Core Syntax';
      if (m.id === 2) m.subtitle = 'Basic Structures & Methods';
      if (m.id === 3) m.subtitle = 'Control Flow & Logic';
      if (m.id === 4) m.subtitle = 'Hands-on Projects';
    });
  }

  return modules;
};

const getLectureDuration = (day: number) => {
  const durations = ['18:45', '22:10', '15:30', '19:20', '25:15', '21:40', '16:50', '24:30', '20:10', '17:35'];
  return durations[(day - 1) % durations.length] || '20:00';
};

const getYouTubeEmbedUrl = (v?: any) => {
  if (!v) return '';
  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  const jsApiParams = `?enablejsapi=1${origin ? `&origin=${origin}` : ''}`;

  let videoId = '';
  if (v.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(v.youtubeVideoId)) {
    videoId = v.youtubeVideoId;
  } else {
    const url = v.youtubeUrl || '';
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match && match[1]) {
      videoId = match[1];
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      videoId = url.trim();
    }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}${jsApiParams}` : '';
};

interface CourseDashboardProps {
  dailyVideos: any[];
  videoProgress: VideoProgress;
  attendanceEntries: AttendanceEntry[];
  currentDay: number;
  courseTest: any;
  testSubmission: any;
  handleStartTest: () => void;
  setShowPaymentModal: (show: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  hasAttendanceForDay: (day: number) => boolean;
  getProgressPercentage: (progress?: VideoProgress, attendance?: AttendanceEntry[]) => number;
  getCompletedVideoDays: (progress?: VideoProgress, attendance?: AttendanceEntry[]) => Set<string>;
}

const CourseDashboard = ({
  dailyVideos,
  videoProgress,
  attendanceEntries,
  currentDay,
  courseTest,
  testSubmission,
  handleStartTest,
  setShowPaymentModal,
  setShowReportModal,
  hasAttendanceForDay,
  getProgressPercentage,
  getCompletedVideoDays
}: CourseDashboardProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'pending'>('all');
  const [currentLmsPage, setCurrentLmsPage] = useState(1);
  const [lmsPageSize, setLmsPageSize] = useState(5);

  const progress = getProgressPercentage();
  const isTestPaid = profile?.hasPaidExam || testSubmission;
  const completedCount = getCompletedVideoDays().size;
  const totalLectures = dailyVideos.length || 24;

  const totalMins = Math.round(completedCount * 51.25);
  const watchHours = Math.floor(totalMins / 60);
  const watchMins = totalMins % 60;

  const isAssessmentCompleted = !!testSubmission;

  const modules = getModulesData(profile?.internshipDomain || '');

  return (
    <div className="space-y-6">

      {/* 1. Course Active Dark Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none">
        <div className="space-y-4 z-10 flex-1">
          <span className="bg-white/20 text-white border border-white/10 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            {profile?.internshipDomain || 'Web Development'} Course
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white">
            {profile?.internshipDomain || 'Web Development'}
          </h2>
          <p className="text-xs text-blue-100 max-w-sm leading-relaxed">
            Learn HTML, CSS, JavaScript and build real-world projects from scratch.
          </p>

          {/* Progress indicator */}
          <div className="space-y-1.5 pt-2 max-w-xs">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-blue-150">Overall Progress</span>
              <span className="text-cyan-300">{progress}% Complete</span>
            </div>
            <div className="w-full h-1.5 bg-blue-850 rounded-full overflow-hidden relative">
              <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Banner Graphic Illustration */}
        <div className="z-10 flex-shrink-0 flex justify-center md:justify-start">
          <img
            src="/course_illustration.png"
            alt="Course illustration"
            className="w-40 md:w-48 h-auto object-contain"
          />
        </div>

        {/* Right Summary Grid */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-full md:w-56 text-xs flex flex-col gap-3 font-semibold text-blue-100 z-10">
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Total Lectures</span>
            <span className="text-white font-bold">{totalLectures}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Duration</span>
            <span className="text-white font-bold">20:15:30</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Level</span>
            <span className="text-white font-bold">Beginner</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-blue-200">Certificate</span>
            <span className="text-white font-bold">Yes</span>
          </div>
        </div>

        {/* Gradient background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Course Metric Row Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">

        {/* Completed Lectures */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Completed Lectures</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">
              {completedCount} / {totalLectures}
            </h4>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-b-3xl"></div>
        </div>

        {/* Watch Time */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-[#eff6ff] text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Watch Time</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">
              {watchHours > 0 ? `${watchHours}h ${watchMins}m` : `${watchMins}m`}
            </h4>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-3xl"></div>
        </div>

        {/* Assignments Done */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 flex-shrink-0">
            <FileVideo size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Assignments Done</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">
              {isAssessmentCompleted ? 6 : 4} / 6
            </h4>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-b-3xl"></div>
        </div>

        {/* Quizzes Score */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Star size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Quizzes Score</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">
              {testSubmission ? `${testSubmission.scorePercentage}%` : '78%'}
            </h4>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-b-3xl"></div>
        </div>

      </div>

      {/* 3. COURSE MODULES ACCORDION LIST */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">

        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Course Modules</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Start learning by watching the course modules in order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => { setFilterType('all'); setCurrentLmsPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterType('completed'); setCurrentLmsPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
              >
                Completed
              </button>
              <button
                onClick={() => { setFilterType('pending'); setCurrentLmsPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
              >
                Pending
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentLmsPage(1); }}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold w-52 bg-white text-slate-800 outline-none focus:border-blue-500 shadow-sm transition"
              />
            </div>
          </div>
        </div>

        {/* Flat Lecture List Body with Pagination */}
        <div className="space-y-3">
          {(() => {
            const filteredVideos = dailyVideos.filter(v => {
              const matchesSearch = v.title?.toLowerCase().includes(searchQuery.toLowerCase());
              const completed = hasAttendanceForDay(v.day);
              if (filterType === 'completed') return matchesSearch && completed;
              if (filterType === 'pending') return matchesSearch && !completed;
              return matchesSearch;
            });

            const totalFilteredVideos = filteredVideos.length;
            const totalLmsPages = Math.ceil(totalFilteredVideos / lmsPageSize) || 1;
            const startIndex = (currentLmsPage - 1) * lmsPageSize;
            const paginatedVideos = filteredVideos.slice(startIndex, startIndex + lmsPageSize);

            return (
              <>
                {paginatedVideos.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-semibold text-sm">
                    No lectures found.
                  </div>
                ) : (
                  paginatedVideos.map((video) => {
                    const isVideoDone = hasAttendanceForDay(video.day);
                    const isVideoUnlocked = video.day <= currentDay;
                    const idxStr = String(video.day).padStart(2, '0');
                    const duration = getLectureDuration(video.day);

                    return (
                      <div
                        key={video.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-100 bg-white transition hover:shadow-sm gap-4"
                      >
                        <div className="flex items-center gap-4">
                          {/* Day index */}
                          <div className="w-16 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                            Day {idxStr}
                          </div>

                          {/* Play Icon Box */}
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                            <PlayCircle size={15} />
                          </div>

                          <div>
                            <h5 className="font-extrabold text-sm text-slate-800">{video.title}</h5>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                              <Clock size={10} />
                              {duration}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                          {/* Status badge */}
                          {isVideoDone ? (
                            <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none">
                              Completed
                            </span>
                          ) : isVideoUnlocked ? (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none">
                              Pending
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none flex items-center gap-1">
                              <Lock size={10} />
                              Locked
                            </span>
                          )}

                          {/* Action button */}
                          {isVideoDone ? (
                            <button
                              onClick={() => navigate(`recordings/${video.day}`)}
                              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                            >
                              Watch Again
                            </button>
                          ) : isVideoUnlocked ? (
                            <button
                              onClick={() => navigate(`recordings/${video.day}`)}
                              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                            >
                              Watch Lecture
                            </button>
                          ) : (
                            <button
                              disabled
                              className="h-9 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold border border-slate-100 cursor-not-allowed"
                            >
                              Locked
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* LMS Pagination controls */}
                {totalFilteredVideos > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 select-none">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentLmsPage(1)}
                        disabled={currentLmsPage === 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                      >
                        <ChevronsLeft size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentLmsPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentLmsPage === 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {Array.from({ length: totalLmsPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentLmsPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition active:scale-95 cursor-pointer ${currentLmsPage === pageNum
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentLmsPage(prev => Math.min(prev + 1, totalLmsPages))}
                        disabled={currentLmsPage === totalLmsPages}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => setCurrentLmsPage(totalLmsPages)}
                        disabled={currentLmsPage === totalLmsPages}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Show</span>
                      <select
                        value={lmsPageSize}
                        onChange={(e) => {
                          setLmsPageSize(Number(e.target.value));
                          setCurrentLmsPage(1);
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
              </>
            );
          })()}

          {/* Quiz Row item at the end of Module list */}
          {courseTest && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-red-50 bg-[#fff5f5]/30 hover:border-red-150 transition hover:shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                  Quiz
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-150 flex items-center justify-center text-red-500">
                  <ClipboardList size={15} />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-800">Final Assessment Quiz</h5>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                    <Info size={10} />
                    {courseTest.questions.length} Questions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                {/* Status badge */}
                {testSubmission ? (
                  <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none">
                    Attempted
                  </span>
                ) : progress < 100 ? (
                  <span className="bg-slate-50 text-slate-400 border border-slate-150 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none flex items-center gap-1">
                    <Lock size={10} />
                    Locked
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-600 border border-blue-150 text-[10px] font-black px-2.5 py-1 rounded-full uppercase leading-none">
                    Pending
                  </span>
                )}

                {/* Action button */}
                {testSubmission ? (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    View Quiz
                  </button>
                ) : progress < 100 ? (
                  <button
                    disabled
                    className="h-9 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold border border-slate-100 cursor-not-allowed"
                  >
                    Locked
                  </button>
                ) : !isTestPaid ? (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Unlock Quiz (₹248)
                  </button>
                ) : (
                  <button
                    onClick={handleStartTest}
                    className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

interface RecordingsListProps {
  dailyVideos: any[];
  currentDay: number;
  hasAttendanceForDay: (day: number) => boolean;
}

const RecordingsList = ({
  dailyVideos,
  currentDay,
  hasAttendanceForDay
}: RecordingsListProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 select-none">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dailyVideos.map((v) => {
          const isDone = hasAttendanceForDay(v.day);
          const isUnlocked = v.day <= currentDay;
          return (
            <div key={v.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Day {v.day} - {v.title}</h3>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Course recording</span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                {isDone ? (
                  <span className="text-[10px] font-bold text-green-600">Attendance Marked</span>
                ) : !isUnlocked ? (
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Lock size={10} /> Locked</span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-600">Pending Watch</span>
                )}

                {isUnlocked ? (
                  <button
                    onClick={() => navigate(`recordings/${v.day}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    Watch
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-100 rounded-xl text-xs font-bold cursor-not-allowed"
                  >
                    Locked
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface VideoPlayerViewProps {
  dailyVideos: any[];
  currentDay: number;
  attendanceEntries: AttendanceEntry[];
  attendanceSaving: boolean;
  markVideoAsDone: (video: any) => Promise<void>;
  hasAttendanceForDay: (day: number) => boolean;
}

const VideoPlayerView = ({
  dailyVideos,
  currentDay,
  attendanceEntries,
  attendanceSaving,
  markVideoAsDone,
  hasAttendanceForDay
}: VideoPlayerViewProps) => {
  const { dayNum } = useParams();
  const navigate = useNavigate();
  const video = dailyVideos.find(v => String(v.day) === String(dayNum));
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [watchTimeLeft, setWatchTimeLeft] = useState<number>(300); // 5 minutes = 300s

  useEffect(() => {
    if (video) {
      const completed = hasAttendanceForDay(video.day);
      setIsVideoCompleted(completed);
      if (completed) {
        setWatchTimeLeft(0);
      } else {
        setWatchTimeLeft(300);
      }
    }
  }, [video, attendanceEntries]);

  useEffect(() => {
    if (isVideoCompleted || watchTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setWatchTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVideoCompleted, watchTimeLeft]);

  const minutes = Math.floor(watchTimeLeft / 60);
  const seconds = watchTimeLeft % 60;
  const formattedTimer = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.min(100, Math.round(((300 - watchTimeLeft) / 300) * 100));

  return (
    <div className="space-y-6 select-none font-sans">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition cursor-pointer"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      {/* Top Mobile-Responsive Attendance Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto text-left">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isVideoCompleted 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isVideoCompleted ? <ShieldCheck size={20} /> : <Clock size={20} className={watchTimeLeft > 0 ? "animate-pulse" : ""} />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Log</h4>
            <p className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              {isVideoCompleted 
                ? "Attendance officially recorded" 
                : watchTimeLeft > 0 
                  ? `Timer Active: ${formattedTimer} remaining` 
                  : "Watch goal reached! Ready to submit"}
            </p>
          </div>
        </div>

        {!isVideoCompleted ? (
          <button
            disabled={watchTimeLeft > 0 || attendanceSaving}
            onClick={() => markVideoAsDone(video)}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              watchTimeLeft > 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 animate-pulse'
            }`}
          >
            {watchTimeLeft > 0 ? (
              <>
                <Lock size={12} className="text-slate-500" />
                <span>Locked ({formattedTimer})</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} className="stroke-[2.5]" />
                <span>{attendanceSaving ? 'Saving...' : 'Mark Attendance'}</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full sm:w-auto text-center sm:text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={14} /> Recorded
            </span>
          </div>
        )}
      </div>

      {/* Youtube player wrapper */}
      <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800 relative group">
        <iframe
          className="w-full h-full border-0"
          src={getYouTubeEmbedUrl(video)}
          title={video?.title || 'Video Player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* ULTRA-PREMIUM ATTENDANCE & WATCH PROGRESS CONTAINER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.25rem] p-6 sm:p-8 shadow-2xl border border-indigo-500/20">

        {/* Background Ambient Blur Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">

          {/* Header info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Zap size={12} className="text-blue-400 fill-blue-400" />
                  Day {video?.day} Session Recording
                </span>
                {isVideoCompleted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {video?.title || `Day ${video?.day} Video Lecture`}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Official internship session log. Watch the training video to record your daily attendance.
              </p>
            </div>

            {/* Day Badge */}
            <div className="hidden sm:flex flex-col items-center justify-center bg-slate-800/60 border border-slate-700/60 px-5 py-3 rounded-2xl shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">LECTURE DAY</span>
              <span className="text-2xl font-black text-white leading-none mt-1">DAY {video?.day}</span>
            </div>
          </div>

          {/* Attendance Action Section */}
          {isVideoCompleted ? (
            /* ALREADY MARKED STATE */
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2.5xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">Attendance Verified & Submitted</h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                    Your presence for Day {video?.day} is officially recorded in the portal.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 font-black text-xs px-5 py-3 rounded-xl border border-emerald-500/30 shrink-0">
                <CheckCircle2 size={16} />
                Recorded
              </div>
            </div>
          ) : (
            /* NOT MARKED YET - WATCH TIMER & BUTTON */
            <div className="space-y-5 text-left">

              {/* Watch Time Progress Bar */}
              <div className="bg-slate-950/70 border border-slate-800 p-4.5 rounded-2.5xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-extrabold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={14} className="text-blue-400 animate-pulse" />
                    Minimum Watch Requirement (5:00 Mins)
                  </span>
                  <span className={`inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-lg border w-fit ${watchTimeLeft === 0
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse font-bold'
                    }`}>
                    {watchTimeLeft === 0
                      ? '✨ Watch Goal Completed (100%)'
                      : `⏱️ ${formattedTimer} remaining (${progressPercent}%)`}
                  </span>
                </div>

                {/* Visual Progress Bar track */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                  {watchTimeLeft > 0
                    ? 'Please watch the video session above. The attendance button will unlock automatically once 5 minutes are completed.'
                    : 'Great job! You have satisfied the 5-minute watch duration. Click the button below to verify and record your attendance.'}
                </p>
              </div>

              {/* Interactive Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>Attendance requires watching the video session.</span>
                </div>

                <button
                  disabled={watchTimeLeft > 0 || attendanceSaving}
                  onClick={() => markVideoAsDone(video)}
                  className={`w-full sm:w-auto px-9 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-xl ${watchTimeLeft > 0
                      ? 'bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 animate-pulse'
                    }`}
                >
                  {watchTimeLeft > 0 ? (
                    <>
                      <Lock size={16} className="text-slate-400" />
                      <span>Watching Video ({formattedTimer} Left)...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} className="stroke-[2.5]" />
                      <span>{attendanceSaving ? 'Submitting...' : 'Verify & Record Attendance'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
