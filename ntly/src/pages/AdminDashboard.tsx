import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, addDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Users, LogOut, Mail, Phone, CheckCircle2, CreditCard, Clock, MapPin, GraduationCap, BookOpen, LayoutDashboard, Building2, List, Youtube, UserPlus, Download, Bell, Send, Upload, FileText, Trash2, ClipboardList, KeyRound, RefreshCw } from 'lucide-react';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut, User as FirebaseUser } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CURRENT_INTERNSHIP_START_DATE,
  INTERNSHIP_DOMAINS,
  DEPARTMENTS,
  DISTRICTS,
  UNIVERSITIES,
  GENDERS,
  DEGREES,
  SESSIONS,
  SEMESTERS
} from '../lib/constants';
import { jsPDF } from 'jspdf';
import { backupFirestore } from "./backupFirestore";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { QuizSubmission } from './dashboard/generateTestReport';

const currentInternshipStartTime = new Date(`${CURRENT_INTERNSHIP_START_DATE}T00:00:00`).getTime();

const isCurrentInternshipUser = (student: { registrationDate?: string }) => {
  if (!student.registrationDate) return false;
  const timestamp = new Date(student.registrationDate).getTime();
  return Number.isFinite(timestamp) && timestamp >= currentInternshipStartTime;
};

interface UserProfile {
  uid: string;
  fullName: string;
  gender?: string;
  parentName?: string;
  email: string;
  contactNumber: string;
  district?: string;
  college: string;
  university?: string;
  degree?: string;
  department: string;
  subject?: string;
  session?: string;
  semester?: string;
  internshipDomain: string;
  internshipMode?: string;
  isPaid: boolean;
  hasPaid?: boolean;
  paymentStatus?: string;
  paymentVerifiedAt?: string;
  universityRoll?: string;
  universityRollNo?: string;
  industrialRegNo?: string;
  createdBySubUserId?: string | null;
  createdBySubUserName?: string | null;
  registrationDate: string;
  createdByEmitraId?: string | null;
  createdByEmitraName?: string | null;
}

interface Payment {
  userId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  amountPaise?: number;
  currency?: string;
  status: string;
  timestamp: string;
  createdByEmitraId?: string | null;
  createdByEmitraName?: string | null;
  verifiedBy?: string;
}

interface TeacherProfile {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  course?: string;
  districtIds?: string[];
  districtNames?: string[];
  createdAt?: string;
  isActive: boolean;
}

interface EmitraProfile {
  uid: string;
  centerName: string;
  ownerName: string;
  email: string;
  contactNumber: string;
  address: string;
  commissionPercentage: number;
  isActive: boolean;
  createdAt?: string;
}

interface College {
  id: string;
  name: string;
  districtId: string;
  price?: number;
}

interface District {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt?: string;
  isActive: boolean;
}

