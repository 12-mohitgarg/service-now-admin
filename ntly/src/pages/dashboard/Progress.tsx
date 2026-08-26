import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Award,
  FileCheck,
  BookOpen,
  Eye,
  Check,
  Zap,
  ChevronDown,
  Flag,
  Video
} from 'lucide-react';
import { motion } from 'motion/react';

interface AttendanceEntry {
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

interface AttendanceVideo {
  id: string;
  day: number;
  title: string;
  description?: string;
}

export default function Progress() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dailyVideos, setDailyVideos] = useState<AttendanceVideo[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [videoProgress, setVideoProgress] = useState<Record<string, boolean>>({});
  const [testSubmission, setTestSubmission] = useState<any>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!user || !profile?.internshipDomain) {
      setLoading(false);
      return;
    }

    const fetchProgressData = async () => {
      try {
        const course = profile.internshipDomain;

        // 1. Fetch daily videos
        const videosQuery = query(
          collection(db, 'dailyVideos'),
          where('course', '==', course)
        );
        const videosSnapshot = await getDocs(videosQuery);
        const videos = videosSnapshot.docs
          .map((videoDoc) => {
            const data = videoDoc.data();
            return {
              id: videoDoc.id,
              day: Number(data.day),
              title: data.title || data.videoTitle || data.name || `Day ${data.day}`,
              description: data.description || '',
            } as AttendanceVideo;
          })
          .filter((v) => Number.isFinite(v.day) && v.day > 0)
          .sort((a, b) => a.day - b.day);
        setDailyVideos(videos);

        // 2. Fetch attendance logs
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('userId', '==', user.uid),
          where('course', '==', course)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const attendance = attendanceSnapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as AttendanceEntry
        );
        setAttendanceEntries(attendance);

        // 3. Fetch watch progress
        const progressRef = doc(db, 'userVideoProgress', `${user.uid}-${course}`);
        const progressSnapshot = await getDoc(progressRef);
        if (progressSnapshot.exists()) {
          const completedVideos = progressSnapshot.data().completedVideos || {};
          const normalizedProgress: Record<string, boolean> = {};
          Object.entries(completedVideos).forEach(([day, val]) => {
            normalizedProgress[String(day).trim()] = Boolean(val);
          });
          setVideoProgress(normalizedProgress);
        }

        // 4. Fetch test submission
        const testSubRef = doc(db, 'testSubmissions', `${user.uid}-${course}`);
        const testSubSnap = await getDoc(testSubRef);
        if (testSubSnap.exists()) {
          setTestSubmission(testSubSnap.data());
        }
      } catch (err) {
        console.error('Error fetching detailed progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user, profile]);

  // Derived progress statistics
  const totalDays = dailyVideos.length;
  const uploadedDaysSet = new Set(dailyVideos.map((v) => String(v.day).trim()));

  const completedDays = new Set<string>();
  Object.entries(videoProgress).forEach(([day, watched]) => {
    if (watched && uploadedDaysSet.has(day.trim())) {
      completedDays.add(day.trim());
    }
  });
  attendanceEntries.forEach((entry) => {
    const dayStr = String(entry.day).trim();
    if (uploadedDaysSet.has(dayStr)) {
      completedDays.add(dayStr);
    }
  });

  const watchPercentage = totalDays > 0 ? Math.round((completedDays.size / totalDays) * 100) : 0;
  
  const attendedDaysCount = attendanceEntries.filter((entry) =>
    uploadedDaysSet.has(String(entry.day).trim())
  ).length;
  const attendancePercentage = totalDays > 0 ? Math.round((attendedDaysCount / totalDays) * 100) : 0;

  const isPaymentCompleted = Boolean(profile?.isPaid || profile?.hasPaid || profile?.paymentStatus === 'success');
  const isAssessmentCompleted = !!testSubmission;
  const progress = profile?.progress || watchPercentage;
  const isReportCompleted = progress >= 90; // If progress is above 90%, report uploading is unlocked
  const creditHours = completedDays.size * 4; // 4 hours per day completed

  // Milestone list config
  const milestones = [
    {
      title: 'Registration & Onboarding',
      desc: 'Account created and profile verification completed.',
      status: 'completed',
    },
    {
      title: 'Payment Verification',
      desc: 'Verify fee submission status for access to certificates.',
      status: isPaymentCompleted ? 'completed' : 'pending',
    },
    {
      title: 'Lectures & Learning Journey',
      desc: `Complete daily videos. Current progress: ${progress}%.`,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'current' : 'upcoming',
    },
    {
      title: 'Final Assessment Test',
      desc: isAssessmentCompleted
        ? `Assessment cleared. Score: ${testSubmission.score || 0}/${testSubmission.totalQuestions || 0}`
        : 'Pass the course assessment test to qualify for graded marksheet.',
      status: isAssessmentCompleted ? 'completed' : progress >= 100 ? 'current' : 'upcoming',
    },
    {
      title: 'Project/Internship Report',
      desc: 'Submit your comprehensive learning report for admin review.',
      status: isReportCompleted ? 'completed' : 'upcoming',
    },
    {
      title: 'Unlock Certifications',
      desc: 'Claim official certificate, marksheet, and recommendation letters.',
      status: progress >= 100 && isAssessmentCompleted ? 'completed' : 'upcoming',
    },
  ];

  // Filtering daily videos
  const filteredVideos = dailyVideos
    .filter((video) => {
      const matchSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          `day ${video.day}`.includes(searchQuery.toLowerCase());
      
      const isCompleted = completedDays.has(String(video.day).trim());
      if (statusFilter === 'completed') return matchSearch && isCompleted;
      if (statusFilter === 'pending') return matchSearch && !isCompleted;
      return matchSearch;
    })
    .sort((a, b) => {
      return sortOrder === 'asc' ? a.day - b.day : b.day - a.day;
    });

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">
          Fetching detailed records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-505 hover:text-slate-800 transition cursor-pointer self-start bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft size={13} />
          Back to Panel
        </button>
        
        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
          <Sparkles size={13} />
          <span>Active Domain: {profile?.internshipDomain || 'Enrolled Student'}</span>
        </div>
      </div>

      {/* 1. HERO GRADIENT BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden select-none shadow-md">
        <div className="relative z-10 space-y-2.5 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-400/25 px-2.5 py-1 rounded-full">
            Dossier & Learning Record
          </span>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight">
            Your Performance Hub
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
            Track your lectures watched, verified attendance sessions, milestones status, and final test grading. Ensure all requirements are completed to unlock your certifications.
          </p>
        </div>

        {/* Floating background graphics */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-white">
          <TrendingUp size={160} />
        </div>
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. CORE PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Course Completion Progress Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Course Progress</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{progress}%</h3>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5 mb-1.5">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {completedDays.size} of {totalDays} videos complete
            </p>
          </div>
        </div>

        {/* Credit Hours Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Internship Hours</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{creditHours} Hrs</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 mt-2.5 inline-block">
              UGC Compliant credit hours
            </span>
          </div>
        </div>

        {/* Attendance Percentage Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Lecture Attendance</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{attendancePercentage}%</h3>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5 mb-1.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {attendedDaysCount} classes marked present
            </p>
          </div>
        </div>

        {/* Assessment Score Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Assessment Score</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck size={14} />
            </div>
          </div>
          <div className="mt-4">
            {isAssessmentCompleted ? (
              <>
                <h3 className="text-2xl font-black text-slate-900">
                  {Math.round((testSubmission.score / testSubmission.totalQuestions) * 100)}%
                </h3>
                <p className="text-[10px] font-bold text-purple-600 mt-2 block">
                  Score: {testSubmission.score}/{testSubmission.totalQuestions} Questions Passed
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-400">N/A</h3>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 mt-2.5 inline-block">
                  Test pending complete lectures
                </span>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 3. GRID OF DETAIL PANELS: MILESTONES & DAILY VIDEO LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Milestone Vertical Checklist Dashboard */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm select-none">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-6">
            <Flag size={18} className="text-blue-600" /> Completion Milestones
          </h3>

          <div className="space-y-6 relative border-l border-slate-100 pl-5 ml-2.5">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === 'completed';
              const isCurrent = milestone.status === 'current';
              
              return (
                <div key={idx} className="relative">
                  {/* Circle Indicator on vertical line */}
                  <div
                    className={`absolute -left-[30px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/20'
                        : isCurrent
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                          : 'bg-white border-slate-250 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  <div>
                    <h4 className={`text-xs font-black leading-snug ${
                      isCompleted ? 'text-slate-800' : isCurrent ? 'text-blue-600' : 'text-slate-400 font-semibold'
                    }`}>
                      {milestone.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-semibold">
                      {milestone.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Lectures Log & Filter Tab */}
        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Video size={18} className="text-blue-600" /> Daily Lectures Log
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Check status for each course lecture session
              </p>
            </div>
            
            {/* Sorting order toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer self-start"
            >
              <span>Day {sortOrder === 'asc' ? '1 ➔ N' : 'N ➔ 1'}</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9.5 pl-10 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            
            <div className="sm:col-span-6 flex gap-1.5">
              {(['all', 'completed', 'pending'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 h-9.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* List of Lectures */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12 select-none border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">
                  No lectures found matching current filters.
                </p>
              </div>
            ) : (
              filteredVideos.map((video) => {
                const isWatched = completedDays.has(String(video.day).trim());
                const attendance = attendanceEntries.find((entry) => Number(entry.day) === video.day);
                
                return (
                  <div
                    key={video.id}
                    className={`flex items-center justify-between border rounded-2xl p-4 gap-4 transition-all duration-200 ${
                      isWatched
                        ? 'border-slate-200 bg-slate-50/20 hover:bg-slate-50/40'
                        : 'border-slate-150 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Status Icon Indicator */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 select-none ${
                        isWatched
                          ? 'bg-green-50 text-green-600 border border-green-200/50'
                          : 'bg-slate-50 text-slate-400 border border-slate-200/50'
                      }`}>
                        {isWatched ? '✓' : video.day}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block leading-none">
                          Day {video.day} Lecture
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800 truncate mt-1.5 leading-snug">
                          {video.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Watched Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border select-none ${
                        isWatched 
                          ? 'bg-green-50 text-green-700 border-green-200/60'
                          : 'bg-amber-50 text-amber-700 border-amber-200/60'
                      }`}>
                        {isWatched ? 'Completed' : 'Pending'}
                      </span>

                      {/* Attendance indicator */}
                      {attendance && (
                        <span className="hidden sm:inline-flex h-5 items-center bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider px-2 select-none">
                          Attended
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
