import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  Search,
  Users,
  Download,
  Calendar,
  BookOpen,
  Filter,
  ArrowUpDown,
  GraduationCap,
  Sparkles,
  BarChart3,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserProfile } from '../types';
import { CURRENT_INTERNSHIP_START_DATE } from '../lib/constants';

interface ImportedStudent {
  id: string;
  fullName: string;
  parentName: string;
  contactNumber: string;
  email: string;
  gender: string;
  college: string;
  university: string;
  course: string;
  semester: string;
  universityRoll: string;
  industrialRegNo: string;
  paymentStatus: string;
  importedAt?: string;
}

interface CollegeRecord {
  id: string;
  name: string;
  districtId: string;
  price?: number;
}

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const formatListDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function CollegeDashboard() {
  const { collegeProfile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);
  const [collegePrice, setCollegePrice] = useState(1000);
  const [collegePriceMap, setCollegePriceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'registered' | 'pending_reg'>('registered');
  const [dateFrom, setDateFrom] = useState(CURRENT_INTERNSHIP_START_DATE);
  const [dateTo, setDateTo] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  useEffect(() => {
    const fetchCollegeData = async () => {
      if (!collegeProfile) return;

      setLoading(true);
      try {
        const isDistrictDashboard = collegeProfile.accessType === 'district';

        if (isDistrictDashboard) {
          const allowedDistrictNames = new Set((collegeProfile.districtNames || []).filter(Boolean));
          const allowedDistrictIds = new Set((collegeProfile.districtIds || []).filter(Boolean));

          if (allowedDistrictNames.size === 0 && allowedDistrictIds.size === 0) {
            setStudents([]);
            setImportedStudents([]);
            setCollegePriceMap({});
            return;
          }

          const studentSnapshots = allowedDistrictNames.size > 0
            ? await Promise.all(
              chunkArray(Array.from(allowedDistrictNames), 30).map((districtChunk) =>
                getDocs(query(collection(db, 'users'), where('district', 'in', districtChunk)))
              )
            )
            : [];
          const districtStudents = studentSnapshots
            .flatMap((snapshot) => snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)))
            .sort((a, b) => (b.registrationDate || '').localeCompare(a.registrationDate || ''));
          setStudents(districtStudents);

          const collegesSnapshot = await getDocs(collection(db, 'colleges'));
          const allowedColleges = collegesSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as CollegeRecord))
            .filter((college) => allowedDistrictIds.has(college.districtId));
          const allowedCollegeNames = allowedColleges.map((college) => college.name).filter(Boolean);

          const priceMap = allowedColleges.reduce<Record<string, number>>((acc, college) => {
            acc[college.name] = college.price || 1000;
            return acc;
          }, {});
          setCollegePriceMap(priceMap);

          const importedSnapshots = allowedCollegeNames.length > 0
            ? await Promise.all(
              chunkArray(allowedCollegeNames, 30).map((collegeChunk) =>
                getDocs(query(collection(db, 'importedStudents'), where('college', 'in', collegeChunk)))
              )
            )
            : [];
          const districtImported = importedSnapshots.flatMap((snapshot) =>
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ImportedStudent))
          );
          setImportedStudents(districtImported);
        } else {
          // 1. Fetch Registered Students
          const studentsQuery = query(
            collection(db, 'users'),
            where('college', '==', collegeProfile.collegeName)
          );
          const snapshot = await getDocs(studentsQuery);
          const data = snapshot.docs
            .map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile))
            .sort((a, b) => (b.registrationDate || '').localeCompare(a.registrationDate || ''));
          setStudents(data);

          // 2. Fetch Imported Students (Pre-registration)
          const importedQuery = query(
            collection(db, 'importedStudents'),
            where('college', '==', collegeProfile.collegeName)
          );
          const importedSnapshot = await getDocs(importedQuery);
          const importedData = importedSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ImportedStudent)
          );
          setImportedStudents(importedData);

          // 3. Fetch College Price Settings
          const collegesQuery = query(
            collection(db, 'colleges'),
            where('name', '==', collegeProfile.collegeName)
          );
          const collegeSnap = await getDocs(collegesQuery);
          if (!collegeSnap.empty) {
            const price = collegeSnap.docs[0].data().price || 1000;
            setCollegePrice(price);
            setCollegePriceMap({ [collegeProfile.collegeName]: price });
          }
        }
      } catch (error) {
        console.error('Error fetching college dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeData();
  }, [collegeProfile]);

  const isDistrictDashboard = collegeProfile?.accessType === 'district';
  const dashboardTitle = isDistrictDashboard
    ? `${collegeProfile?.districtNames?.join(', ') || 'District'} Dashboard`
    : collegeProfile?.collegeName || 'College Dashboard';

  const isPaymentComplete = (student: UserProfile) =>
    student.paymentStatus !== 'rejected' &&
    Boolean(student.isPaid || student.hasPaid || student.paymentStatus === 'success');

  const isWithinDateRange = (value?: string) => {
    if (!value) return false;

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return false;

    const cutoffTime = new Date(`${CURRENT_INTERNSHIP_START_DATE}T00:00:00`).getTime();
    const selectedFromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : cutoffTime;
    const fromTime = Math.max(cutoffTime, selectedFromTime);
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return timestamp >= fromTime && (toTime === null || timestamp <= toTime);
  };

  const visibleStudents = useMemo(
    () => students.filter((student) => isWithinDateRange(student.registrationDate)),
    [students, dateFrom, dateTo]
  );

  const visibleImportedStudents = useMemo(
    () => importedStudents.filter((student: any) => isWithinDateRange(student.importedAt || student.createdAt)),
    [importedStudents, dateFrom, dateTo]
  );

  const paidCount = visibleStudents.filter(isPaymentComplete).length;
  
  // Total pending: All imported students minus those who have paid successfully
  const pendingCount = Math.max(0, visibleImportedStudents.length - paidCount);

  // Total received revenue
  const totalReceivedAmount = visibleStudents
    .filter(isPaymentComplete)
    .reduce((total, student) => total + (collegePriceMap[student.college] || collegePrice), 0);

  // Gender counts from combined sources for completeness
  const maleCount = useMemo(() => {
    const registeredMale = visibleStudents.filter((s) => s.gender?.toLowerCase() === 'male').length;
    const unregisteredImportedMale = visibleImportedStudents.filter(
      (imp) =>
        imp.gender?.toLowerCase() === 'male' &&
        !visibleStudents.some((s) => s.universityRoll === imp.universityRoll)
    ).length;
    return registeredMale + unregisteredImportedMale;
  }, [visibleStudents, visibleImportedStudents]);

  const femaleCount = useMemo(() => {
    const registeredFemale = visibleStudents.filter((s) => s.gender?.toLowerCase() === 'female').length;
    const unregisteredImportedFemale = visibleImportedStudents.filter(
      (imp) =>
        imp.gender?.toLowerCase() === 'female' &&
        !visibleStudents.some((s) => s.universityRoll === imp.universityRoll)
    ).length;
    return registeredFemale + unregisteredImportedFemale;
  }, [visibleStudents, visibleImportedStudents]);

  // Unregistered imported students list
  const unregisteredStudents = useMemo(() => {
    return visibleImportedStudents.filter(
      (imp) => !visibleStudents.some((s) => s.universityRoll === imp.universityRoll)
    );
  }, [visibleStudents, visibleImportedStudents]);

  const allDirectoryStudents = useMemo(
    () => [
      ...visibleStudents.map((student) => ({
        college: student.college,
        course: student.internshipDomain,
        gender: student.gender,
        semester: student.semester,
      })),
      ...unregisteredStudents.map((student) => ({
        college: student.college,
        course: student.course,
        gender: student.gender,
        semester: student.semester,
      })),
    ],
    [visibleStudents, unregisteredStudents]
  );

  const uniqueFilterValues = (key: 'college' | 'course' | 'gender' | 'semester') =>
    Array.from(new Set(allDirectoryStudents.map((student) => String(student[key] || '').trim()).filter(Boolean))).sort();

  // Combined search filtering
  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    return visibleStudents.filter((student) => {
      const searchMatch = !value || [
        student.fullName,
        student.email,
        student.contactNumber,
        student.universityRoll,
        student.internshipDomain,
        student.gender,
      ].join(' ').toLowerCase().includes(value);
      const collegeMatch = !collegeFilter || student.college === collegeFilter;
      const courseMatch = !courseFilter || student.internshipDomain === courseFilter;
      const genderMatch = !genderFilter || student.gender === genderFilter;
      const semesterMatch = !semesterFilter || student.semester === semesterFilter;
      const paymentMatch =
        !paymentFilter ||
        (paymentFilter === 'success' ? isPaymentComplete(student) : !isPaymentComplete(student));
      return searchMatch && collegeMatch && courseMatch && genderMatch && semesterMatch && paymentMatch;
    });
  }, [search, visibleStudents, collegeFilter, courseFilter, genderFilter, semesterFilter, paymentFilter]);

  const filteredUnregistered = useMemo(() => {
    const value = search.trim().toLowerCase();

    return unregisteredStudents.filter((student) => {
      const searchMatch = !value || [
        student.fullName,
        student.email,
        student.contactNumber,
        student.universityRoll,
        student.course,
        student.gender,
      ].join(' ').toLowerCase().includes(value);
      const collegeMatch = !collegeFilter || student.college === collegeFilter;
      const courseMatch = !courseFilter || student.course === courseFilter;
      const genderMatch = !genderFilter || student.gender === genderFilter;
      const semesterMatch = !semesterFilter || student.semester === semesterFilter;
      const paymentStatus = String(student.paymentStatus || 'Pending').toLowerCase();
      const paymentMatch = !paymentFilter || paymentStatus === paymentFilter;
      return searchMatch && collegeMatch && courseMatch && genderMatch && semesterMatch && paymentMatch;
    });
  }, [search, unregisteredStudents, collegeFilter, courseFilter, genderFilter, semesterFilter, paymentFilter]);

  // Course wise report calculations
  const courseReport = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleStudents.forEach((s) => {
      const course = s.internshipDomain || 'Unspecified';
      counts[course] = (counts[course] || 0) + 1;
    });
    unregisteredStudents.forEach((s) => {
      const course = s.course || 'Unspecified';
      counts[course] = (counts[course] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [visibleStudents, unregisteredStudents]);

  // Semester wise report calculations
  const semesterReport = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleStudents.forEach((s) => {
      const sem = s.semester || 'Unspecified';
      counts[sem] = (counts[sem] || 0) + 1;
    });
    unregisteredStudents.forEach((s) => {
      const sem = s.semester || 'Unspecified';
      counts[sem] = (counts[sem] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [visibleStudents, unregisteredStudents]);

  // Date-wise registration counts timeline
  const dateWiseReport = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleStudents.forEach((s) => {
      if (s.registrationDate) {
        const dateStr = new Date(s.registrationDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .slice(0, 7); // Show latest 7 days
  }, [visibleStudents]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const exportCSV = (type: 'registered' | 'pending') => {
    const targetData = type === 'registered' ? filteredStudents : filteredUnregistered;
    if (targetData.length === 0) {
      alert("No data available to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'registered') {
      csvContent += "Roll Number,Student Name,Father Name,Email,Mobile Number,Gender,Course Domain,Semester,Payment Status,Registration Date\n";
      targetData.forEach((student: any) => {
        const row = [
          `"${student.universityRoll || ''}"`,
          `"${student.fullName || ''}"`,
          `"${student.parentName || ''}"`,
          `"${student.email || ''}"`,
          `"${student.contactNumber || ''}"`,
          `"${student.gender || ''}"`,
          `"${student.internshipDomain || ''}"`,
          `"${student.semester || ''}"`,
          `"${isPaymentComplete(student) ? 'Success' : 'Pending'}"`,
          `"${student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : ''}"`
        ].join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Roll Number,Student Name,Father Name,Email,Mobile Number,Gender,Course Domain,Semester,Industrial Reg Number\n";
      targetData.forEach((student: any) => {
        const row = [
          `"${student.universityRoll || ''}"`,
          `"${student.fullName || ''}"`,
          `"${student.parentName || ''}"`,
          `"${student.email || ''}"`,
          `"${student.contactNumber || ''}"`,
          `"${student.gender || ''}"`,
          `"${student.course || ''}"`,
          `"${student.semester || ''}"`,
          `"${student.industrialRegNo || ''}"`
        ].join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `college_${type}_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 select-none font-sans text-left">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight sm:text-xl gradient-text">{dashboardTitle}</h1>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isDistrictDashboard ? 'District Coordinator Console' : 'Teacher & Coordinator Console'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {isDistrictDashboard ? `${collegeProfile?.districtNames?.length || 0} District Access` : `Fee Rate: ₹${collegePrice}`}
            </span>
            <Button onClick={handleLogout} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 shadow-md transition active:scale-98 cursor-pointer">
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-800">
                <Calendar size={16} className="text-indigo-500" />
                Internship Month Filter
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Filter registrations and pending student imports by date.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[1fr_1fr_auto] lg:w-auto">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setDateFrom(CURRENT_INTERNSHIP_START_DATE);
                  setDateTo('');
                  setCollegeFilter('');
                  setCourseFilter('');
                  setPaymentFilter('');
                  setGenderFilter('');
                  setSemesterFilter('');
                  setSearch('');
                }}
                className="h-11 self-end rounded-xl bg-slate-100 px-4 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200"
              >
                Clear All
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select value={collegeFilter} onChange={(event) => setCollegeFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="">All Colleges</option>
              {uniqueFilterValues('college').map((college) => <option key={college} value={college}>{college}</option>)}
            </select>
            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="">All Courses</option>
              {uniqueFilterValues('course').map((course) => <option key={course} value={course}>{course}</option>)}
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="">All Payments</option>
              <option value="success">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="">All Genders</option>
              {uniqueFilterValues('gender').map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            <select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="">All Semesters</option>
              {uniqueFilterValues('semester').map((semester) => <option key={semester} value={semester}>{semester}</option>)}
            </select>
          </div>
        </section>
        
        {/* STATS ANALYTICS GRID */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="student-card p-6 bg-white/80 border border-slate-100/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-455">
              <span className="text-[11px] font-black uppercase tracking-widest">Total Registered</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{visibleStudents.length}</h3>
              <p className="text-[10px] text-slate-450 font-bold mt-1">Students completed account creation</p>
            </div>
          </div>

          <div className="student-card p-6 bg-white/80 border border-emerald-100/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-455">Paid Students</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{paidCount}</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Payments capturing success</p>
            </div>
          </div>

          <div className="student-card p-6 bg-white/80 border border-amber-100/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-455">Pending Payments</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{pendingCount}</h3>
              <p className="text-[10px] text-amber-600 font-bold mt-1">Students yet to complete fee payment</p>
            </div>
          </div>

          <div className="student-card p-6 bg-white/80 border border-blue-100/50 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-455">Received Revenue</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{totalReceivedAmount.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-blue-600 font-bold mt-1">
                {isDistrictDashboard ? 'Paid accounts × college fee rate' : 'Paid Accounts × Fee Rate'}
              </p>
            </div>
          </div>
        </section>

        {/* ANALYTICS CHARTS & REPORTS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GENDER & REGISTRATION TRENDS */}
          <div className="student-card p-6 bg-white/80 border border-slate-100/50 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="text-indigo-500 size-4" />
                Gender Demographics
              </h3>
              <p className="text-[10px] font-bold text-slate-400">Total imported and registered students</p>
            </div>

            <div className="space-y-4">
              {/* Male Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-black text-slate-650">
                  <span>Male Students</span>
                  <span>{maleCount}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(maleCount / ((maleCount + femaleCount) || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Female Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-black text-slate-650">
                  <span>Female Students</span>
                  <span>{femaleCount}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(femaleCount / ((maleCount + femaleCount) || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Calendar className="text-indigo-500 size-4" />
                Registration Velocity (Latest)
              </h3>
              {dateWiseReport.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 text-center py-4">No registration timeline records</p>
              ) : (
                <div className="space-y-2">
                  {dateWiseReport.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-bold bg-slate-50/50 p-2 rounded-lg border border-slate-100/30">
                      <span className="text-slate-600">{item.date}</span>
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black text-[10px]">{item.count} Registered</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COURSE-WISE DISTRIBUTION REPORT */}
          <div className="student-card p-6 bg-white/80 border border-slate-100/50 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="text-indigo-500 size-4" />
                Course Domain Report
              </h3>
              <p className="text-[10px] font-bold text-slate-400">Student enrollment distribution across training domains</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {courseReport.map((course) => (
                <div key={course.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-black text-slate-650">
                    <span className="truncate max-w-[190px]">{course.name}</span>
                    <span>{course.count} ({course.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEMESTER-WISE REPORT */}
          <div className="student-card p-6 bg-white/80 border border-slate-100/50 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="text-indigo-500 size-4" />
                Semester-wise Report
              </h3>
              <p className="text-[10px] font-bold text-slate-400">Class breakdown across academic semesters</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {semesterReport.map((sem) => (
                <div key={sem.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-black text-slate-650">
                    <span>{sem.name}</span>
                    <span>{sem.count} ({sem.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${sem.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* STUDENT DIRECTORY CARD */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
          {/* Toolbar and filter headers */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between bg-white/40">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="text-indigo-500 size-5" />
                {isDistrictDashboard ? 'District Student Directories' : 'College Student Directories'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {activeTab === 'registered'
                  ? `Showing ${filteredStudents.length} of ${visibleStudents.length} registered students`
                  : `Showing ${filteredUnregistered.length} of ${unregisteredStudents.length} pending registration students`
                }
              </p>
            </div>
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students..."
                  className="h-11 rounded-2xl pl-10 text-xs font-semibold bg-white border border-slate-200"
                />
              </div>
              <Button
                onClick={() => exportCSV(activeTab)}
                className="w-full sm:w-auto h-11 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-indigo-150/40"
              >
                <Download size={14} />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Directory tabs */}
          <div className="flex border-b border-slate-100 px-5 bg-slate-50/20">
            <button
              onClick={() => { setActiveTab('registered'); setSearch(''); }}
              className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'registered'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <UserCheck size={14} />
              Registered Students ({visibleStudents.length})
            </button>
            <button
              onClick={() => { setActiveTab('pending_reg'); setSearch(''); }}
              className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending_reg'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <Clock size={14} />
              Pending Registration ({unregisteredStudents.length})
            </button>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Syncing Student Directories...</span>
            </div>
          ) : (activeTab === 'registered' ? filteredStudents : filteredUnregistered).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-450 font-bold text-sm bg-white">
              No students found in this category.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full min-w-[950px] table-auto text-xs text-left">
                <thead className="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">Student Details</th>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">Contact Address</th>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">Gender</th>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">University Roll</th>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">Course Track</th>
                    <th className="p-4 font-black uppercase tracking-wider text-slate-500">
                      {activeTab === 'registered' ? 'Registration Date' : 'Import Date'}
                    </th>
                    {activeTab === 'registered' ? (
                      <th className="p-4 font-black uppercase tracking-wider text-slate-500">Payment Status</th>
                    ) : (
                      <th className="p-4 font-black uppercase tracking-wider text-slate-500">Undertaking / Key</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'registered' ? (
                    filteredStudents.map((student) => {
                      const paymentComplete = isPaymentComplete(student);
                      return (
                        <tr key={student.uid} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-slate-900 text-sm">{student.fullName}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{student.department || student.subject || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Mail size={12} className="text-slate-400" />
                              {student.email}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Phone size={12} className="text-slate-400" />
                              {student.contactNumber || '-'}
                            </div>
                          </td>
                          <td className="p-4 text-slate-700 font-bold capitalize">{student.gender || '-'}</td>
                          <td className="p-4 text-slate-900 font-black tracking-wide">{student.universityRoll || '-'}</td>
                          <td className="p-4">
                            <div className="font-black text-indigo-600">{student.internshipDomain || '-'}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{student.semester}</div>
                          </td>
                          <td className="p-4 text-slate-700 font-bold">{formatListDate(student.registrationDate)}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border ${
                              paymentComplete
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {paymentComplete ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {paymentComplete ? 'Paid Success' : 'Unpaid / Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    filteredUnregistered.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-black text-slate-900 text-sm">{student.fullName}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">S/o: {student.parentName || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Mail size={12} className="text-slate-400" />
                            {student.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Phone size={12} className="text-slate-400" />
                            {student.contactNumber || '-'}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 font-bold capitalize">{student.gender || '-'}</td>
                        <td className="p-4 text-slate-900 font-black tracking-wide">{student.universityRoll || '-'}</td>
                        <td className="p-4">
                          <div className="font-black text-indigo-600">{student.course || '-'}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">{student.semester}</div>
                        </td>
                        <td className="p-4 text-slate-700 font-bold">{formatListDate(student.importedAt)}</td>
                        <td className="p-4">
                          <span className="font-mono text-indigo-600 font-bold bg-indigo-50/80 px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
                            {student.industrialRegNo}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
