import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc
} from 'firebase/firestore';
 
import { motion } from 'motion/react';
import {
  Youtube,
  Save,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  X,
  Video,
  Clock,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { COURSE_VIDEO_DAY_LIMIT, INTERNSHIP_DOMAINS } from '../../lib/constants';
import { useAuth } from '../../components/AuthContext';
import { AttendanceEntry, AttendanceStudent, generateCourseAttendanceReport } from '../dashboard/generateAttendanceReport';
 
interface DailyVideo {
  id: string;
  day: number;
  title: string;
  youtubeUrl: string;
  description: string;
  course: string;
}
 
export default function ManageDailyVideos() {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const [videos, setVideos] = useState<DailyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<DailyVideo | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseOptions, setCourseOptions] = useState<string[]>(INTERNSHIP_DOMAINS);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [loadingTest, setLoadingTest] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
 
  const fetchCourseTest = async () => {
    if (!selectedCourse) return;
    setLoadingTest(true);
    try {
      const docRef = doc(db, 'courseTests', selectedCourse);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTestQuestions(docSnap.data().questions || []);
      } else {
        setTestQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching course test:', error);
      alert('Error fetching course test');
    } finally {
      setLoadingTest(false);
    }
  };
 
  const handleOpenTestManager = () => {
    fetchCourseTest();
    setShowTestModal(true);
  };
 
  const handleSaveTest = async () => {
    if (!selectedCourse) return;
 
    // Validation
    for (let i = 0; i < testQuestions.length; i++) {
      const q = testQuestions[i];
      if (!q.questionText.trim()) {
        alert(`Question ${i + 1} is empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Option ${String.fromCharCode(65 + j)} for Question ${i + 1} is empty.`);
          return;
        }
      }
      if (q.correctOptionIndex === undefined || q.correctOptionIndex === null || q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
        alert(`Please select the correct option for Question ${i + 1}.`);
        return;
      }
    }
 
    setSavingTest(true);
    try {
      await setDoc(doc(db, 'courseTests', selectedCourse), {
        course: selectedCourse,
        questions: testQuestions,
        updatedAt: new Date().toISOString()
      });
      alert('Test saved successfully');
      setShowTestModal(false);
    } catch (error) {
      console.error('Error saving course test:', error);
      alert('Error saving course test');
    } finally {
      setSavingTest(false);
    }
  };
 
  const addEmptyQuestion = () => {
    setTestQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0
      }
    ]);
  };
 
  const updateQuestionField = (index: number, field: string, value: any) => {
    setTestQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
 
  const removeQuestion = (index: number) => {
    setTestQuestions(prev => prev.filter((_, i) => i !== index));
  };
 
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [courseStudents, setCourseStudents] = useState<AttendanceStudent[]>([]);
  const [formData, setFormData] = useState({
    day: 1,
    title: '',
    youtubeUrl: '',
    description: '',
    course: ''
  });
  const isTeacher = adminProfile?.role === 'teacher';
  const assignedCourse = adminProfile?.course || '';
 
  const fetchCourseOptions = async () => {
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const firestoreCourses = snapshot.docs
        .map(doc => String(doc.data().name ?? '').trim())
        .filter(Boolean);
 
      const mergedCourses = [...new Set([...firestoreCourses, ...INTERNSHIP_DOMAINS])];
      setCourseOptions(mergedCourses);
 
      if (isTeacher && assignedCourse && mergedCourses.includes(assignedCourse)) {
        setSelectedCourse(assignedCourse);
      }
    } catch (error) {
      console.error('Error fetching course options:', error);
      setCourseOptions(INTERNSHIP_DOMAINS);
    }
  };
 
  useEffect(() => {
    fetchCourseOptions();
  }, []);
 
  useEffect(() => {
    if (isTeacher) {
      setSelectedCourse(assignedCourse);
    }
  }, [isTeacher, assignedCourse]);
 
  useEffect(() => {
    if (selectedCourse) {
      fetchVideos();
      fetchCourseStatus();
      fetchAttendance();
      fetchCourseStudents();
 
      setFormData(prev => ({
        ...prev,
        course: selectedCourse
      }));
    }
  }, [selectedCourse]);
 
  const fetchVideos = async () => {
    if (!selectedCourse) {
      setVideos([]);
      setLoading(false);
      return;
    }
 
    try {
      const videosRef = collection(db, 'dailyVideos');
      const q = query(videosRef, where('course', '==', selectedCourse), orderBy('day'));
      const snapshot = await getDocs(q);
      const videosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DailyVideo));
      setVideos(videosData);
 
      // Calculate next available day
      if (videosData.length > 0) {
        const maxDay = Math.max(...videosData.map(v => v.day));
        const nextDay = maxDay < COURSE_VIDEO_DAY_LIMIT ? maxDay + 1 : COURSE_VIDEO_DAY_LIMIT;
        setFormData(prev => ({ ...prev, day: nextDay }));
      } else {
        setFormData(prev => ({ ...prev, day: 1 }));
      }
 
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };
  const fetchCourseStatus = async () => {
    if (!selectedCourse) return;
 
    try {
      const docRef = doc(db, "courseCompletion", selectedCourse);
      const docSnap = await getDoc(docRef);
 
      if (docSnap.exists()) {
        setCourseCompleted(docSnap.data().completed || false);
      } else {
        setCourseCompleted(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const fetchAttendance = async () => {
    if (!selectedCourse) {
      setAttendanceEntries([]);
      return;
    }
 
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('course', '==', selectedCourse),
        orderBy('day')
      );
      const snapshot = await getDocs(attendanceQuery);
      setAttendanceEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceEntry)));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };
 
  const fetchCourseStudents = async () => {
    if (!selectedCourse) {
      setCourseStudents([]);
      return;
    }
 
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('internshipDomain', '==', selectedCourse)
      );
      const snapshot = await getDocs(usersQuery);
      setCourseStudents(snapshot.docs.map((studentDoc) => {
        const data = studentDoc.data();
 
        return {
          id: studentDoc.id,
          uid: studentDoc.id,
          fullName: data.fullName || '',
          email: data.email || '',
          college: data.college || ''
        };
      }));
    } catch (error) {
      console.error('Error fetching course students:', error);
      setCourseStudents([]);
    }
  };
  const extractVideoId = (url: string): string => {
    const regex =
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
 
    const match = url.match(regex);
    return match ? match[1] : '';
  };
 
  const handleSave = async () => {
    if (isTeacher && formData.course !== assignedCourse) {
      alert('You can add videos only for your assigned course');
      return;
    }
 
    if (!formData.title || !formData.youtubeUrl || !formData.course) {
      alert('Please fill in title, YouTube URL, and select a course');
      return;
    }
 
    const videoId = extractVideoId(formData.youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }
 
    try {
      if (editingVideo) {
        // Update existing video
        await setDoc(doc(db, 'dailyVideos', editingVideo.id), {
          ...formData,
          youtubeVideoId: videoId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Check if day already exists for this course
        const existingVideo = videos.find(v => v.day === formData.day);
        if (existingVideo) {
          alert(`Day ${formData.day} already has a video for ${formData.course}. Please edit or delete it first.`);
          return;
        }
 
        // Create new video
        const safeCourseKey = String(formData.course).replace(/[\/\\]/g, '-').trim();
        const docId = `${safeCourseKey}-day-${formData.day}`;
        await setDoc(doc(db, 'dailyVideos', docId), {
          ...formData,
          youtubeVideoId: videoId,
          createdAt: new Date().toISOString()
        });
      }
 
      await fetchVideos();
      resetForm();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error saving video');
    }
  };
 
  const handleEdit = (video: DailyVideo) => {
    setEditingVideo(video);
    setFormData({
      day: video.day,
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      description: video.description,
      course: video.course
    });
  };
 
  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
 
    try {
      await deleteDoc(doc(db, 'dailyVideos', videoId));
      await fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };
 
  const markCourseCompleted = async () => {
    if (!selectedCourse) return;
 
    try {
      await setDoc(
        doc(db, "courseCompletion", selectedCourse),
        {
          course: selectedCourse,
          completed: true,
          completedAt: new Date().toISOString()
        }
      );
 
      setCourseCompleted(true);
 
      alert("Course marked as completed");
    } catch (error) {
      console.log(error);
      alert("Error");
    }
  };
  const resetForm = () => {
    setEditingVideo(null);
    setFormData({
      day: videos.length + 1 > COURSE_VIDEO_DAY_LIMIT ? COURSE_VIDEO_DAY_LIMIT : videos.length + 1,
      title: '',
      youtubeUrl: '',
      description: '',
      course: selectedCourse
    });
  };
 
  return (
    <div className="space-y-6">
      {/* Course Selector Card */}
      <div className="student-card p-5 bg-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 gradient-text">Manage Daily Videos</h1>
          <p className="text-slate-500 text-xs font-semibold">Upload and curate daily lecture videos by course.</p>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto min-w-[240px]">
          <Label className="student-label shrink-0">Select Course:</Label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={isTeacher}
            className={`student-input h-11 px-4 py-0 text-xs text-slate-800 rounded-xl border-slate-200/80 bg-white ${isTeacher ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
          >
            <option value="" className="text-slate-900">{isTeacher ? 'No course assigned' : '-- Select Course --'}</option>
            {courseOptions.map((course) => (
              <option key={course} value={course} className="text-slate-900">{course}</option>
            ))}
          </select>
        </div>
      </div>
 
      <div className="space-y-6 sm:space-y-8">
        {!selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="student-card p-8 text-center bg-white/80"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-blue-100">
              <Video size={32} />
            </div>
            <p className="text-slate-700 font-black text-lg">Please select a course to manage videos</p>
            <p className="text-slate-400 font-bold text-sm mt-1">Select a course from the dropdown selector above to view or add daily videos.</p>
          </motion.div>
        )}
 
        {/* Add/Edit Form */}
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="student-card p-6 bg-white/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`student-icon ${editingVideo ? 'bg-amber-50 text-amber-600 ring-amber-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}`}>
                  {editingVideo ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-black text-slate-900 gradient-text">
                  {editingVideo ? 'Edit Video' : 'Add New Video'}
                </h2>
              </div>
             
              <div className="flex flex-wrap gap-2">
                {courseCompleted ? (
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                    <button
                      onClick={handleOpenTestManager}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                    >
                      <ClipboardList size={14} />
                      Test
                    </button>
                    <button
                      onClick={() => generateCourseAttendanceReport(selectedCourse, attendanceEntries, courseStudents, videos)}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Attendance Report
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={markCourseCompleted}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-black uppercase tracking-wider shadow-sm shadow-indigo-600/10 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Mark Course Completed
                  </button>
                )}
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80">
                  {selectedCourse}
                </span>
              </div>
            </div>
 
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="student-label block mb-2">Day (1-{COURSE_VIDEO_DAY_LIMIT})</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max={COURSE_VIDEO_DAY_LIMIT}
                      value={formData.day}
                      disabled
                      className="student-input bg-slate-100 to-slate-50 border-slate-200 font-black text-slate-900 pl-4 pr-12"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Clock size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Auto-calculated based on existing videos
                  </p>
                </div>
                <div>
                  <Label className="student-label block mb-2">Video Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter video title"
                    className="student-input"
                  />
                </div>
              </div>
 
              <div>
                <Label className="student-label block mb-2">YouTube URL</Label>
                <div className="relative">
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                  <Input
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="student-input pl-12"
                  />
                </div>
              </div>
 
              <div>
                <Label className="student-label block mb-2">Description (Optional)</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the video content"
                  className="student-input min-h-[96px] py-3 resize-none"
                  rows={3}
                />
              </div>
 
              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleSave}
                  className="student-button-primary flex-1 h-14 shadow-indigo-600/10 cursor-pointer"
                >
                  <Save size={20} />
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </Button>
                {editingVideo && (
                  <Button
                    onClick={resetForm}
                    className="student-button-soft h-14 px-6 cursor-pointer"
                  >
                    <X size={20} />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
 
        {/* Videos List */}
        {selectedCourse && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic gradient-text">Current Schedule</h2>
              <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80">
                {videos.length} / {COURSE_VIDEO_DAY_LIMIT} videos
              </span>
            </div>
 
            {loading ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-500 font-bold">Loading schedule...</span>
                </div>
              </div>
            ) : videos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="student-card p-12 text-center bg-white/80"
              >
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-slate-200">
                  <Video size={36} />
                </div>
                <p className="text-slate-700 font-black italic text-lg mb-2">No videos added yet</p>
                <p className="text-slate-400 font-semibold">Start by adding Day 1 video for {selectedCourse}</p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="student-card p-5 bg-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                        <Youtube size={32} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs border-4 border-white shadow-lg">
                        {video.day}
                      </div>
                    </div>
                   
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ring-1 ring-indigo-100/50">
                          Day {video.day}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 truncate">{video.title}</h3>
                      </div>
                      {video.description && (
                        <p className="text-slate-500 text-sm font-semibold leading-relaxed line-clamp-2">{video.description}</p>
                      )}
                      <a
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 text-xs font-bold hover:underline truncate block mt-1"
                      >
                        {video.youtubeUrl}
                      </a>
                    </div>
                   
                    <div className="flex gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        onClick={() => handleEdit(video)}
                        variant="outline"
                        size="icon"
                        className="border-slate-200 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer rounded-xl h-10 w-10"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(video.id)}
                        variant="outline"
                        size="icon"
                        className="border-slate-200 hover:border-rose-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer rounded-xl h-10 w-10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
 
        {selectedCourse && (
          <div className="student-card bg-white/80 overflow-hidden">
            <div className="p-6 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 gradient-text">Attendance Entries</h2>
                <p className="text-slate-500 text-sm font-bold">{selectedCourse}</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80">
                {attendanceEntries.length} Entries
              </span>
            </div>
 
            {attendanceEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold">
                No attendance entries yet.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] table-auto">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Student</th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Day</th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Video</th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Attendance Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                        <td className="p-4 font-black text-slate-900">{entry.studentName}</td>
                        <td className="p-4 text-slate-600 text-sm font-semibold">{entry.email || '-'}</td>
                        <td className="p-4 text-slate-600 font-bold text-sm">Day {entry.day}</td>
                        <td className="p-4 text-slate-600 text-sm font-medium">{entry.videoTitle}</td>
                        <td className="p-4 text-slate-600 text-sm font-medium">
                          {new Date(entry.watchedAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
 
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl student-card bg-white/95 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-white/50">
            <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-1 block">
                  Course Assessment
                </span>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic gradient-text">
                  Manage Test: {selectedCourse}
                </h2>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
 
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingTest ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 font-bold">Loading questions...</span>
                  </div>
                </div>
              ) : (
                <>
                  {testQuestions.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                      <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-600 font-black italic">No questions added yet</p>
                      <p className="text-slate-400 text-sm mt-1">Click the button below to add your first question.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {testQuestions.map((q, index) => (
                        <div key={q.id || index} className="student-card p-5 bg-white/60 relative space-y-4">
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="text-rose-500 hover:text-rose-700 transition absolute top-4 right-4 cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={18} />
                          </button>
 
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full uppercase ring-1 ring-indigo-100/50">
                              Q {index + 1}
                            </span>
                          </div>
 
                          <div>
                            <Label className="student-label block mb-2">Question Text</Label>
                            <Input
                              value={q.questionText}
                              onChange={(e) => updateQuestionField(index, 'questionText', e.target.value)}
                              placeholder="Enter the question here"
                              className="student-input bg-white h-12 px-4"
                            />
                          </div>
 
                          <div>
                            <Label className="student-label block mb-2">Options & Correct Answer</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {q.options.map((opt: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                                  <input
                                    type="radio"
                                    name={`correct-${q.id || index}`}
                                    checked={q.correctOptionIndex === optIndex}
                                    onChange={() => updateQuestionField(index, 'correctOptionIndex', optIndex)}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                                  />
                                  <span className="text-xs font-black text-slate-400">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIndex] = e.target.value;
                                      updateQuestionField(index, 'options', newOpts);
                                    }}
                                    placeholder={`Enter option ${String.fromCharCode(65 + optIndex)}`}
                                    className="flex-1 text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
 
                  <button
                    type="button"
                    onClick={addEmptyQuestion}
                    className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                </>
              )}
            </div>
 
            <div className="p-6 border-t border-slate-100/50 flex gap-4 bg-slate-50/50">
              <Button
                onClick={handleSaveTest}
                disabled={savingTest || loadingTest}
                className="student-button-primary bg-blue-600 hover:bg-blue-700 text-white font-black flex-1 h-12 rounded-xl"
              >
                {savingTest ? 'Saving...' : 'Save Test'}
              </Button>
              <Button
                onClick={() => setShowTestModal(false)}
                disabled={savingTest}
                className="student-button-soft font-bold h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