interface CourseReport {
  id: string;
  title: string;
  course: string;
  fileName: string;
  fileUrl: string;
  cloudinaryPublicId?: string;
  storagePath?: string;
  uploadedAt?: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface StudentReport {
  id: string;
  userId: string;
  studentName: string;
  email: string;
  course: string;
  assignmentId?: string;
  assignmentTitle?: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  type?: string;
  uploadedAt?: string;
}

interface CyberCafeSummary {
  id: string;
  name: string;
  totalStudents: number;
  successfulStudents: number;
  pendingStudents: number;
  paidAmount: number;
  colleges: Set<string>;
  domains: Set<string>;
}

interface CollegeCompleteReport {
  college: string;
  university: string;
  totalStudents: number;
  totalPayments: number;
  pendingPayments: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, adminProfile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [subUsers, setSubUsers] = useState<TeacherProfile[]>([]);
  const [emitras, setEmitras] = useState<EmitraProfile[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courseReports, setCourseReports] = useState<CourseReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [testSubmissions, setTestSubmissions] = useState<QuizSubmission[]>([]);
  const [courseTests, setCourseTests] = useState<any[]>([]);
  const [testCourseFilter, setTestCourseFilter] = useState('');
  const [viewingSubmission, setViewingSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [collegeFilter, setCollegeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [userSearchFilter, setUserSearchFilter] = useState('');
  const [userPaymentFilter, setUserPaymentFilter] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [reportCollegeFilter, setReportCollegeFilter] = useState('');
  const [reportUniversityFilter, setReportUniversityFilter] = useState('');
  const [reportPaymentFilter, setReportPaymentFilter] = useState('');
  const [cyberCafeSearch, setCyberCafeSearch] = useState('');
  const [cyberCafePaymentFilter, setCyberCafePaymentFilter] = useState('');
  const [cyberCafeCollegeFilter, setCyberCafeCollegeFilter] = useState('');
  const [cyberCafeDomainFilter, setCyberCafeDomainFilter] = useState('');
  const [exportCollege, setExportCollege] = useState('');
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [emailUser, setEmailUser] = useState<UserProfile | null>(null);
  const [emailForm, setEmailForm] = useState({ email: '' });
  const [savingEmail, setSavingEmail] = useState(false);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    gender: 'Male',
    parentName: '',
    contactNumber: '',
    district: '',
    college: '',
    university: 'Lalit Narayan Mithila University, Darbhanga',
    degree: 'UG',
    department: '',
    subject: '',
    session: '',
    semester: '',
    universityRoll: '',
    universityRollNo: '',
    industrialRegNo: '',
    internshipDomain: '',
    internshipMode: 'Online'
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [degreesList, setDegreesList] = useState<any[]>([]);
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    email: '',
    password: '',
    course: ''
  });
  const [subUserForm, setSubUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    districtIds: [] as string[]
  });
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: ''
  });
  const [reportForm, setReportForm] = useState<{
    title: string;
    course: string;
    file: File | null;
  }>({
    title: '',
    course: '',
    file: null
  });
  const [assignmentForm, setAssignmentForm] = useState<{
    title: string;
    course: string;
    description: string;
    file: File | null;
  }>({
    title: '',
    course: '',
    description: '',
    file: null
  });
  const [reportFileInputKey, setReportFileInputKey] = useState(0);
  const [assignmentFileInputKey, setAssignmentFileInputKey] = useState(0);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [savingSubUser, setSavingSubUser] = useState(false);
  const [deletingSubUserId, setDeletingSubUserId] = useState<string | null>(null);
  const [savingEmitraId, setSavingEmitraId] = useState<string | null>(null);
  const [savingNotification, setSavingNotification] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsPerPage, setAssignmentsPerPage] = useState(10);

  const [testSubmissionsPage, setTestSubmissionsPage] = useState(1);
  const [testSubmissionsPerPage, setTestSubmissionsPerPage] = useState(10);

  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);

  const [teachersPage, setTeachersPage] = useState(1);
  const [teachersPerPage, setTeachersPerPage] = useState(10);
  const [subUsersPage, setSubUsersPage] = useState(1);
  const [subUsersPerPage, setSubUsersPerPage] = useState(10);
  const isSubUser = adminProfile?.role === 'sub_user';
  const canManageAdminDashboard = !isSubUser;
  const canOperateDashboardPayments = adminProfile?.role !== 'teacher';
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');

  useEffect(() => {
    if (isSubUser && activeAdminTab !== 'dashboard') {
      setActiveAdminTab('dashboard');
    }
  }, [activeAdminTab, isSubUser]);

  // Reset pages when filters change
  useEffect(() => {
    setUsersPage(1);
  }, [collegeFilter, domainFilter, userSearchFilter, userPaymentFilter]);

  useEffect(() => {
    setUsersPage(1);
  }, [reportSearch, reportCollegeFilter, reportUniversityFilter, reportPaymentFilter]);

  useEffect(() => {
    setAssignmentsPage(1);
  }, [collegeFilter, domainFilter]);

  useEffect(() => {
    setTestSubmissionsPage(1);
  }, [testCourseFilter]);

  const PaginationControls = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    label
  }: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (size: number) => void;
    label: string;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 0) return null; // Keep visible even if 1 page to allow page size selection if totalItems > 10, wait! Let's check:
    // Actually, if totalPages <= 1 and totalItems <= 10, we can still hide it, but if totalItems > 10, they can choose to show 10!
    // So let's render it if totalItems > 10, or if totalPages > 1!
    if (totalPages <= 1 && totalItems <= 10) return null;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100/80 bg-slate-50/30">
        <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
          <span className="italic">
            Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} {label}
          </span>
          {onItemsPerPageChange && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-4">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="h-8 rounded-lg border border-slate-250 bg-white px-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-250 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            Prev
          </Button>
          {pages.map((p, idx) => (
            p === '...' ? (
              <span key={idx} className="px-2 text-slate-405 font-bold text-xs">...</span>
            ) : (
              <Button
                key={idx}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition active:scale-[0.98] ${currentPage === p
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                  : 'border border-slate-250 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {p}
              </Button>
            )
          ))}
          <Button
            type="button"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-250 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!adminProfile) return;

    fetchData();
  }, [user, adminProfile?.role]);

  const fetchData = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('registrationDate', 'desc'));
      const paymentsRef = collection(db, 'payments');

      if (isSubUser) {
        const [usersSnapshot, paymentsSnapshot, collegesSnapshot, coursesSnapshot, degreesSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(paymentsRef),
          getDocs(collection(db, 'colleges')),
          getDocs(collection(db, 'courses')).catch(() => null),
          getDocs(collection(db, 'degrees')).catch(() => null)
        ]);

        const usersData = usersSnapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
          .filter((student) => isCurrentInternshipUser(student) && student.createdBySubUserId === user.uid);
        const currentUserIds = new Set(usersData.map((student) => student.uid));
        setUsers(usersData);
        setColleges(collegesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College)));
        setPayments(paymentsSnapshot.docs
          .map(doc => doc.data() as Payment)
          .filter((payment) => currentUserIds.has(payment.userId)));
        if (coursesSnapshot) {
          setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        }
        if (degreesSnapshot) {
          setDegreesList(degreesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        }
        return;
      }

      const teachersQuery = query(collection(db, 'admins'), where('role', '==', 'teacher'));
      const subUsersQuery = query(collection(db, 'admins'), where('role', 'in', ['sub_user', 'district_user']));
      const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const reportsQuery = query(collection(db, 'courseReports'), orderBy('uploadedAt', 'desc'));
      const assignmentsQuery = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
      const collegesQuery = query(collection(db, 'colleges'));
      const districtsQuery = query(collection(db, 'districts'), orderBy('name'));

      const [
        usersSnapshot,
        paymentsSnapshot,
        teachersSnapshot,
        subUsersSnapshot,
        emitrasSnapshot,
        collegesSnapshot,
        districtsSnapshot,
        notificationsSnapshot,
        reportsSnapshot,
        assignmentsSnapshot,
        studentReportsResult,
        fallbackReportsResult,
        testSubmissionsResult,
        courseTestsResult,
        coursesSnapshot,
        degreesSnapshot
      ] = await Promise.all([
        getDocs(usersQuery),
        getDocs(paymentsRef),
        getDocs(teachersQuery),
        getDocs(subUsersQuery),
        getDocs(collection(db, 'emitras')),
        getDocs(collegesQuery),
        getDocs(districtsQuery),
        getDocs(notificationsQuery),
        getDocs(reportsQuery),
        getDocs(assignmentsQuery),
        getDocs(query(collection(db, 'studentReports'), orderBy('uploadedAt', 'desc'))).catch((error) => {
          console.error('Error fetching studentReports:', error);
          return null;
        }),
        getDocs(query(collection(db, 'submissions'), where('type', '==', 'studentReport'))).catch((error) => {
          console.error('Error fetching fallback submissions:', error);
          return null;
        }),
        getDocs(collection(db, 'testSubmissions')).catch((error) => {
          console.error('Error fetching testSubmissions:', error);
          return null;
        }),
        getDocs(collection(db, 'courseTests')).catch((error) => {
          console.error('Error fetching courseTests:', error);
          return null;
        }),
        getDocs(collection(db, 'courses')).catch((error) => {
          console.error('Error fetching courses:', error);
          return null;
        }),
        getDocs(collection(db, 'degrees')).catch((error) => {
          console.error('Error fetching degrees:', error);
          return null;
        })
      ]);

      const usersData = usersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        .filter(isCurrentInternshipUser);
      const currentUserIds = new Set(usersData.map((student) => student.uid));
      setUsers(usersData);

      const paymentsData = paymentsSnapshot.docs
        .map(doc => doc.data() as Payment)
        .filter((payment) => currentUserIds.has(payment.userId));
      setPayments(paymentsData);

      const teachersData = teachersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as TeacherProfile))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTeachers(teachersData);

      const subUsersData = subUsersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as TeacherProfile))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setSubUsers(subUsersData);

      const emitrasData = emitrasSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as EmitraProfile))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setEmitras(emitrasData);

      const collegesData = collegesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as College))
        .sort((a, b) => a.name.localeCompare(b.name));
      setColleges(collegesData);

      const districtsData = districtsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as District))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDistricts(districtsData);

      if (coursesSnapshot) {
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }

      if (degreesSnapshot) {
        setDegreesList(degreesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      }

      const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notificationsData);

      const reportsData = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseReport));
      setCourseReports(reportsData);

      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      setAssignments(assignmentsData);

      const studentReportsData: StudentReport[] = [];
      if (studentReportsResult) {
        studentReportsData.push(...studentReportsResult.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentReport)));
      }
      if (fallbackReportsResult) {
        studentReportsData.push(...fallbackReportsResult.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentReport)));
      }

      setStudentReports(
        studentReportsData
          .filter((report) => currentUserIds.has(report.userId))
          .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
      );

      if (testSubmissionsResult) {
        const testSubmissionsData = testSubmissionsResult.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter((submission) => currentUserIds.has(submission.userId));
        setTestSubmissions(testSubmissionsData);
      }

      if (courseTestsResult) {
        const courseTestsData = courseTestsResult.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setCourseTests(courseTestsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleBackupFirestore = async () => {
    if (backupLoading) return;

    setBackupLoading(true);
    try {
      const result = await backupFirestore();
      const skippedCount = result.skippedCollections.length;
      alert(
        skippedCount > 0
          ? `Backup downloaded. ${skippedCount} collection(s) could not be exported.`
          : 'Firestore backup downloaded successfully.'
      );
    } catch (error) {
      console.error('Error backing up Firestore:', error);
      alert(error instanceof Error ? error.message : 'Failed to backup Firestore.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleAddTeacher = async (event: React.FormEvent) => {
    event.preventDefault();

    const fullName = teacherForm.fullName.trim();
    const email = teacherForm.email.trim().toLowerCase();
    const password = teacherForm.password;
    const course = teacherForm.course;

    if (!fullName || !email || !password || !course) {
      alert('Please fill in teacher name, email, password, and course');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSavingTeacher(true);
    let createdTeacher: FirebaseUser | null = null;

    try {
      const teacherAppName = 'teacher-create-app';
      const teacherApp = getApps().some(app => app.name === teacherAppName)
        ? getApp(teacherAppName)
        : initializeApp(firebaseConfig, teacherAppName);
      const teacherAuth = getAuth(teacherApp);
      const credential = await createUserWithEmailAndPassword(teacherAuth, email, password);
      createdTeacher = credential.user;

      await setDoc(doc(db, 'admins', credential.user.uid), {
        uid: credential.user.uid,
        fullName,
        email,
        password: '',
        role: 'teacher',
        course,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || adminProfile?.email || 'admin'
      });

      await signOut(teacherAuth);
      setTeacherForm({ fullName: '', email: '', password: '', course: '' });
      fetchData();
      alert('Teacher added successfully');
    } catch (error: any) {
      if (createdTeacher) {
        await deleteUser(createdTeacher).catch((deleteError) => {
          console.error('Error cleaning up teacher auth user:', deleteError);
        });
      }
      console.error('Error adding teacher:', error);
      alert(error?.message || 'Error adding teacher');
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleAddSubUser = async (event: React.FormEvent) => {
    event.preventDefault();

    const fullName = subUserForm.fullName.trim();
    const email = subUserForm.email.trim().toLowerCase();
    const password = subUserForm.password;
    const selectedDistricts = districts.filter((district) => subUserForm.districtIds.includes(district.id));
    const districtIds = selectedDistricts.map((district) => district.id);
    const districtNames = selectedDistricts.map((district) => district.name);
    const role = districtIds.length > 0 ? 'district_user' : 'sub_user';

    if (!fullName || !email || !password) {
      alert('Please fill in sub user name, email, and password');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setSavingSubUser(true);
    let createdSubUser: FirebaseUser | null = null;

    try {
      const subUserAppName = 'sub-user-create-app';
      const subUserApp = getApps().some(app => app.name === subUserAppName)
        ? getApp(subUserAppName)
        : initializeApp(firebaseConfig, subUserAppName);
      const subUserAuth = getAuth(subUserApp);
      const credential = await createUserWithEmailAndPassword(subUserAuth, email, password);
      createdSubUser = credential.user;

      await setDoc(doc(db, 'admins', credential.user.uid), {
        uid: credential.user.uid,
        fullName,
        email,
        password: '',
        role,
        districtIds,
        districtNames,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || adminProfile?.email || 'admin'
      });

      await signOut(subUserAuth);
      setSubUserForm({ fullName: '', email: '', password: '', districtIds: [] });
      fetchData();
      alert(role === 'district_user' ? 'District user added successfully' : 'Sub user added successfully');
    } catch (error: any) {
      if (createdSubUser) {
        await deleteUser(createdSubUser).catch((deleteError) => {
          console.error('Error cleaning up sub user auth user:', deleteError);
        });
      }
      console.error('Error adding sub user:', error);
      alert(error?.message || 'Error adding sub user');
    } finally {
      setSavingSubUser(false);
    }
  };

  const handleDeleteSubUser = async (subUser: TeacherProfile) => {
    if (!confirm(`Delete sub user "${subUser.fullName || subUser.email}"? This will revoke their login access.`)) return;

    setDeletingSubUserId(subUser.uid);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('Admin session expired. Please login again.');

      const endpoints = [
        `/api/admin/sub-users/${encodeURIComponent(subUser.uid)}`,
        `/.netlify/functions/admin-sub-user?uid=${encodeURIComponent(subUser.uid)}`,
      ];
      let response: Response | null = null;
      let result: any = null;

      for (const endpoint of endpoints) {
        response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        result = await response.json().catch(() => null);

        if (response.ok || response.status !== 404) {
          break;
        }
      }

      if (!response?.ok) {
        if (response?.status === 404) {
          await deleteDoc(doc(db, 'admins', subUser.uid));
        } else {
          throw new Error(result?.details || result?.error || 'Unable to delete sub user');
        }
      }

      setSubUsers((prev) => prev.filter((item) => item.uid !== subUser.uid));
      alert(response?.ok ? 'Sub user deleted successfully' : 'Sub user removed from dashboard access');
    } catch (error: any) {
      console.error('Error deleting sub user:', error);
      alert(error?.message || 'Error deleting sub user');
    } finally {
      setDeletingSubUserId(null);
    }
  };

  const handleUpdateEmitraPercentage = async (emitraId: string, percentage: number) => {
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert('Percentage must be between 0 and 100');
      return;
    }

    setSavingEmitraId(emitraId);
    try {
      await updateDoc(doc(db, 'emitras', emitraId), {
        commissionPercentage: percentage
      });
      setEmitras((prev) =>
        prev.map((emitra) =>
          emitra.uid === emitraId ? { ...emitra, commissionPercentage: percentage } : emitra
        )
      );
      alert('Cyber cafe percentage updated');
    } catch (error: any) {
      console.error('Error updating Cyber cafe percentage:', error);
      alert(error?.message || 'Error updating Cyber cafe percentage');
    } finally {
      setSavingEmitraId(null);
    }
  };

  const handleAddNotification = async (event: React.FormEvent) => {
    event.preventDefault();

    const title = notificationForm.title.trim();
    const message = notificationForm.message.trim();

    if (!title || !message) {
      alert('Please fill in notification title and message');
      return;
    }

    setSavingNotification(true);

    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || adminProfile?.email || 'admin'
      });

      setNotificationForm({ title: '', message: '' });
      fetchData();
      alert('Notification added successfully');
    } catch (error: any) {
      console.error('Error adding notification:', error);
      alert(error?.message || 'Error adding notification');
    } finally {
      setSavingNotification(false);
    }
  };

  const handleUploadReport = async (event: React.FormEvent) => {
    event.preventDefault();

    const title = reportForm.title.trim();
    const course = reportForm.course;
    const file = reportForm.file;

    if (!title || !course || !file) {
      alert('Please select course, report title, and file');
      return;
    }

    setSavingReport(true);

    try {
      const cloudName = 'de6uqmt1m';
      const uploadPreset = 'hm8borsg';

      if (!cloudName || !uploadPreset) {
        alert('Cloudinary credentials are missing. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', uploadPreset);
      uploadData.append('folder', `internmitra/course-reports/${course.replace(/[^a-z0-9]+/gi, '_')}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Cloudinary upload failed');
      }

      const uploadResult = await response.json();

      await addDoc(collection(db, 'courseReports'), {
        title,
        course,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.uid || adminProfile?.email || 'admin'
      });

      setReportForm({ title: '', course: '', file: null });
      setReportFileInputKey((key) => key + 1);
      fetchData();
      alert('Course report uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading report:', error);
      alert(error?.message || 'Error uploading report');
    } finally {
      setSavingReport(false);
    }
  };

  const handleDeleteReport = async (report: CourseReport) => {
    if (!confirm(`Delete report "${report.title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'courseReports', report.id));
      fetchData();
      alert('Report deleted successfully');
    } catch (error: any) {
      console.error('Error deleting report:', error);
      alert(error?.message || 'Error deleting report');
    }
  };

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault();

    const title = assignmentForm.title.trim();
    const course = assignmentForm.course.trim();
    const description = assignmentForm.description.trim();
    const file = assignmentForm.file;

    if (!title) {
      alert('Please add assignment title');
      return;
    }

    if (!course) {
      alert('Please select assignment course');
      return;
    }

    setSavingAssignment(true);

    try {
      const assignmentPayload: Omit<Assignment, 'id'> = {
        title,
        course,
        description,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      if (file) {
        const cloudName = 'de6uqmt1m';
        const uploadPreset = 'hm8borsg';

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);
        uploadData.append('folder', `internmitra/assignments/${course.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
          method: 'POST',
          body: uploadData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Cloudinary upload failed');
        }

        const uploadResult = await response.json();
        assignmentPayload.fileName = file.name;
        assignmentPayload.fileUrl = uploadResult.secure_url;
        assignmentPayload.cloudinaryPublicId = uploadResult.public_id;
      }

      await addDoc(collection(db, 'assignments'), {
        ...assignmentPayload,
        createdBy: user?.uid || adminProfile?.email || 'admin'
      });

      setAssignmentForm({ title: '', course: '', description: '', file: null });
      setAssignmentFileInputKey((key) => key + 1);
      fetchData();
      alert('Assignment added successfully');
    } catch (error: any) {
      console.error('Error adding assignment:', error);
      alert(error?.message || 'Error adding assignment');
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!confirm(`Delete assignment "${assignment.title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'assignments', assignment.id));
      fetchData();
      alert('Assignment deleted successfully');
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      alert(error?.message || 'Error deleting assignment');
    }
  };

  const reconcileRazorpayPayments = async () => {
    setReconcileLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Admin session expired. Please login again.');

      const endpoints = ['/api/payment/reconcile', '/.netlify/functions/payment-reconcile'];
      let response: Response | null = null;
      let result: any = null;
      const endpointErrors: string[] = [];

      for (const endpoint of endpoints) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        result = await response.json().catch(() => null);

        if (response.ok) break;

        endpointErrors.push(
          `${endpoint} -> ${response.status}: ${result?.message || result?.details || result?.error || 'No details'}`
        );
      }

      if (!response || !response.ok) {
        const failureText = Array.isArray(result?.failures) && result.failures.length > 0
          ? ` Failures: ${result.failures.map((failure: any) => `${failure.orderId}: ${failure.message}`).join('; ')}`
          : '';
        throw new Error(
          `Sync failed (${response?.status || 'no response'}). ${result?.message || result?.details || result?.error || 'Unable to sync Razorpay payments'}${failureText}${endpointErrors.length ? `\n${endpointErrors.join('\n')}` : ''}`
        );
      }

      await fetchData();
      const failureText = Array.isArray(result.failures) && result.failures.length > 0
        ? `\nFailures: ${result.failures.map((failure: any) => `${failure.orderId}: ${failure.message}`).join('\n')}`
        : '';
      alert(
        `Razorpay sync complete. Checked ${result.checked || 0}, updated ${result.updated || 0}. ` +
        `Emails sent ${result.emailsSent || 0}, skipped ${result.emailsSkipped || 0}, failed ${result.emailsFailed || 0}.` +
        failureText
      );
    } catch (error) {
      console.error('Razorpay sync error:', error);
      alert(error instanceof Error ? error.message : 'Unable to sync Razorpay payments');
    } finally {
      setReconcileLoading(false);
    }
  };
  const updatePaymentStatus = async (
    userId: string
  ) => {

    try {

      // payment find
      const paymentQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId)
      );

      const paymentSnapshot = await getDocs(paymentQuery);

      // agar payment already h
      if (!paymentSnapshot.empty) {

        paymentSnapshot.forEach(async (paymentDoc) => {

          await updateDoc(
            doc(db, 'payments', paymentDoc.id),
            {
              status: 'success',
              paymentMethod: 'manual',
              source: 'manual_admin',
              verifiedBy: user?.uid || adminProfile?.email || 'admin'
            }
          );

        });

      } else {

        // new payment entry create
        // user document get
        const userDocRef = doc(db, 'users', userId);

        const userDocSnap = await getDoc(userDocRef);

        let amount = 1000;

        let createdByEmitraId = null;
        let createdByEmitraName = null;

        if (userDocSnap.exists()) {

          const userData = userDocSnap.data();
          createdByEmitraId = userData.createdByEmitraId || null;
          createdByEmitraName = userData.createdByEmitraName || null;

          // college find
          const collegesQuery = await getDocs(
            collection(db, 'colleges')
          );

          const collegeData = collegesQuery.docs.find(
            (c) => c.data().name === userData.college
          );

          if (collegeData) {
            amount = collegeData.data().price || 1000;
          }
        }

        // payment entry create
        await addDoc(
          collection(db, 'payments'),
          {
            userId: userId,
            createdByEmitraId,
            createdByEmitraName,
            razorpayOrderId: `manual_order_${Date.now()}`,
            razorpayPaymentId: `manual_pay_${Date.now()}`,
            amount: amount,
            status: 'success',
            paymentMethod: 'manual',
            source: 'manual_admin',
            verifiedBy: user?.uid || adminProfile?.email || 'admin',
            timestamp: new Date().toISOString()
          }
        );

      }

      // user find
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId)
      );

      const userSnapshot = await getDocs(userQuery);

      userSnapshot.forEach(async (userDoc) => {
        const userData = userDoc.data();
        await updateDoc(
          doc(db, 'users', userDoc.id),
          {
            isPaid: true,
            hasPaid: true,
            paymentStatus: 'success',
            paymentVerifiedAt: new Date().toISOString(),
            paymentMethod: 'manual',
            paymentSource: 'manual_admin'
          }
        );

        if (userData?.universityRoll) {
          try {
            const importedQuery = query(
              collection(db, 'importedStudents'),
              where('universityRoll', '==', userData.universityRoll)
            );
            const importedSnap = await getDocs(importedQuery);
            importedSnap.forEach(async (importedDoc) => {
              await updateDoc(doc(db, 'importedStudents', importedDoc.id), {
                paymentStatus: 'success',
                paymentVerifiedAt: new Date().toISOString()
              });
            });
          } catch (syncErr) {
            console.error("Sync error for manual payment confirm:", syncErr);
          }
        }
      });

      alert('Payment verified successfully');

      fetchData();

    } catch (error) {

      console.error(error);

      alert('Error verifying payment');
    }
  };

  const rejectPaymentStatus = async (userId: string) => {
    try {

      // payment find
      const paymentQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId)
      );

      const paymentSnapshot = await getDocs(paymentQuery);

      // payment records delete
      paymentSnapshot.forEach(async (paymentDoc) => {
        await deleteDoc(
          doc(db, 'payments', paymentDoc.id)
        );
      });

      // user find
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId)
      );

      const userSnapshot = await getDocs(userQuery);

      userSnapshot.forEach(async (userDoc) => {
        await updateDoc(
          doc(db, 'users', userDoc.id),
          {
            isPaid: false,
            hasPaid: false,
            paymentStatus: 'rejected',
            paymentRejectedAt: new Date().toISOString(),
            paymentVerifiedAt: null,
            razorpayOrderId: null,
            razorpayPaymentId: null
          }
        );
      });

      alert('Payment rejected successfully');

      fetchData();

    } catch (error) {

      console.error(error);

      alert('Error rejecting payment');
    }
  };

  const openPasswordModal = (student: UserProfile) => {
    setPasswordUser(student);
    setPasswordForm({ password: '', confirmPassword: '' });
  };

  const openEmailModal = (student: UserProfile) => {
    setEmailUser(student);
    setEmailForm({ email: student.email || '' });
  };

  const handleUpdateUserPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordUser || !user) return;

    if (passwordForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/users/${passwordUser.uid}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: passwordUser.uid, password: passwordForm.password }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.details || result?.error || 'Error updating password');
      }

      setPasswordUser(null);
      setPasswordForm({ password: '', confirmPassword: '' });
      alert('Password updated successfully');
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert(error?.message || 'Error updating password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateUserEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailUser || !user) return;

    const nextEmail = emailForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      alert('Enter a valid email address');
      return;
    }

    setSavingEmail(true);
    try {
      const token = await user.getIdToken();
      const endpoints = [
        `/api/admin/users/${emailUser.uid}/email`,
        `/.netlify/functions/admin-user-email?uid=${encodeURIComponent(emailUser.uid)}`,
      ];
      let response: Response | null = null;
      let result: any = null;

      for (const endpoint of endpoints) {
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: emailUser.uid, email: nextEmail }),
        });
        result = await response.json().catch(() => null);
        if (response.ok || response.status !== 404) break;
      }

      if (!response?.ok) {
        throw new Error(result?.details || result?.error || 'Error updating email');
      }

      setUsers((currentUsers) =>
        currentUsers.map((student) =>
          student.uid === emailUser.uid ? { ...student, email: nextEmail } : student
        )
      );
      setEmailUser(null);
      setEmailForm({ email: '' });
      alert('Email updated successfully');
    } catch (error: any) {
      console.error('Error updating email:', error);
      alert(error?.message || 'Error updating email');
    } finally {
      setSavingEmail(false);
    }
  };

  const openProfileModal = (student: UserProfile) => {
    setProfileUser(student);
    setProfileForm({
      fullName: student.fullName || '',
      gender: student.gender || 'Male',
      parentName: student.parentName || '',
      contactNumber: student.contactNumber || '',
      district: student.district || '',
      college: student.college || '',
      university: student.university || 'Lalit Narayan Mithila University, Darbhanga',
      degree: student.degree || 'UG',
      department: student.department || '',
      subject: student.subject || '',
      session: student.session || '',
      semester: student.semester || '',
      universityRoll: student.universityRoll || '',
      universityRollNo: student.universityRollNo || '',
      industrialRegNo: student.industrialRegNo || '',
      internshipDomain: student.internshipDomain || '',
      internshipMode: student.internshipMode || 'Online'
    });
  };

  const handleUpdateUserProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profileUser || !user) return;

    const {
      fullName,
      gender,
      parentName,
      contactNumber,
      district,
      college,
      university,
      degree,
      department,
      subject,
      session,
      semester,
      internshipDomain
    } = profileForm;

    if (!fullName.trim()) {
      alert('Full Legal Name is required');
      return;
    }
    if (!gender) {
      alert('Gender is required');
      return;
    }
    if (!parentName.trim()) {
      alert('Father / Mother / Guardian Name is required');
      return;
    }

    // Normalize phone number (extract digits, handle 91 prefix)
    const digits = contactNumber.replace(/\D/g, '');
    let finalPhone = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
      finalPhone = digits.slice(2);
    } else if (digits.length > 10) {
      finalPhone = digits.slice(0, 10);
    }

    if (!/^[6-9]\d{9}$/.test(finalPhone)) {
      alert('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    if (!district) {
      alert('District is required');
      return;
    }
    if (!college) {
      alert('College is required');
      return;
    }
    if (!university) {
      alert('University is required');
      return;
    }
    if (!degree) {
      alert('Degree is required');
      return;
    }
    if (!department) {
      alert('Department is required');
      return;
    }
    if (!subject.trim()) {
      alert('Subject is required');
      return;
    }
    if (!session) {
      alert('Session is required');
      return;
    }
    if (!semester) {
      alert('Semester is required');
      return;
    }
    if (!internshipDomain) {
      alert('Internship Domain is required');
      return;
    }

    const finalForm = {
      ...profileForm,
      contactNumber: finalPhone
    };

    setSavingProfile(true);
    try {
      const token = await user.getIdToken();
      const endpoints = [
        `/api/admin/users/${profileUser.uid}/profile`,
        `/.netlify/functions/admin-user-profile?uid=${encodeURIComponent(profileUser.uid)}`,
      ];
      let response: Response | null = null;
      let result: any = null;

      for (const endpoint of endpoints) {
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: profileUser.uid, ...finalForm }),
        });
        result = await response.json().catch(() => null);
        if (response.ok || response.status !== 404) break;
      }

      if (!response?.ok) {
        throw new Error(result?.details || result?.error || 'Error updating profile');
      }

      setUsers((currentUsers) =>
        currentUsers.map((student) =>
          student.uid === profileUser.uid ? { ...student, ...finalForm } : student
        )
      );
      setProfileUser(null);
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error?.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const getGroupName = (value?: string) => value?.trim() || 'Not specified';

  const successfulUserIds = new Set(
    payments
      .filter((payment) => payment.status === 'success' && payment.userId)
      .map((payment) => payment.userId)
  );

  const isUserSuccessful = (user: UserProfile) =>
    Boolean(user.isPaid || user.hasPaid || user.paymentStatus === 'success' || successfulUserIds.has(user.uid));

  const uniqueColleges = [
    ...new Set(users.map(user => getGroupName(user.college)))
  ].sort();

  const uniqueUniversities = [
    ...new Set(users.map(user => getGroupName(user.university)))
  ].sort();

  const uniqueDomains = [
    ...new Set(users.map(user => getGroupName(user.internshipDomain)))
  ].sort();

  const getStudentProfile = (userId: string) => users.find((student) => student.uid === userId);
  const getAssignmentTitle = (report: StudentReport) =>
    report.assignmentTitle ||
    assignments.find((assignment) => assignment.id === report.assignmentId)?.title ||
    'Legacy upload';

  const visibleStudentReports = studentReports.filter((report) => {
    const student = getStudentProfile(report.userId);
    const collegeMatch =
      !collegeFilter ||
      getGroupName(student?.college) === collegeFilter;

    const domainMatch =
      !domainFilter ||
      getGroupName(report.course || student?.internshipDomain) === domainFilter;

    return collegeMatch && domainMatch;
  });

  const filteredUsers = users.filter(user => {
    const searchValue = userSearchFilter.trim().toLowerCase();
    const searchMatch =
      !searchValue ||
      [
        user.fullName,
        user.email,
        user.contactNumber,
        user.college,
        user.department,
        user.internshipDomain,
        user.universityRoll,
        user.universityRollNo,
        user.createdByEmitraName,
        user.createdBySubUserName,
      ].join(' ').toLowerCase().includes(searchValue);


    const collegeMatch =
      !collegeFilter ||
      getGroupName(user.college) === collegeFilter;

    const domainMatch =
      !domainFilter ||
      getGroupName(user.internshipDomain) === domainFilter;

    const paymentMatch =
      !userPaymentFilter ||
      (userPaymentFilter === 'success' ? isUserSuccessful(user) : !isUserSuccessful(user));

    return searchMatch && collegeMatch && domainMatch && paymentMatch;
  });
  const successfulUsers = users.filter(isUserSuccessful);
  const subUserRegisteredUsers = isSubUser ? users : users.filter((student) => student.createdBySubUserId === adminProfile?.uid);

  const collegeCount = filteredUsers.reduce<Record<string, number>>(
    (acc, user) => {
      const college = getGroupName(user.college);

      acc[college] =
        (acc[college] || 0) + 1;

      return acc;

    },
    {}
  );

  const domainCount = filteredUsers.reduce<Record<string, number>>(
    (acc, user) => {
      const domain = getGroupName(user.internshipDomain);

      acc[domain] =
        (acc[domain] || 0) + 1;

      return acc;

    },
    {}
  );
  // Calculate payment statistics
  const successfulUsersCount = successfulUsers.length;
  const pendingUsersCount = users.length - successfulUsersCount;
  const formatCompactRupees = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(amount >= 100000000 ? 1 : 2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount >= 1000000 ? 1 : 2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  const successfulPaymentsByUser = payments
    .filter((payment) => payment.status === 'success' && payment.userId)
    .reduce<Record<string, number>>((acc, payment) => {
      acc[payment.userId] = (acc[payment.userId] || 0) + (payment.amount || 0);
      return acc;
    }, {});

  const getUserSuccessfulPaymentAmount = (student: UserProfile) => {
    const paymentAmount = successfulPaymentsByUser[student.uid] || 0;
    if (paymentAmount > 0) return paymentAmount;

    if (!isUserSuccessful(student)) return 0;

    const matchedCollege = colleges.find((college) => college.name === student.college);
    return matchedCollege?.price || 0;
  };
  const totalAmount = successfulUsers.reduce((sum, student) => sum + getUserSuccessfulPaymentAmount(student), 0);

  const reportFilteredUsers = users.filter((student) => {
    const paymentSuccess = isUserSuccessful(student);
    const searchValue = reportSearch.trim().toLowerCase();
    const searchTarget = [
      student.fullName,
      student.email,
      student.contactNumber,
      student.college,
      student.university,
      student.department,
      student.internshipDomain,
      student.universityRoll,
    ].join(' ').toLowerCase();

    const searchMatch = !searchValue || searchTarget.includes(searchValue);
    const collegeMatch = !reportCollegeFilter || getGroupName(student.college) === reportCollegeFilter;
    const universityMatch = !reportUniversityFilter || getGroupName(student.university) === reportUniversityFilter;
    const paymentMatch =
      !reportPaymentFilter ||
      (reportPaymentFilter === 'success' && paymentSuccess) ||
      (reportPaymentFilter === 'pending' && !paymentSuccess);

    return searchMatch && collegeMatch && universityMatch && paymentMatch;
  });

  const completeReportTotals = reportFilteredUsers.reduce(
    (acc, student) => {
      const paymentSuccess = isUserSuccessful(student);
      acc.totalStudents += 1;
      acc.totalPayments += paymentSuccess ? 1 : 0;
      acc.pendingPayments += paymentSuccess ? 0 : 1;
      acc.totalRevenue += getUserSuccessfulPaymentAmount(student);
      return acc;
    },
    { totalStudents: 0, totalPayments: 0, pendingPayments: 0, totalRevenue: 0 }
  );

  const collegeCompleteReportMap = reportFilteredUsers.reduce<Record<string, CollegeCompleteReport>>((acc, student) => {
      const college = getGroupName(student.college);
      const university = getGroupName(student.university);
      const key = `${college}__${university}`;

      if (!acc[key]) {
        acc[key] = {
          college,
          university,
          totalStudents: 0,
          totalPayments: 0,
          pendingPayments: 0,
          totalRevenue: 0,
        };
      }

      const paymentSuccess = isUserSuccessful(student);
      acc[key].totalStudents += 1;
      acc[key].totalPayments += paymentSuccess ? 1 : 0;
      acc[key].pendingPayments += paymentSuccess ? 0 : 1;
      acc[key].totalRevenue += getUserSuccessfulPaymentAmount(student);
      return acc;
    }, {});

  const collegeCompleteReport: CollegeCompleteReport[] = Object.keys(collegeCompleteReportMap)
    .map((key) => collegeCompleteReportMap[key])
    .sort((a, b) => b.totalStudents - a.totalStudents || a.college.localeCompare(b.college));

  const exportCompleteReportExcel = () => {
    const formatExportDate = (value?: string) => {
      if (!value) return '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleString('en-IN');
    };

    const getStudentSuccessfulPayments = (studentId: string) =>
      payments
        .filter((payment) => payment.userId === studentId && payment.status === 'success')
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    const getStudentLatestSuccessfulPayment = (studentId: string) =>
      getStudentSuccessfulPayments(studentId)[0];

    const applyColumnWidths = (sheet: XLSX.WorkSheet, widths: number[]) => {
      sheet['!cols'] = widths.map((wch) => ({ wch }));
    };

    const generatedAt = new Date().toLocaleString('en-IN');
    const summaryRows = [
      ['InternMitra Admin Complete Report'],
      ['Generated At', generatedAt],
      ['College Filter', reportCollegeFilter || 'All Colleges'],
      ['University Filter', reportUniversityFilter || 'All Universities'],
      ['Payment Filter', reportPaymentFilter || 'All Payments'],
      ['Search', reportSearch || ''],
      [],
      ['Total Students', completeReportTotals.totalStudents],
      ['Total Payments', completeReportTotals.totalPayments],
      ['Pending Payments', completeReportTotals.pendingPayments],
      ['Total Revenue (INR)', completeReportTotals.totalRevenue],
      [],
      ['Note', 'Revenue is counted from successful payment records. If a paid student has no payment record, college fee is used as fallback.'],
    ];

    const collegeRows = collegeCompleteReport.map((row) => ({
      College: row.college,
      University: row.university,
      'Total Students': row.totalStudents,
      'Paid Students': row.totalPayments,
      'Pending Payments': row.pendingPayments,
      'Total Revenue (INR)': row.totalRevenue,
    }));

    const studentRows = reportFilteredUsers.map((student, index) => {
      const paymentSuccess = isUserSuccessful(student);
      const successfulPayment = getStudentLatestSuccessfulPayment(student.uid);
      const studentRevenue = getUserSuccessfulPaymentAmount(student);

      return {
        'S.No.': index + 1,
        'Student ID': student.uid,
        'Student Name': student.fullName || '',
        'Father/Parent Name': student.parentName || '',
        Gender: student.gender || '',
        Email: student.email || '',
        'Mobile Number': student.contactNumber || '',
        District: student.district || '',
        College: student.college || '',
        University: student.university || '',
        Degree: student.degree || '',
        Department: student.department || '',
        Subject: student.subject || '',
        Session: student.session || '',
        Semester: student.semester || '',
        'University Roll': student.universityRoll || '',
        'Internship Domain': student.internshipDomain || '',
        'Internship Mode': student.internshipMode || '',
        'Payment Status': paymentSuccess ? 'Success' : 'Pending',
        'Student Payment Field': student.paymentStatus || '',
        'Revenue (INR)': studentRevenue,
        'Latest Razorpay Order ID': successfulPayment?.razorpayOrderId || '',
        'Latest Razorpay Payment ID': successfulPayment?.razorpayPaymentId || '',
        Currency: successfulPayment?.currency || (studentRevenue > 0 ? 'INR' : ''),
        'Payment Verified At': formatExportDate(student.paymentVerifiedAt || successfulPayment?.timestamp),
        'Registration Date': formatExportDate(student.registrationDate),
        Source: student.createdByEmitraId ? 'Cyber Cafe' : student.createdBySubUserId ? 'Sub User' : 'Direct',
        'Cyber Cafe ID': student.createdByEmitraId || '',
        'Cyber Cafe Name': student.createdByEmitraName || '',
        'Sub User ID': student.createdBySubUserId || '',
        'Sub User Name': student.createdBySubUserName || '',
      };
    });

    const paymentRows = payments
      .filter((payment) => {
        const student = users.find((profile) => profile.uid === payment.userId);
        return Boolean(student && reportFilteredUsers.some((filteredStudent) => filteredStudent.uid === student.uid));
      })
      .map((payment, index) => {
        const student = users.find((profile) => profile.uid === payment.userId);

        return {
          'S.No.': index + 1,
          'Student ID': payment.userId || '',
          'Student Name': student?.fullName || '',
          Email: student?.email || '',
          College: student?.college || '',
          University: student?.university || '',
          'Payment Status': payment.status || '',
          'Amount (INR)': payment.amount || 0,
          'Amount Paise': payment.amountPaise || '',
          Currency: payment.currency || 'INR',
          'Razorpay Order ID': payment.razorpayOrderId || '',
          'Razorpay Payment ID': payment.razorpayPaymentId || '',
          'Payment Date': formatExportDate(payment.timestamp),
          'Cyber Cafe ID': payment.createdByEmitraId || student?.createdByEmitraId || '',
          'Cyber Cafe Name': payment.createdByEmitraName || student?.createdByEmitraName || '',
          'Verified By': payment.verifiedBy || '',
        };
      });

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    const collegeSheet = XLSX.utils.json_to_sheet(collegeRows);
    const studentSheet = XLSX.utils.json_to_sheet(studentRows);
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentRows);

    applyColumnWidths(summarySheet, [28, 70]);
    applyColumnWidths(collegeSheet, [42, 36, 16, 16, 18, 20]);
    applyColumnWidths(studentSheet, [8, 26, 28, 28, 14, 30, 16, 18, 42, 36, 14, 22, 20, 14, 14, 22, 24, 18, 18, 18, 20, 30, 30, 12, 24, 24, 14, 24, 24]);
    applyColumnWidths(paymentsSheet, [8, 26, 28, 30, 42, 36, 18, 16, 14, 12, 30, 30, 24, 24, 24, 24]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, collegeSheet, 'College Revenue');
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Student Data');
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payment Data');
    XLSX.writeFile(workbook, `InternMitra_Admin_Report_${Date.now()}.xlsx`);
  };
  const emitraStudentsCount = users.filter((student) => student.createdByEmitraId).length;

  const cyberCafeStudents = users.filter((student) => {
    if (!student.createdByEmitraId) return false;

    const paymentMatch =
      !cyberCafePaymentFilter ||
      (cyberCafePaymentFilter === 'success' && isUserSuccessful(student)) ||
      (cyberCafePaymentFilter === 'pending' && !isUserSuccessful(student));

    const collegeMatch =
      !cyberCafeCollegeFilter ||
      getGroupName(student.college) === cyberCafeCollegeFilter;

    const domainMatch =
      !cyberCafeDomainFilter ||
      getGroupName(student.internshipDomain) === cyberCafeDomainFilter;

    const searchText = [
      student.createdByEmitraName,
      student.createdByEmitraId,
      student.fullName,
      student.email,
      student.college,
      student.internshipDomain,
    ].join(' ').toLowerCase();
    const searchMatch = !cyberCafeSearch.trim() || searchText.includes(cyberCafeSearch.trim().toLowerCase());

    return paymentMatch && collegeMatch && domainMatch && searchMatch;
  });

  const cyberCafeSummaryMap = cyberCafeStudents.reduce<Record<string, CyberCafeSummary>>((acc, student) => {
    const id = student.createdByEmitraId || 'unknown';
    if (!acc[id]) {
      acc[id] = {
        id,
        name: student.createdByEmitraName || id,
        totalStudents: 0,
        successfulStudents: 0,
        pendingStudents: 0,
        paidAmount: 0,
        colleges: new Set<string>(),
        domains: new Set<string>(),
      };
    }

    const successful = isUserSuccessful(student);
    acc[id].totalStudents += 1;
    acc[id].successfulStudents += successful ? 1 : 0;
    acc[id].pendingStudents += successful ? 0 : 1;
    acc[id].paidAmount += successfulPaymentsByUser[student.uid] || 0;
    acc[id].colleges.add(getGroupName(student.college));
    acc[id].domains.add(getGroupName(student.internshipDomain));

    return acc;
  }, {});

  const cyberCafeSummary: CyberCafeSummary[] = Object.keys(cyberCafeSummaryMap)
    .map((id) => cyberCafeSummaryMap[id])
    .sort((a, b) => b.totalStudents - a.totalStudents || b.paidAmount - a.paidAmount);

  const cyberCafeTotals = cyberCafeSummary.reduce(
    (acc, cafe) => ({
      totalStudents: acc.totalStudents + cafe.totalStudents,
      successfulStudents: acc.successfulStudents + cafe.successfulStudents,
      pendingStudents: acc.pendingStudents + cafe.pendingStudents,
      paidAmount: acc.paidAmount + cafe.paidAmount,
    }),
    { totalStudents: 0, successfulStudents: 0, pendingStudents: 0, paidAmount: 0 }
  );

  const getEmitraStudents = (emitraId: string) =>
    users.filter((student) => student.createdByEmitraId === emitraId);

  const getEmitraPaymentTotal = (emitraId: string) => {
    const studentIds = new Set(getEmitraStudents(emitraId).map((student) => student.uid));
    return payments
      .filter((payment) => payment.status === 'success' && studentIds.has(payment.userId))
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  // Get payment status for a user
  const getUserPaymentStatus = (userId: string) => {
    const tableUser = users.find((profile) => profile.uid === userId);
    if (tableUser && isUserSuccessful(tableUser)) {
      return { status: 'Success', class: 'bg-green-100 text-green-700' };
    }

    const userPayment = payments.find(p => p.userId === userId);
    if (!userPayment) return { status: 'Pending', class: 'bg-yellow-100 text-yellow-700' };
    return { status: 'Pending', class: 'bg-yellow-100 text-yellow-700' };
  };

  const exportCollegeStudentsPdf = () => {
    if (!exportCollege) {
      alert('Please select a college');
      return;
    }

    const collegeStudents = users.filter(user =>
      getGroupName(user.college) === exportCollege &&
      isUserSuccessful(user)
    );

    if (collegeStudents.length === 0) {
      alert('No successful payment students found for this college');
      return;
    }

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const generatedAt = new Date().toLocaleString('en-IN');

    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, 297, 24, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('INTERNMITRA COLLEGE STUDENT REPORT', 148, 15, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(13);
    pdf.text(exportCollege, 14, 38);
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Successful Payment Students: ${collegeStudents.length}`, 14, 46);
    pdf.text(`Generated: ${generatedAt}`, 14, 53);

    autoTable(pdf, {
      startY: 62,
      head: [['Name', 'Email', 'Phone', 'Department', 'Domain', 'Payment', 'Registered']],
      body: collegeStudents.map(student => [
        student.fullName || '-',
        student.email || '-',
        student.contactNumber || '-',
        student.department || '-',
        student.internshipDomain || '-',
        'Success',
        student.registrationDate
          ? new Date(student.registrationDate).toLocaleDateString('en-IN')
          : '-'
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    pdf.save(`InternMitra_${exportCollege.replace(/[^a-z0-9]/gi, '_')}_Students.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Dialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open && !savingPassword) {
            setPasswordUser(null);
            setPasswordForm({ password: '', confirmPassword: '' });
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <form onSubmit={handleUpdateUserPassword} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="font-black text-slate-900">Change Password</DialogTitle>
              <DialogDescription>
                Update password for {passwordUser?.fullName || passwordUser?.email || 'selected user'}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs font-black uppercase">New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
                  className="h-12 rounded-xl font-bold"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-500 text-xs font-black uppercase">Confirm Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  className="h-12 rounded-xl font-bold"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={savingPassword}
                onClick={() => {
                  setPasswordUser(null);
                  setPasswordForm({ password: '', confirmPassword: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingPassword} className="bg-slate-900 hover:bg-blue-700 text-white font-black">
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(emailUser)}
        onOpenChange={(open) => {
          if (!open && !savingEmail) {
            setEmailUser(null);
            setEmailForm({ email: '' });
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <form onSubmit={handleUpdateUserEmail} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="font-black text-slate-900">Change Email</DialogTitle>
              <DialogDescription>
                Update login email for {emailUser?.fullName || emailUser?.email || 'selected user'}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label className="text-slate-500 text-xs font-black uppercase">New Email</Label>
              <Input
                type="email"
                value={emailForm.email}
                onChange={(event) => setEmailForm({ email: event.target.value })}
                className="h-12 rounded-xl font-bold"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={savingEmail}
                onClick={() => {
                  setEmailUser(null);
                  setEmailForm({ email: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingEmail} className="bg-slate-900 hover:bg-blue-700 text-white font-black">
                {savingEmail ? 'Updating...' : 'Update Email'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(profileUser)}
        onOpenChange={(open) => {
          if (!open && !savingProfile) {
            setProfileUser(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] md:max-w-4xl sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto rounded-[2rem] p-4 sm:p-8">
          <form onSubmit={handleUpdateUserProfile} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center justify-between uppercase italic">
                <span>Edit Profile</span>
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                Update user profile details for {profileUser?.fullName || profileUser?.email || 'selected user'}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details Section */}
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-black text-xs uppercase tracking-wider text-blue-600 border-b pb-2">Personal Details</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">Full Legal Name</Label>
                    <Input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="h-10 rounded-xl font-bold bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">Gender</Label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    >
                      {GENDERS.map((gender) => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">Father / Mother / Guardian Name</Label>
                    <Input
                      type="text"
                      value={profileForm.parentName}
                      onChange={(e) => setProfileForm({ ...profileForm, parentName: e.target.value })}
                      className="h-10 rounded-xl font-bold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">Contact Number</Label>
                    <Input
                      type="text"
                      value={profileForm.contactNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                      className="h-10 rounded-xl font-bold bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Academic Details Section */}
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-black text-xs uppercase tracking-wider text-indigo-600 border-b pb-2">Academic Details</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">University</Label>
                    <select
                      value={profileForm.university}
                      onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    >
                      {UNIVERSITIES.map((uni) => (
                        <option key={uni} value={uni}>{uni}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">District</Label>
                    <select
                      value={profileForm.district}
                      onChange={(e) => {
                        const newDistrict = e.target.value;
                        setProfileForm({
                          ...profileForm,
                          district: newDistrict,
                          college: ''
                        });
                      }}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">College</Label>
                    <select
                      value={profileForm.college}
                      onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    >
                      <option value="">Select College</option>
                      {colleges
                        .filter((c) => {
                          const dist = districts.find((d) => d.name === profileForm.district);
                          return dist ? c.districtId === dist.id : false;
                        })
                        .map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Degree</Label>
                      <select
                        value={profileForm.degree}
                        onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                      >
                        {DEGREES.map((deg) => (
                          <option key={deg} value={deg}>{deg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Department</Label>
                      <select
                        value={profileForm.department}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          setProfileForm({
                            ...profileForm,
                            department: newDept,
                            subject: ''
                          });
                        }}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                      >
                        <option value="">Select Department</option>
                        {degreesList.length > 0
                          ? degreesList.map((d) => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))
                          : Object.keys(DEPARTMENTS).map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Subject</Label>
                      <select
                        value={profileForm.subject}
                        onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                      >
                        <option value="">Select Subject</option>
                        {(() => {
                          const matchedDegree = degreesList.find(d => d.name === profileForm.department);
                          const subjects = matchedDegree?.subjects || DEPARTMENTS[profileForm.department] || [];
                          return subjects.map((sub: string) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Session</Label>
                      <select
                        value={profileForm.session}
                        onChange={(e) => setProfileForm({ ...profileForm, session: e.target.value })}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                      >
                        <option value="">Select Session</option>
                        {SESSIONS.map((sess) => (
                          <option key={sess} value={sess}>{sess}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-500 text-[10px] font-black uppercase">Semester</Label>
                    <select
                      value={profileForm.semester}
                      onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Univ Reg No</Label>
                      <Input
                        type="text"
                        value={profileForm.universityRoll}
                        onChange={(e) => setProfileForm({ ...profileForm, universityRoll: e.target.value })}
                        className="h-10 rounded-xl font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Univ Roll No</Label>
                      <Input
                        type="text"
                        value={profileForm.universityRollNo}
                        onChange={(e) => setProfileForm({ ...profileForm, universityRollNo: e.target.value })}
                        className="h-10 rounded-xl font-bold bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-500 text-[10px] font-black uppercase">Industrial Reg No</Label>
                      <Input
                        type="text"
                        value={profileForm.industrialRegNo}
                        onChange={(e) => setProfileForm({ ...profileForm, industrialRegNo: e.target.value })}
                        className="h-10 rounded-xl font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internship Section */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-black text-xs uppercase tracking-wider text-emerald-600 border-b pb-2">Internship Program Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-500 text-[10px] font-black uppercase">Internship Domain</Label>
                  <select
                    value={profileForm.internshipDomain}
                    onChange={(e) => setProfileForm({ ...profileForm, internshipDomain: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                    required
                  >
                    <option value="">Select Domain</option>
                    {(courses.length > 0 ? courses.map(c => c.name) : INTERNSHIP_DOMAINS).map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-500 text-[10px] font-black uppercase">Internship Mode</Label>
                  <select
                    value={profileForm.internshipMode}
                    onChange={(e) => setProfileForm({ ...profileForm, internshipMode: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={savingProfile}
                onClick={() => setProfileUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700 text-white font-black">
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingSubmission)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSubmission(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center justify-between uppercase italic">
              <span>Test Details - {viewingSubmission?.studentName}</span>
              <span className={`px-4 py-1 rounded-full text-xs font-black tracking-widest ${(viewingSubmission?.scorePercentage ?? 0) >= 33
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}>
                {(viewingSubmission?.scorePercentage ?? 0) >= 33 ? 'PASSED' : 'FAILED'}
              </span>
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              Course: <span className="text-slate-900">{viewingSubmission?.course}</span> | Email: <span className="text-slate-900">{viewingSubmission?.email}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Score</p>
              <p className="text-2xl font-black text-blue-600">{viewingSubmission?.scorePercentage}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Total Questions</p>
              <p className="text-2xl font-black text-slate-700">{viewingSubmission?.totalQuestions}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Correct</p>
              <p className="text-2xl font-black text-green-600">{viewingSubmission?.correctCount}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400">Wrong</p>
              <p className="text-2xl font-black text-red-600">{viewingSubmission?.wrongCount}</p>
            </div>
          </div>

          {/* Warning for modified tests */}
          {(() => {
            if (!viewingSubmission) return null;
            const matchingTest = courseTests.find(t => t.course === viewingSubmission.course);
            if (!matchingTest || !matchingTest.questions) return null;

            const studentAnswerKeys = Object.keys(viewingSubmission.answers || {});
            const currentQuestionIds = new Set(matchingTest.questions.map((q: any) => q.id));
            const deletedQuestionIds = studentAnswerKeys.filter(id => !currentQuestionIds.has(id));

            if (deletedQuestionIds.length === 0) return null;

            return (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl mb-6 text-sm font-bold flex items-start gap-3 shadow-sm">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-black text-amber-950 uppercase tracking-wide text-xs">Test Questions Have Been Modified</p>
                  <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
                    The admin has added, modified, or deleted {deletedQuestionIds.length} question(s) in this course test since the student submitted their answers.
                    Because the test questions were changed, some of the student's answered questions are no longer present in the active test definition and cannot be fully displayed.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Questions list */}
          <div className="space-y-6">
            {(() => {
              if (!viewingSubmission) return null;
              // Find matching test
              const matchingTest = courseTests.find(t => t.course === viewingSubmission.course);
              if (!matchingTest || !matchingTest.questions || matchingTest.questions.length === 0) {
                return (
                  <p className="text-center text-slate-500 font-bold py-6">
                    Questions template for this course test was not found.
                  </p>
                );
              }

              const studentAnswerKeys = Object.keys(viewingSubmission.answers || {});
              const currentQuestionIds = new Set(matchingTest.questions.map((q: any) => q.id));
              const deletedQuestionIds = studentAnswerKeys.filter(id => !currentQuestionIds.has(id));

              const renderedQuestions = matchingTest.questions.map((q: any, index: number) => {
                const selectedAnswer = viewingSubmission.answers[q.id];
                const isUnanswered = selectedAnswer === undefined;
                const isCorrect = !isUnanswered && selectedAnswer === q.correctOptionIndex;

                return (
                  <div key={q.id || index} className={`p-6 rounded-2xl border-2 ${isCorrect
                    ? 'border-green-100 bg-green-50/10'
                    : isUnanswered
                      ? 'border-yellow-100 bg-yellow-50/10'
                      : 'border-red-100 bg-red-50/10'
                    }`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${isCorrect
                          ? 'bg-green-100 text-green-700'
                          : isUnanswered
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          Question {index + 1}
                        </span>
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${isCorrect
                        ? 'text-green-600'
                        : isUnanswered
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}>
                        {isCorrect ? 'Correct' : isUnanswered ? 'Unanswered / Added Later' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="text-lg font-bold text-slate-900 mb-4">{q.questionText}</p>

                    <div className="grid gap-3">
                      {q.options.map((opt: string, optIndex: number) => {
                        const isStudentChoice = selectedAnswer === optIndex;
                        const isCorrectAnswer = q.correctOptionIndex === optIndex;

                        let optionStyle = 'border-slate-100 bg-white text-slate-700';
                        if (isCorrectAnswer) {
                          optionStyle = 'border-green-500 bg-green-50 text-green-900 font-black';
                        } else if (isStudentChoice && !isCorrect) {
                          optionStyle = 'border-red-500 bg-red-50 text-red-900 font-black';
                        }

                        return (
                          <div
                            key={optIndex}
                            className={`p-4 rounded-xl border flex items-center gap-3 ${optionStyle}`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${isCorrectAnswer
                              ? 'bg-green-600 text-white'
                              : isStudentChoice
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                              }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="text-sm">{opt}</span>

                            {isCorrectAnswer && (
                              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                Correct Answer
                              </span>
                            )}
                            {isStudentChoice && !isCorrectAnswer && (
                              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                Student's Choice
                              </span>
                            )}
                            {isStudentChoice && isCorrectAnswer && (
                              <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                                Student's Correct Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });

              const renderedDeletedQuestions = deletedQuestionIds.map((qId, idx) => {
                const selectedOptionIndex = viewingSubmission.answers[qId];
                return (
                  <div key={qId} className="p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-600">
                          Modified/Deleted Question
                        </span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Content Unavailable
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-500 italic">This question has been deleted or its identifier was modified in the course test.</p>
                    <div className="mt-4 p-4 rounded-xl border border-slate-100 bg-white text-slate-700 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs bg-slate-100 text-slate-500">
                        {String.fromCharCode(65 + (selectedOptionIndex ?? 0))}
                      </span>
                      <span className="text-sm font-bold text-slate-500">Student selected option (Question content no longer available)</span>
                    </div>
                  </div>
                );
              });

              return (
                <div className="space-y-6">
                  {renderedQuestions}
                  {renderedDeletedQuestions}
                </div>
              );
            })()}
          </div>

          <DialogFooter className="mt-8 border-t border-slate-100 pt-4">
            <Button
              type="button"
              className="bg-slate-900 hover:bg-slate-800 text-white font-black"
              onClick={() => setViewingSubmission(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redundant header removed - AdminLayout header controls navigation */}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        <Tabs
          value={activeAdminTab}
          onValueChange={(value) => {
            if (isSubUser && value !== 'dashboard') {
              setActiveAdminTab('dashboard');
              return;
            }
            setActiveAdminTab(value);
          }}
          className="gap-6 flex-col"
        >
          <TabsList className="w-full h-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 bg-white border border-slate-100 shadow-lg p-1.5">            <TabsTrigger value="dashboard" className="px-6 py-2 font-black">
            <LayoutDashboard size={16} />
            Dashboard
          </TabsTrigger>
            {canOperateDashboardPayments && !isSubUser && (
              <TabsTrigger value="cyber-cafe-summary" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} />
                Cyber Cafe Summary
              </TabsTrigger>
            )}
            {canManageAdminDashboard && (
              <>
                <TabsTrigger value="teachers" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus size={14} />
                  Teachers
                </TabsTrigger>
                <TabsTrigger value="sub-users" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} />
                  Sub Users
                </TabsTrigger>
                <TabsTrigger value="emitras" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} />
                  Cyber cafe
                </TabsTrigger>
                <TabsTrigger value="notifications" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={14} />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="reports" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  Internship Reports
                </TabsTrigger>
                <TabsTrigger value="student-reports" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Upload size={14} />
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="test-reports" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList size={14} />
                  Test Reports
                </TabsTrigger>
                <TabsTrigger value="college-export" className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Download size={14} />
                  College Export
                </TabsTrigger>
              </>
            )}
          </TabsList >

          <TabsContent value="dashboard" className="space-y-8 mt-4">
            {isSubUser && (
              <div className="student-card p-5 bg-white/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Register Student</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Add a student from your dashboard. These registrations are auto verified and do not need payment.
                  </p>
                  <p className="mt-2 text-xs font-black text-blue-700">
                    Your registered students: {subUserRegisteredUsers.length}
                  </p>
                </div>
                <Link to="/admin/register-student">
                  <Button className="h-11 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition">
                    <UserPlus size={15} />
                    Register Student
                  </Button>
                </Link>
              </div>
            )}

            {/* Stats Grid */}
            {canOperateDashboardPayments && (
              <div className="student-card p-4 bg-white/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Razorpay Payment Sync</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Use this if Razorpay shows paid but the student is still pending.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={reconcileRazorpayPayments}
                  disabled={reconcileLoading}
                  className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  <RefreshCw size={16} className={reconcileLoading ? 'animate-spin' : ''} />
                  {reconcileLoading ? 'Syncing...' : 'Sync Razorpay'}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="student-card p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/15 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <Users size={20} />
                  </div>
                  <span className="text-slate-500 font-black uppercase tracking-wider text-[10px]">Total Users</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900">{users.length}</p>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-indigo-600/5 rounded-full" />
              </div>

              <div className="student-card p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/15 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <CreditCard size={20} />
                  </div>
                  <span className="text-slate-500 font-black uppercase tracking-wider text-[10px]">Total Amount</span>
                </div>
                <p
                  className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight whitespace-nowrap"
                  title={`₹${totalAmount.toLocaleString('en-IN')}`}
                >
                  {formatCompactRupees(totalAmount)}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  {successfulUsersCount} {isSubUser ? 'successful registrations' : 'successful payments'}
                </p>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-600/5 rounded-full" />
              </div>

              <div className="student-card p-6 bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/15 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-600/10 rounded-xl flex items-center justify-center text-teal-600 shadow-inner">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-slate-500 font-black uppercase tracking-wider text-[10px]">Success</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900">{successfulUsersCount}</p>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-teal-600/5 rounded-full" />
              </div>

              <div className="student-card p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/15 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
                    <Clock size={20} />
                  </div>
                  <span className="text-slate-500 font-black uppercase tracking-wider text-[10px]">Pending</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900">{pendingUsersCount}</p>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-amber-600/5 rounded-full" />
              </div>
            </div>

          </TabsContent>

          <TabsContent value="complete-report" className="space-y-8 mt-4">
            <div className="student-card bg-white/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100/70 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="student-icon bg-blue-50 text-blue-600 ring-blue-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">सभी Colleges का Complete Report</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      Total Students, payments, pending payments, revenue और college-wise summary एक जगह.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={exportCompleteReportExcel}
                  disabled={reportFilteredUsers.length === 0}
                  className="student-button-primary bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-5 shadow-emerald-600/10 cursor-pointer"
                >
                  <Download size={18} />
                  Export to Excel
                </Button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 border-b border-slate-100/70">
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Total Students</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{completeReportTotals.totalStudents}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Total Payments</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{completeReportTotals.totalPayments}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Pending Payments</p>
                  <p className="mt-1 text-2xl font-black text-amber-700">{completeReportTotals.pendingPayments}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">Total Revenue</p>
                  <p className="mt-1 text-2xl font-black text-sky-700 whitespace-nowrap" title={`₹${completeReportTotals.totalRevenue.toLocaleString('en-IN')}`}>
                    {formatCompactRupees(completeReportTotals.totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100/70 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <Label className="student-label block mb-2">Search एवं Filter</Label>
                  <Input
                    value={reportSearch}
                    onChange={(event) => setReportSearch(event.target.value)}
                    placeholder="Name, email, phone, roll..."
                    className="student-input"
                  />
                </div>
                <div>
                  <Label className="student-label block mb-2">College-wise Filter</Label>
                  <select
                    value={reportCollegeFilter}
                    onChange={(event) => setReportCollegeFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Colleges</option>
                    {uniqueColleges.map((college) => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="student-label block mb-2">University-wise Filter</Label>
                  <select
                    value={reportUniversityFilter}
                    onChange={(event) => setReportUniversityFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Universities</option>
                    {uniqueUniversities.map((university) => (
                      <option key={university} value={university}>{university}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="student-label block mb-2">Payment Filter</Label>
                  <select
                    value={reportPaymentFilter}
                    onChange={(event) => setReportPaymentFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Payments</option>
                    <option value="success">Paid / Success</option>
                    <option value="pending">Pending Payments</option>
                  </select>
                </div>
              </div>

              {collegeCompleteReport.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No report data found for selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] table-auto">
                    <thead className="bg-slate-50/60">
                      <tr>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">College</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">University</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Total Students</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Total Payments</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Pending Payments</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegeCompleteReport.map((row) => (
                        <tr key={`${row.college}-${row.university}`} className="border-b border-slate-100/60 hover:bg-blue-50/10 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-slate-900">{row.college}</div>
                          </td>
                          <td className="p-4 text-slate-600 text-sm font-bold">{row.university}</td>
                          <td className="p-4">
                            <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 text-xs font-black uppercase tracking-wider">
                              {row.totalStudents}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 text-xs font-black uppercase tracking-wider">
                              <CheckCircle2 size={12} />
                              {row.totalPayments}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100 text-xs font-black uppercase tracking-wider">
                              <Clock size={12} />
                              {row.pendingPayments}
                            </span>
                          </td>
                          <td className="p-4 text-slate-900 font-black" title={`₹${row.totalRevenue.toLocaleString('en-IN')}`}>
                            {formatCompactRupees(row.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cyber-cafe-summary" className="space-y-8 mt-4">
            <div className="student-card bg-white/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100/70 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="flex items-start gap-3">
                  <div className="student-icon bg-indigo-50 text-indigo-600 ring-indigo-100">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">Cyber Cafe Student Summary</h2>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                      Track how many students each cyber cafe has registered and how many are paid or pending.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Students</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{cyberCafeTotals.totalStudents}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Success</p>
                    <p className="mt-1 text-lg font-black text-emerald-700">{cyberCafeTotals.successfulStudents}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Pending</p>
                    <p className="mt-1 text-lg font-black text-amber-700">{cyberCafeTotals.pendingStudents}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Amount</p>
                    <p className="mt-1 text-lg font-black text-blue-700 whitespace-nowrap" title={`₹${cyberCafeTotals.paidAmount.toLocaleString('en-IN')}`}>
                      {formatCompactRupees(cyberCafeTotals.paidAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100/70 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <Label className="student-label block mb-2">Search Cyber Cafe</Label>
                  <Input
                    value={cyberCafeSearch}
                    onChange={(event) => setCyberCafeSearch(event.target.value)}
                    placeholder="Cafe, student, email..."
                    className="student-input"
                  />
                </div>
                <div>
                  <Label className="student-label block mb-2">Payment Status</Label>
                  <select
                    value={cyberCafePaymentFilter}
                    onChange={(event) => setCyberCafePaymentFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Students</option>
                    <option value="success">Success Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>
                <div>
                  <Label className="student-label block mb-2">College</Label>
                  <select
                    value={cyberCafeCollegeFilter}
                    onChange={(event) => setCyberCafeCollegeFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Colleges</option>
                    {uniqueColleges.map((college) => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="student-label block mb-2">Domain</Label>
                  <select
                    value={cyberCafeDomainFilter}
                    onChange={(event) => setCyberCafeDomainFilter(event.target.value)}
                    className="student-input"
                  >
                    <option value="">All Domains</option>
                    {uniqueDomains.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>

              {cyberCafeSummary.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 size={44} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No cyber cafe students found for selected filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] table-auto">
                    <thead className="bg-slate-50/60">
                      <tr>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Cyber Cafe</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Students</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Success</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Pending</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Paid Amount</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Colleges</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Domains</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cyberCafeSummary.map((cafe) => (
                        <tr key={cafe.id} className="border-b border-slate-100/60 hover:bg-indigo-50/10 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-slate-900">{cafe.name}</div>
                            <div className="text-xs text-slate-400 font-semibold">{cafe.id}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider">
                              {cafe.totalStudents}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 text-xs font-black uppercase tracking-wider">
                              <CheckCircle2 size={12} />
                              {cafe.successfulStudents}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-100 text-xs font-black uppercase tracking-wider">
                              <Clock size={12} />
                              {cafe.pendingStudents}
                            </span>
                          </td>
                          <td className="p-4 text-slate-900 font-black" title={`₹${cafe.paidAmount.toLocaleString('en-IN')}`}>
                            {formatCompactRupees(cafe.paidAmount)}
                          </td>
                          <td className="p-4 text-slate-600 text-xs font-bold max-w-[220px]">
                            {Array.from(cafe.colleges).slice(0, 3).join(', ')}
                            {cafe.colleges.size > 3 ? ` +${cafe.colleges.size - 3}` : ''}
                          </td>
                          <td className="p-4 text-slate-600 text-xs font-bold max-w-[220px]">
                            {Array.from(cafe.domains).slice(0, 3).join(', ')}
                            {cafe.domains.size > 3 ? ` +${cafe.domains.size - 3}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </TabsContent>

          <TabsContent value="dashboard" className="space-y-8 mt-4">
            {/* FILTERS */}
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">

              <div className="student-card p-6 bg-white/80 xl:col-span-2">
                <h3 className="student-label mb-3">
                  Search Students
                </h3>
                <Input
                  value={userSearchFilter}
                  onChange={(event) => setUserSearchFilter(event.target.value)}
                  placeholder="Name, email, mobile, roll..."
                  className="student-input"
                />
              </div>

              {/* COLLEGE FILTER */}
              <div className="student-card p-6 bg-white/80">

                <h3 className="student-label mb-3">
                  Filter By College
                </h3>

                <select
                  value={collegeFilter}
                  onChange={(e) =>
                    setCollegeFilter(e.target.value)
                  }
                  className="student-input"
                >

                  <option value="">
                    All Colleges
                  </option>

                  {uniqueColleges.map((college) => (

                    <option
                      key={college}
                      value={college}
                    >
                      {college}
                    </option>

                  ))}

                </select>

              </div>

              {/* DOMAIN FILTER */}
              <div className="student-card p-6 bg-white/80">

                <h3 className="student-label mb-3">
                  Filter By Domain
                </h3>

                <select
                  value={domainFilter}
                  onChange={(e) =>
                    setDomainFilter(e.target.value)
                  }
                  className="student-input"
                >

                  <option value="">
                    All Domains
                  </option>

                  {uniqueDomains.map((domain) => (

                    <option
                      key={domain}
                      value={domain}
                    >
                      {domain}
                    </option>

                  ))}

                </select>

              </div>

              <div className="student-card p-6 bg-white/80">
                <h3 className="student-label mb-3">
                  Filter By Payment
                </h3>
                <select
                  value={userPaymentFilter}
                  onChange={(event) => setUserPaymentFilter(event.target.value)}
                  className="student-input"
                >
                  <option value="">All Payments</option>
                  <option value="success">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="student-card p-6 bg-white/80">
                <h3 className="student-label mb-3">
                  Reset Filters
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    setUserSearchFilter('');
                    setCollegeFilter('');
                    setDomainFilter('');
                    setUserPaymentFilter('');
                  }}
                  className="h-12 w-full rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200"
                >
                  Clear All
                </Button>
              </div>

            </div>

            {/* FILTER SUMMARY */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">

              {/* COLLEGE SUMMARY */}
              <div className="student-card p-6 bg-white/80">

                <h3 className="text-xl font-black mb-4 gradient-text">
                  College Wise Users
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">

                  {Object.entries(collegeCount).map(
                    ([college, count]) => (

                      <div
                        key={college}
                        className="flex justify-between items-center border-b border-slate-100/50 pb-3 last:border-b-0"
                      >

                        <span className="text-slate-700 font-bold text-sm">
                          {college}
                        </span>

                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-black ring-1 ring-indigo-100/80">
                          {count as number}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* DOMAIN SUMMARY */}
              <div className="student-card p-6 bg-white/80">

                <h3 className="text-xl font-black mb-4 gradient-text">
                  Domain Wise Users
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">

                  {Object.entries(domainCount).map(
                    ([domain, count]) => (

                      <div
                        key={domain}
                        className="flex justify-between items-center border-b border-slate-100/50 pb-3 last:border-b-0"
                      >

                        <span className="text-slate-700 font-bold text-sm">
                          {domain}
                        </span>

                        <span className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-xl text-xs font-black ring-1 ring-teal-100/80">
                          {count as number}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>
            {/* Users Table */}
            <div className="student-card bg-white/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 gradient-text">Registered Users</h2>
                  {isSubUser && (
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Showing only students registered by you.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isSubUser && (
                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ring-1 ring-blue-100">
                      My Students
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                    {filteredUsers.length} of {users.length} Users
                  </span>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[1100px] table-auto">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Name</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Phone</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">College</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Department</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Domain</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Payment Status</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Registered</th>
                        <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Source</th>
                        {canOperateDashboardPayments && (
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage).map((user) => (
                        <tr key={user.uid} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-slate-900">{user.fullName}</div>
                            <div className="text-xs text-slate-400 font-semibold">{user.uid}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                              <Mail size={14} className="text-slate-400" />
                              {user.email}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                              <Phone size={14} className="text-slate-400" />
                              {user.contactNumber}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 text-sm font-medium">{user.college}</td>
                          <td className="p-4 text-slate-600 text-sm font-medium">{user.department}</td>
                          <td className="p-4 text-slate-600 font-bold text-sm">{user.internshipDomain}</td>
                          <td className="p-4">
                            {(() => {
                              const paymentStatus = getUserPaymentStatus(user.uid);
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${paymentStatus.status === 'Success'
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100/80'
                                  }`}>
                                  {paymentStatus.status === 'Success' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                  {paymentStatus.status}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-slate-600 text-sm font-medium">

                            {new Date(user.registrationDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4">
                            {user.createdByEmitraId ? (
                              <div>
                                <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100">
                                  Cyber cafe
                                </span>
                                <div className="mt-1 text-xs text-slate-500 font-bold">{user.createdByEmitraName || user.createdByEmitraId}</div>
                              </div>
                            ) : user.createdBySubUserId ? (
                              <div>
                                <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider ring-1 ring-blue-100">
                                  Sub User
                                </span>
                                <div className="mt-1 text-xs text-slate-500 font-bold">{user.createdBySubUserName || user.createdBySubUserId}</div>
                              </div>
                            ) : (
                              <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider">
                                Direct
                              </span>
                            )}
                          </td>
                          {canOperateDashboardPayments && (
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">

                                <button
                                  onClick={() =>
                                    updatePaymentStatus(user.uid)
                                  }
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm shadow-emerald-600/10 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  Verify
                                </button>

                                <button
                                  onClick={() => rejectPaymentStatus(user.uid)}
                                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm shadow-rose-600/10 hover:bg-rose-700 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  Reject
                                </button>

                                <button
                                  onClick={() => openPasswordModal(user)}
                                  className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Update password"
                                >
                                  <KeyRound size={14} />
                                  Change Password
                                </button>

                                <button
                                  onClick={() => openEmailModal(user)}
                                  className="inline-flex items-center gap-1 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Update email"
                                >
                                  <Mail size={14} />
                                  Change Email
                                </button>

                                <button
                                  onClick={() => openProfileModal(user)}
                                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Edit Profile"
                                >
                                  <Users size={14} />
                                  Edit Profile
                                </button>

                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={usersPage}
                    totalItems={filteredUsers.length}
                    itemsPerPage={usersPerPage}
                    onPageChange={setUsersPage}
                    onItemsPerPageChange={(size) => {
                      setUsersPerPage(size);
                      setUsersPage(1);
                    }}
                    label="students"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="student-reports">
            <div className="space-y-6">
              <div className="student-card p-6 bg-white/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="student-icon">
                      <ClipboardList size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 gradient-text">Create Assignment</h2>
                      <p className="text-slate-500 text-sm font-semibold">Add assignment questions course-wise. Students can upload answers only after an assignment is available.</p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80">
                    {assignments.length} Assignments
                  </span>
                </div>

                <form onSubmit={handleCreateAssignment} className="border border-slate-100/50 rounded-2xl p-5 mb-6 bg-slate-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                    <div>
                      <Label className="student-label">Assignment Title</Label>
                      <Input
                        value={assignmentForm.title}
                        onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })}
                        placeholder="Module 1 practical task"
                        className="student-input mt-2 h-12 px-4"
                      />
                    </div>
                    <div>
                      <Label className="student-label">Course</Label>
                      <select
                        value={assignmentForm.course}
                        onChange={(event) => setAssignmentForm({ ...assignmentForm, course: event.target.value })}
                        className="student-input mt-2 h-12 px-4"
                        required
                      >
                        <option value="">Select Course</option>
                        {INTERNSHIP_DOMAINS.map((domain) => (
                          <option key={domain} value={domain}>
                            {domain}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="student-label">Question File</Label>
                      <Input
                        key={assignmentFileInputKey}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                        onChange={(event) => setAssignmentForm({ ...assignmentForm, file: event.target.files?.[0] || null })}
                        className="student-input mt-2 h-12 px-4 py-2"
                      />
                    </div>
                    <Button type="submit" disabled={savingAssignment} className="student-button-primary h-12 px-5 min-h-[48px] shadow-indigo-600/10 cursor-pointer">
                      <ClipboardList size={18} />
                      {savingAssignment ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Label className="student-label">Instructions</Label>
                    <textarea
                      value={assignmentForm.description}
                      onChange={(event) => setAssignmentForm({ ...assignmentForm, description: event.target.value })}
                      placeholder="Write the assignment instructions students should follow"
                      className="student-input mt-2 min-h-24 py-3"
                    />
                  </div>
                </form>

                {assignments.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                    <ClipboardList size={44} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No assignments added yet</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="student-card p-5 bg-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-900">{assignment.title}</h3>
                            <p className="mt-1 text-xs font-black uppercase tracking-wider text-indigo-600">{assignment.course || 'Course not set'}</p>
                            {assignment.description && (
                              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{assignment.description}</p>
                            )}
                            {assignment.fileUrl && (
                              <a href={assignment.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                                Download question file
                              </a>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black p-2.5 rounded-xl cursor-pointer transition-all active:scale-95"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="student-card p-6 bg-white/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="student-icon text-emerald-600 bg-emerald-50 ring-emerald-100">
                      <Upload size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 gradient-text">Student Assignments</h2>
                      <p className="text-slate-500 text-sm font-semibold">Every student PDF upload appears here with the optional description message.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-emerald-100/80">
                    {visibleStudentReports.length} Uploads
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="student-label">Filter By College</Label>
                    <select
                      value={collegeFilter}
                      onChange={(event) => setCollegeFilter(event.target.value)}
                      className="student-input mt-2 h-12 px-4"
                    >
                      <option value="">All Colleges</option>
                      {uniqueColleges.map((college) => (
                        <option key={college} value={college}>
                          {college}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="student-label">Filter By Course</Label>
                    <select
                      value={domainFilter}
                      onChange={(event) => setDomainFilter(event.target.value)}
                      className="student-input mt-2 h-12 px-4"
                    >
                      <option value="">All Courses</option>
                      {uniqueDomains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {visibleStudentReports.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                    <Upload size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No student assignments uploaded yet</p>
                  </div>
                ) : (
                  <div className="student-card overflow-hidden bg-white/50 border-slate-100/50">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full min-w-[1000px] table-auto">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Student</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Assignment</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Course</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">File</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Description</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Uploaded</th>
                            <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleStudentReports.slice((assignmentsPage - 1) * assignmentsPerPage, assignmentsPage * assignmentsPerPage).map((report) => {
                            const student = getStudentProfile(report.userId);

                            return (
                              <tr key={report.id} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                                <td className="p-4">
                                  <div className="font-black text-slate-900">{student?.fullName || report.studentName || 'Student'}</div>
                                  <div className="text-xs text-slate-400 font-semibold">{student?.email || report.email || report.userId}</div>
                                  <div className="mt-1 text-xs font-bold text-slate-500">{student?.college || '-'}</div>
                                </td>
                                <td className="p-4 text-slate-700 font-black">{getAssignmentTitle(report)}</td>
                                <td className="p-4 text-slate-600 font-bold">{report.course || student?.internshipDomain || '-'}</td>
                                <td className="p-4 text-slate-600 text-sm font-medium">{report.fileName}</td>
                                <td className="p-4 text-sm font-semibold leading-6 text-slate-600">
                                  {report.description || <span className="text-slate-400">No description</span>}
                                </td>
                                <td className="p-4 text-slate-600 text-sm font-medium">
                                  {report.uploadedAt
                                    ? new Date(report.uploadedAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                    : '-'}
                                </td>
                                <td className="p-4">
                                  <a href={report.fileUrl} target="_blank" rel="noreferrer" download>
                                    <Button type="button" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5">
                                      <Download size={16} />
                                      Download
                                    </Button>
                                  </a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <PaginationControls
                        currentPage={assignmentsPage}
                        totalItems={visibleStudentReports.length}
                        itemsPerPage={assignmentsPerPage}
                        onPageChange={setAssignmentsPage}
                        onItemsPerPageChange={(size) => {
                          setAssignmentsPerPage(size);
                          setAssignmentsPage(1);
                        }}
                        label="uploads"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test-reports">
            <div className="space-y-6">
              {/* Summary Stats */}
              {(() => {
                const isTeacher = adminProfile?.role === 'teacher';
                const assignedCourse = adminProfile?.course || '';

                const visibleTestSubmissions = testSubmissions.filter((sub) => {
                  if (isTeacher && sub.course !== assignedCourse) return false;
                  if (testCourseFilter && sub.course !== testCourseFilter) return false;
                  return true;
                });

                const totalTestsCount = visibleTestSubmissions.length;
                const passedTestsCount = visibleTestSubmissions.filter(sub => sub.scorePercentage >= 33).length;
                const failedTestsCount = totalTestsCount - passedTestsCount;

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <ClipboardList className="text-blue-600" size={24} />
                          <span className="text-slate-500 font-black uppercase text-xs">Total Assessments Taken</span>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{totalTestsCount}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="text-green-600" size={24} />
                          <span className="text-slate-500 font-black uppercase text-xs">Passed Students</span>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{passedTestsCount}</p>
                        <p className="text-sm text-slate-400 font-bold">
                          {totalTestsCount > 0 ? Math.round((passedTestsCount / totalTestsCount) * 100) : 0}% Pass Rate
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="text-red-600" size={24} />
                          <span className="text-slate-500 font-black uppercase text-xs">Failed Students</span>
                        </div>
                        <p className="text-4xl font-black text-slate-900">{failedTestsCount}</p>
                        <p className="text-sm text-slate-400 font-bold">Score below 33%</p>
                      </div>
                    </div>

                    {/* Course-wise Filter */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <ClipboardList size={24} />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-slate-900">Student Assessment Reports</h2>
                            <p className="text-slate-500 text-sm font-bold">View question-by-question breakdown, grades, and completion status of final tests.</p>
                          </div>
                        </div>
                        {!isTeacher && (
                          <div className="w-full md:w-64">
                            <Label className="text-slate-500 text-xs font-black uppercase">Filter By Course</Label>
                            <select
                              value={testCourseFilter}
                              onChange={(event) => setTestCourseFilter(event.target.value)}
                              className="mt-2 w-full h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            >
                              <option value="">All Courses</option>
                              {INTERNSHIP_DOMAINS.map((domain) => (
                                <option key={domain} value={domain}>
                                  {domain}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submissions Table */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                      {visibleTestSubmissions.length === 0 ? (
                        <div className="p-12 text-center">
                          <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 font-bold">No test submissions found</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Student</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Course</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Score</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Answers</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Submitted At</th>
                                <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleTestSubmissions.slice((testSubmissionsPage - 1) * testSubmissionsPerPage, testSubmissionsPage * testSubmissionsPerPage).map((sub) => {
                                const student = getStudentProfile(sub.userId);
                                const isPassed = sub.scorePercentage >= 33;

                                return (
                                  <tr key={sub.userId + '-' + sub.course} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                      <div className="font-black text-slate-900">{sub.studentName}</div>
                                      <div className="text-xs text-slate-400">{sub.email}</div>
                                      {student?.college && (
                                        <div className="mt-1 text-xs font-bold text-slate-500">{student.college}</div>
                                      )}
                                    </td>
                                    <td className="p-4 text-slate-600 font-bold">{sub.course}</td>
                                    <td className="p-4">
                                      <span className="text-lg font-black text-slate-900">{sub.scorePercentage}%</span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-bold">
                                      {sub.correctCount} / {sub.totalQuestions}
                                    </td>
                                    <td className="p-4">
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {isPassed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {isPassed ? 'PASSED' : 'FAILED'}
                                      </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                      {sub.submittedAt
                                        ? new Date(sub.submittedAt).toLocaleString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                        : '-'}
                                    </td>
                                    <td className="p-4">
                                      <Button
                                        type="button"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black"
                                        onClick={() => setViewingSubmission(sub)}
                                      >
                                        View Details
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <PaginationControls
                            currentPage={testSubmissionsPage}
                            totalItems={visibleTestSubmissions.length}
                            itemsPerPage={testSubmissionsPerPage}
                            onPageChange={setTestSubmissionsPage}
                            onItemsPerPageChange={(size) => {
                              setTestSubmissionsPerPage(size);
                              setTestSubmissionsPage(1);
                            }}
                            label="submissions"
                          />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="college-export">
            <div className="student-card p-6 bg-white/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="student-icon bg-emerald-50 text-emerald-600 ring-emerald-100">
                    <Download size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">College Student Export</h2>
                    <p className="text-slate-500 text-sm font-semibold">Select one college and export successful payment students as PDF.</p>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-emerald-100/80">
                  {exportCollege
                    ? users.filter(user =>
                      getGroupName(user.college) === exportCollege &&
                      isUserSuccessful(user)
                    ).length
                    : 0} Paid Students
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end border border-slate-100/50 rounded-2xl p-5 bg-slate-50/30">
                <div>
                  <Label className="student-label">College</Label>
                  <select
                    value={exportCollege}
                    onChange={(event) => setExportCollege(event.target.value)}
                    className="student-input mt-2 h-12 px-4"
                  >
                    <option value="">Select college</option>
                    {uniqueColleges.map((college) => (
                      <option key={college} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  onClick={exportCollegeStudentsPdf}
                  disabled={!exportCollege}
                  className="student-button-primary bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-6 shadow-emerald-600/10 cursor-pointer"
                >
                  <Download size={18} />
                  Export PDF
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="student-card p-6 bg-white/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="student-icon bg-blue-50 text-blue-600 ring-blue-100">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">User Notifications</h2>
                    <p className="text-slate-500 text-sm font-semibold">Add announcements that appear on every user profile page.</p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-blue-100/80">
                  {notifications.length} Notifications
                </span>
              </div>

              <form onSubmit={handleAddNotification} className="border border-slate-100/50 rounded-2xl p-5 mb-6 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_auto] gap-4 items-end">
                  <div>
                    <Label className="student-label">Title</Label>
                    <Input
                      value={notificationForm.title}
                      onChange={(event) => setNotificationForm({ ...notificationForm, title: event.target.value })}
                      placeholder="Notification title"
                      className="student-input mt-2 h-12 px-4"
                    />
                  </div>
                  <div>
                    <Label className="student-label">Message</Label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(event) => setNotificationForm({ ...notificationForm, message: event.target.value })}
                      placeholder="Write notification message"
                      className="student-input mt-2 min-h-12 py-3"
                    />
                  </div>
                  <Button type="submit" disabled={savingNotification} className="student-button-primary bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-5 min-h-[48px] shadow-indigo-600/10 cursor-pointer">
                    <Send size={18} />
                    {savingNotification ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </form>

              {notifications.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <Bell size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No notifications added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="student-card p-5 bg-white/60 hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-900">{notification.title}</h3>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 whitespace-pre-line">{notification.message}</p>
                        </div>
                        <div className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                            : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="student-card p-6 bg-white/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="student-icon bg-indigo-50 text-indigo-600 ring-indigo-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">Internship Reports</h2>
                    <p className="text-slate-500 text-sm font-semibold">Upload Internship reports course-wise. Students will see only their selected course reports.</p>
                  </div>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80">
                  {courseReports.length} Reports
                </span>
              </div>

              <form onSubmit={handleUploadReport} className="border border-slate-100/50 rounded-2xl p-5 mb-6 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px_1fr_auto] gap-4 items-end">
                  <div>
                    <Label className="student-label">Report Title</Label>
                    <Input
                      value={reportForm.title}
                      onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })}
                      placeholder="Monthly performance report"
                      className="student-input mt-2 h-12 px-4"
                    />
                  </div>
                  <div>
                    <Label className="student-label">Course</Label>
                    <select
                      value={reportForm.course}
                      onChange={(event) => setReportForm({ ...reportForm, course: event.target.value })}
                      className="student-input mt-2 h-12 px-4"
                    >
                      <option value="">Select course</option>
                      {INTERNSHIP_DOMAINS.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="student-label">Report File</Label>
                    <Input
                      key={reportFileInputKey}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                      onChange={(event) => setReportForm({ ...reportForm, file: event.target.files?.[0] || null })}
                      className="student-input mt-2 h-12 px-4 py-2"
                    />
                  </div>
                  <Button type="submit" disabled={savingReport} className="student-button-primary bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-5 min-h-[48px] shadow-indigo-600/10 cursor-pointer">
                    <Upload size={18} />
                    {savingReport ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </form>

              {courseReports.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No course reports uploaded yet</p>
                </div>
              ) : (
                <div className="student-card overflow-hidden bg-white/50 border-slate-100/50">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[800px] table-auto">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Report</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Course</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">File</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Uploaded</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseReports.slice((reportsPage - 1) * reportsPerPage, reportsPage * reportsPerPage).map((report) => (
                          <tr key={report.id} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                            <td className="p-4">
                              <div className="font-black text-slate-900">{report.title}</div>
                              <div className="text-xs text-slate-400 font-semibold">{report.id}</div>
                            </td>
                            <td className="p-4 text-slate-600 font-bold">{report.course}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">{report.fileName}</td>
                            <td className="p-4 text-slate-600 text-sm font-medium">
                              {report.uploadedAt
                                ? new Date(report.uploadedAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                                : '-'}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <a href={report.fileUrl} target="_blank" rel="noreferrer" download>
                                  <Button type="button" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5">
                                    <Download size={16} />
                                    Download
                                  </Button>
                                </a>
                                <Button
                                  type="button"
                                  onClick={() => handleDeleteReport(report)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider hover:bg-rose-700 transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationControls
                      currentPage={reportsPage}
                      totalItems={courseReports.length}
                      itemsPerPage={reportsPerPage}
                      onPageChange={setReportsPage}
                      onItemsPerPageChange={(size) => {
                        setReportsPerPage(size);
                        setReportsPage(1);
                      }}
                      label="reports"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="emitras">
            <div className="student-card p-4 sm:p-6 bg-white/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="student-icon bg-indigo-50 text-indigo-600 ring-indigo-100">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">Cyber cafe Management</h2>
                    <p className="text-slate-500 text-sm font-semibold">View Cyber cafes, their students, and adjust commission percentage.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-indigo-100/80 w-fit">
                    {emitras.length} Cyber cafes
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-emerald-100/80 w-fit">
                    {emitraStudentsCount} Students
                  </span>
                </div>
              </div>

              {emitras.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No Cyber cafes registered yet</p>
                </div>
              ) : (
                <div className="student-card overflow-hidden bg-white/50 border-slate-100/50">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-[1100px] table-auto">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Cyber cafe</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Owner</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Contact</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Students</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Paid Amount</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Percentage</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Commission</th>
                          <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emitras.map((emitra) => {
                          const emitraStudents = getEmitraStudents(emitra.uid);
                          const emitraPaidTotal = getEmitraPaymentTotal(emitra.uid);
                          const commission = Math.round(emitraPaidTotal * ((emitra.commissionPercentage || 0) / 100));

                          return (
                            <tr key={emitra.uid} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                              <td className="p-4">
                                <div className="font-black text-slate-900">{emitra.centerName}</div>
                                <div className="text-xs text-slate-400 font-semibold">{emitra.uid}</div>
                                <div className="mt-1 text-xs text-slate-500 font-semibold max-w-xs truncate">{emitra.address}</div>
                              </td>
                              <td className="p-4 text-slate-700 font-bold text-sm">{emitra.ownerName}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                                  <Mail size={14} className="text-slate-400" />
                                  {emitra.email}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-slate-600 text-sm font-semibold">
                                  <Phone size={14} className="text-slate-400" />
                                  {emitra.contactNumber}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-black text-slate-900">{emitraStudents.length}</div>
                                <div className="text-xs text-slate-400 font-bold">
                                  {emitraStudents.filter(isUserSuccessful).length} paid
                                </div>
                              </td>
                              <td className="p-4 text-slate-900 font-black">₹{emitraPaidTotal.toLocaleString('en-IN')}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={emitra.commissionPercentage ?? 0}
                                    onChange={(event) => {
                                      const value = Number(event.target.value);
                                      setEmitras((prev) =>
                                        prev.map((item) =>
                                          item.uid === emitra.uid ? { ...item, commissionPercentage: value } : item
                                        )
                                      );
                                    }}
                                    className="h-10 w-24 rounded-xl font-black"
                                  />
                                  <Button
                                    type="button"
                                    disabled={savingEmitraId === emitra.uid}
                                    onClick={() => handleUpdateEmitraPercentage(emitra.uid, Number(emitra.commissionPercentage || 0))}
                                    className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider"
                                  >
                                    {savingEmitraId === emitra.uid ? 'Saving' : 'Save'}
                                  </Button>
                                </div>
                              </td>
                              <td className="p-4 text-emerald-700 font-black">₹{commission.toLocaleString('en-IN')}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${emitra.isActive
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100/80'
                                  }`}>
                                  {emitra.isActive ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                  {emitra.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teachers">
            <div className="student-card p-4 sm:p-6 bg-white/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="student-icon bg-blue-50 text-blue-600 ring-blue-100">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 gradient-text">Teacher Management</h2>
                    <p className="text-slate-500 text-sm font-semibold">Teachers can access only Daily Videos.</p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-blue-100/80 w-fit">
                  {teachers.length} Teachers
                </span>
              </div>

              <Tabs defaultValue="add" className="gap-6 flex-col">
                <TabsList className="bg-slate-100/70 rounded-xl h-11 p-1">
                  <TabsTrigger value="add" className="px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    <UserPlus size={16} />
                    Add Teacher
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-5 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    <Users size={16} />
                    Teacher List
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add">
                  <form onSubmit={handleAddTeacher} className="border border-slate-200/60 rounded-3xl p-4 sm:p-6 bg-white/70 backdrop-blur-sm shadow-sm mt-4">
                    <div className="flex flex-col lg:grid lg:grid-cols-5 gap-5 lg:items-end w-full">
                      <div className="w-full">
                        <Label className="student-label">Teacher Name</Label>
                        <Input
                          value={teacherForm.fullName}
                          onChange={(event) => setTeacherForm({ ...teacherForm, fullName: event.target.value })}
                          placeholder="Teacher name"
                          className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                        />
                      </div>
                      <div className="w-full">
                        <Label className="student-label">Email</Label>
                        <Input
                          type="email"
                          value={teacherForm.email}
                          onChange={(event) => setTeacherForm({ ...teacherForm, email: event.target.value })}
                          placeholder="teacher@example.com"
                          className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                        />
                      </div>
                      <div className="w-full">
                        <Label className="student-label">Password</Label>
                        <Input
                          type="password"
                          value={teacherForm.password}
                          onChange={(event) => setTeacherForm({ ...teacherForm, password: event.target.value })}
                          placeholder="Minimum 6 characters"
                          className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                        />
                      </div>
                      <div className="w-full">
                        <Label className="student-label">Course</Label>
                        <select
                          value={teacherForm.course}
                          onChange={(event) => setTeacherForm({ ...teacherForm, course: event.target.value })}
                          className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80 bg-white"
                        >
                          <option value="">Select course</option>
                          {INTERNSHIP_DOMAINS.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full">
                        <Button type="submit" disabled={savingTeacher} className="student-button-primary bg-blue-600 hover:bg-blue-700 text-white h-12 w-full px-5 min-h-[48px] shadow-blue-500/10 cursor-pointer rounded-xl transition-all">
                          <UserPlus size={18} />
                          {savingTeacher ? 'Adding...' : 'Add Teacher'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                  {teachers.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <Users size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">No teachers added yet</p>
                    </div>
                  ) : (
                    <div className="student-card overflow-hidden bg-white/50 border-slate-100/50">
                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto w-full">
                        <table className="w-full min-w-[800px] table-auto">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Teacher</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Course</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teachers.slice((teachersPage - 1) * teachersPerPage, teachersPage * teachersPerPage).map((teacher) => (
                              <tr key={teacher.uid} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                                <td className="p-4">
                                  <div className="font-black text-slate-900">{teacher.fullName}</div>
                                  <div className="text-xs text-slate-400 font-semibold">{teacher.uid}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                                    <Mail size={14} className="text-slate-400" />
                                    {teacher.email}
                                  </div>
                                </td>
                                <td className="p-4 text-slate-600 font-bold text-sm">
                                  {teacher.course || '-'}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${teacher.isActive
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                    : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100/80'
                                    }`}>
                                    {teacher.isActive ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {teacher.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-600 text-sm font-medium">
                                  {teacher.createdAt
                                    ? new Date(teacher.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card List View */}
                      <div className="lg:hidden divide-y divide-slate-100/50">
                        {teachers.slice((teachersPage - 1) * teachersPerPage, teachersPage * teachersPerPage).map((teacher) => (
                          <div key={teacher.uid} className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="font-black text-slate-900 text-sm">{teacher.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px]">{teacher.uid}</div>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${teacher.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100/80'
                                }`}>
                                {teacher.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                              <div className="flex items-center gap-2">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">{teacher.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen size={12} className="text-slate-400 shrink-0" />
                                <span>{teacher.course || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-400 shrink-0" />
                                <span>
                                  {teacher.createdAt
                                    ? new Date(teacher.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <PaginationControls
                        currentPage={teachersPage}
                        totalItems={teachers.length}
                        itemsPerPage={teachersPerPage}
                        onPageChange={setTeachersPage}
                        onItemsPerPageChange={(size) => {
                          setTeachersPerPage(size);
                          setTeachersPage(1);
                        }}
                        label="teachers"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {canManageAdminDashboard && (
            <TabsContent value="sub-users">
              <div className="student-card p-4 sm:p-6 bg-white/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="student-icon bg-emerald-50 text-emerald-600 ring-emerald-100">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 gradient-text">Sub User Management</h2>
                      <p className="text-slate-500 text-sm font-semibold">Sub users can access only the admin dashboard in view mode.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ring-1 ring-emerald-100/80 w-fit">
                    {subUsers.length} Sub Users
                  </span>
                </div>

                <form onSubmit={handleAddSubUser} className="border border-slate-200/60 rounded-3xl p-4 sm:p-6 bg-white/70 backdrop-blur-sm shadow-sm">
                  <div className="flex flex-col lg:grid lg:grid-cols-4 gap-5 lg:items-end w-full">
                    <div className="w-full">
                      <Label className="student-label">Sub User Name</Label>
                      <Input
                        value={subUserForm.fullName}
                        onChange={(event) => setSubUserForm({ ...subUserForm, fullName: event.target.value })}
                        placeholder="Sub user name"
                        className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                      />
                    </div>
                    <div className="w-full">
                      <Label className="student-label">Email</Label>
                      <Input
                        type="email"
                        value={subUserForm.email}
                        onChange={(event) => setSubUserForm({ ...subUserForm, email: event.target.value })}
                        placeholder="subuser@example.com"
                        className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                      />
                    </div>
                    <div className="w-full">
                      <Label className="student-label">Password</Label>
                      <Input
                        type="password"
                        value={subUserForm.password}
                        onChange={(event) => setSubUserForm({ ...subUserForm, password: event.target.value })}
                        placeholder="Minimum 6 characters"
                        className="student-input mt-2 h-12 px-4 rounded-xl border-slate-200/80"
                      />
                    </div>
                    <div className="w-full">
                      <Button type="submit" disabled={savingSubUser} className="student-button-primary bg-emerald-600 hover:bg-emerald-700 text-white h-12 w-full px-5 min-h-[48px] shadow-emerald-500/10 cursor-pointer rounded-xl transition-all">
                        <UserPlus size={18} />
                        {savingSubUser
                          ? 'Adding...'
                          : subUserForm.districtIds.length > 0
                            ? 'Add District User'
                            : 'Add Sub User'}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <Label className="student-label">District Dashboard Access</Label>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {districts.length === 0 ? (
                        <div className="text-xs font-bold text-slate-400">No districts found</div>
                      ) : (
                        districts.map((district) => {
                          const checked = subUserForm.districtIds.includes(district.id);
                          return (
                            <label
                              key={district.id}
                              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-xs font-black transition-all ${
                                checked
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setSubUserForm((current) => ({
                                    ...current,
                                    districtIds: event.target.checked
                                      ? [...current.districtIds, district.id]
                                      : current.districtIds.filter((id) => id !== district.id),
                                  }));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{district.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-slate-500">
                      Select districts to create a district dashboard user. Leave blank for a normal admin dashboard sub user.
                    </p>
                  </div>
                </form>

                <div className="mt-6">
                  {subUsers.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <Users size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">No sub users added yet</p>
                    </div>
                  ) : (
                    <div className="student-card overflow-hidden bg-white/50 border-slate-100/50">
                      <div className="hidden lg:block overflow-x-auto w-full">
                        <table className="w-full min-w-[760px] table-auto">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Sub User</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Email</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Access</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                              <th className="text-left p-4 text-xs font-black uppercase tracking-wider text-slate-500">Created</th>
                              <th className="text-right p-4 text-xs font-black uppercase tracking-wider text-slate-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subUsers.slice((subUsersPage - 1) * subUsersPerPage, subUsersPage * subUsersPerPage).map((subUser) => (
                              <tr key={subUser.uid} className="border-b border-slate-100/50 hover:bg-indigo-50/10 transition-colors">
                                <td className="p-4">
                                  <div className="font-black text-slate-900">{subUser.fullName}</div>
                                  <div className="text-xs text-slate-400 font-semibold">{subUser.uid}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                                    <Mail size={14} className="text-slate-400" />
                                    {subUser.email}
                                  </div>
                                </td>
                                <td className="p-4 text-slate-600 font-bold text-sm">
                                  {subUser.role === 'district_user'
                                    ? `Districts: ${(subUser.districtNames || []).join(', ') || '-'}`
                                    : 'Dashboard only'}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${subUser.isActive
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                    : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100/80'
                                    }`}>
                                    {subUser.isActive ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {subUser.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-600 text-sm font-medium">
                                  {subUser.createdAt
                                    ? new Date(subUser.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                    : '-'}
                                </td>
                                <td className="p-4 text-right">
                                  <Button
                                    type="button"
                                    onClick={() => handleDeleteSubUser(subUser)}
                                    disabled={deletingSubUserId === subUser.uid}
                                    className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    <Trash2 size={16} />
                                    {deletingSubUserId === subUser.uid ? 'Deleting...' : 'Delete'}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="lg:hidden divide-y divide-slate-100/50">
                        {subUsers.slice((subUsersPage - 1) * subUsersPerPage, subUsersPage * subUsersPerPage).map((subUser) => (
                          <div key={subUser.uid} className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="font-black text-slate-900 text-sm">{subUser.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px]">{subUser.uid}</div>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${subUser.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/80'
                                : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100/80'
                                }`}>
                                {subUser.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
                              <div className="flex items-center gap-2">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate">{subUser.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <LayoutDashboard size={12} className="text-slate-400 shrink-0" />
                                <span>
                                  {subUser.role === 'district_user'
                                    ? `Districts: ${(subUser.districtNames || []).join(', ') || '-'}`
                                    : 'Dashboard only'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-400 shrink-0" />
                                <span>
                                  {subUser.createdAt
                                    ? new Date(subUser.createdAt).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                    : '-'}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleDeleteSubUser(subUser)}
                              disabled={deletingSubUserId === subUser.uid}
                              className="h-10 w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Trash2 size={16} />
                              {deletingSubUserId === subUser.uid ? 'Deleting...' : 'Delete Sub User'}
                            </Button>
                          </div>
                        ))}
                      </div>

                      <PaginationControls
                        currentPage={subUsersPage}
                        totalItems={subUsers.length}
                        itemsPerPage={subUsersPerPage}
                        onPageChange={setSubUsersPage}
                        onItemsPerPageChange={(size) => {
                          setSubUsersPerPage(size);
                          setSubUsersPage(1);
                        }}
                        label="sub users"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs >
      </div >
    </div >
  );
}
