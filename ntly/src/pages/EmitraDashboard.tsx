import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  ArrowRight, CheckCircle2, Clock, LogOut, Mail, Phone, Plus, Users,
  Percent, Circle, ShieldCheck, Calendar, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, User, ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CURRENT_INTERNSHIP_START_DATE } from '../lib/constants';

interface EmitraStudent {
  uid: string;
  fullName: string;
  email: string;
  contactNumber: string;
  college: string;
  internshipDomain: string;
  gender?: string;
  semester?: string;
  isPaid: boolean;
  registrationDate: string;
}

interface Payment {
  userId: string;
  createdByEmitraId?: string | null;
  amount: number;
  status: string;
}

const DEFAULT_COMMISSION_PERCENTAGE = 5;

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.321 5.325 0 11.866 0c3.171.001 6.151 1.237 8.391 3.479 2.24 2.24 3.473 5.222 3.471 8.397-.003 6.541-5.325 11.862-11.866 11.862-2.001-.001-3.97-.507-5.713-1.47L0 24zm6.59-15.659c-.224-.498-.46-.508-.673-.517-.174-.007-.373-.007-.573-.007-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.149.2 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
  </svg>
);

export default function EmitraDashboard() {
  const { user, emitraProfile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<EmitraStudent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(CURRENT_INTERNSHIP_START_DATE);
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('createdByEmitraId', '==', user.uid)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs
        .map((studentDoc) => ({
          uid: studentDoc.id,
          ...studentDoc.data()
        } as EmitraStudent))
        .sort((a, b) => (b.registrationDate || '').localeCompare(a.registrationDate || ''));
      setStudents(studentsData);

      const paymentsSnapshot = await getDocs(query(
        collection(db, 'payments'),
        where('createdByEmitraId', '==', user.uid)
      ));
      setPayments(paymentsSnapshot.docs.map((paymentDoc) => paymentDoc.data() as Payment));
    } catch (error) {
      console.error('Error loading Emitra students:', error);
    } finally {
      setLoading(false);
    }
  };

  const successfulPaymentIds = useMemo(
    () => new Set(payments.filter((payment) => payment.status === 'success').map((payment) => payment.userId)),
    [payments]
  );

  const isStudentPaid = (student: EmitraStudent) => student.isPaid || successfulPaymentIds.has(student.uid);
  const currentBatchStudents = useMemo(
    () => students.filter((student) => {
      if (!student.registrationDate) return false;
      return new Date(student.registrationDate).getTime() >= new Date(`${CURRENT_INTERNSHIP_START_DATE}T00:00:00`).getTime();
    }),
    [students]
  );
  const currentBatchStudentIds = useMemo(
    () => new Set(currentBatchStudents.map((student) => student.uid)),
    [currentBatchStudents]
  );
  const paidStudents = currentBatchStudents.filter(isStudentPaid);
  const totalPaidAmount = payments
    .filter((payment) => payment.status === 'success' && currentBatchStudentIds.has(payment.userId))
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  const commissionPercentage = emitraProfile?.commissionPercentage || DEFAULT_COMMISSION_PERCENTAGE;
  const estimatedCommission = Math.round(totalPaidAmount * (commissionPercentage / 100));

  const uniqueColleges = useMemo(
    () => Array.from(new Set(currentBatchStudents.map((student) => student.college).filter(Boolean))).sort(),
    [currentBatchStudents]
  );
  const uniqueDomains = useMemo(
    () => Array.from(new Set(currentBatchStudents.map((student) => student.internshipDomain).filter(Boolean))).sort(),
    [currentBatchStudents]
  );

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();
    return currentBatchStudents.filter((student) => {
      const searchMatch = !value || [
        student.fullName,
        student.email,
        student.contactNumber,
        student.college,
        student.internshipDomain,
      ].join(' ').toLowerCase().includes(value);
      const collegeMatch = !collegeFilter || student.college === collegeFilter;
      const domainMatch = !domainFilter || student.internshipDomain === domainFilter;
      const paymentMatch =
        !paymentFilter ||
        (paymentFilter === 'success' ? isStudentPaid(student) : !isStudentPaid(student));
      const timestamp = student.registrationDate ? new Date(student.registrationDate).getTime() : null;
      const fromMatch = !dateFrom || (timestamp !== null && timestamp >= new Date(`${dateFrom}T00:00:00`).getTime());
      const toMatch = !dateTo || (timestamp !== null && timestamp <= new Date(`${dateTo}T23:59:59`).getTime());
      return searchMatch && collegeMatch && domainMatch && paymentMatch && fromMatch && toMatch;
    });
  }, [currentBatchStudents, search, collegeFilter, domainFilter, paymentFilter, dateFrom, dateTo, successfulPaymentIds]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['UID', 'Full Name', 'Email', 'Contact Number', 'College', 'Internship Domain', 'Payment Status', 'Registration Date'];
    const rows = filteredStudents.map(s => [
      s.uid,
      s.fullName,
      s.email,
      s.contactNumber,
      s.college,
      s.internshipDomain,
      isStudentPaid(s) ? 'Success' : 'Pending',
      s.registrationDate ? new Date(s.registrationDate).toLocaleDateString('en-IN') : '-'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registered_students_${user?.uid}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination helper
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center select-none font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Cyber Cafe Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] select-none font-sans text-left pb-0">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/emitra-dashboard" className="flex items-center gap-3">
            <img src="/logo-new.jpeg" alt="InternMitra" className="h-11 w-auto rounded-xl border border-slate-100" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-600 leading-none">Cyber Cafe Portal</p>
              <h1 className="text-sm font-black uppercase text-slate-900 mt-1">{emitraProfile?.centerName || 'Cyber Cafe Portal'}</h1>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/emitra/register-student">
              <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition">
                <Plus size={15} />
                Add Student
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" className="h-11 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm transition border-slate-200 hover:bg-slate-50 text-slate-700">
              <LogOut size={15} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* STATISTICS STAT CARDS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-2.5xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner-sm">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Students</span>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 leading-none">{currentBatchStudents.length}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">All registered students</p>
              </div>
            </div>
            {/* Small decorative line chart */}
            <svg className="w-16 h-8 text-blue-500/20 opacity-70 shrink-0 self-end mb-2" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0,30 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>

          {/* Card 2: Paid Students */}
          <div className="bg-white rounded-2.5xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-inner-sm">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid Students</span>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 leading-none">{paidStudents.length}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Payment completed</p>
              </div>
            </div>
            {/* Small decorative line chart */}
            <svg className="w-16 h-8 text-emerald-500/20 opacity-70 shrink-0 self-end mb-2" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0,35 Q15,25 30,30 T60,10 T90,20 T100,8" />
            </svg>
          </div>

          {/* Card 3: Commission Rate */}
          <div className="bg-white rounded-2.5xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-inner-sm">
                  <Percent size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Rate</span>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 leading-none">{commissionPercentage}%</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Default commission</p>
              </div>
            </div>
            {/* Small decorative line chart */}
            <svg className="w-16 h-8 text-amber-500/20 opacity-70 shrink-0 self-end mb-2" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0,28 Q25,38 50,15 T100,30" />
            </svg>
          </div>

          {/* Card 4: Estimated Commission */}
          <div className="bg-white rounded-2.5xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner-sm">
                  <span className="text-base font-black">₹</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Commission</span>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 leading-none">₹{estimatedCommission.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Total estimated earnings</p>
              </div>
            </div>
            {/* Small decorative line chart */}
            <svg className="w-16 h-8 text-blue-500/20 opacity-70 shrink-0 self-end mb-2" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0,30 Q20,10 40,25 T80,15 T100,5" />
            </svg>
          </div>

        </section>

        {/* REGISTERED STUDENTS TABLE CARD */}
        <section className="bg-white rounded-2.5xl border border-slate-200/60 shadow-sm overflow-hidden text-left">
          
          {/* Card Header bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50 mt-0.5">
                <User size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Registered Students</h2>
                <p className="mt-1 text-xs font-semibold text-slate-450 leading-relaxed">
                  Only students registered from this Cyber cafe login appear here.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="px-3.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200/30">
                {filteredStudents.length} of {currentBatchStudents.length} Total
              </span>
              
              <Button 
                onClick={handleExportCSV} 
                disabled={filteredStudents.length === 0}
                variant="outline"
                className="h-10 rounded-xl border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 transition active:scale-95 shadow-sm hover:bg-slate-50 cursor-pointer"
              >
                <ArrowDownToLine size={14} />
                Export
              </Button>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/30 p-5">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                placeholder="Search name, email, mobile..."
                className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold lg:col-span-2"
              />
              <select
                value={collegeFilter}
                onChange={(event) => { setCollegeFilter(event.target.value); setCurrentPage(1); }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
              >
                <option value="">All Colleges</option>
                {uniqueColleges.map((college) => <option key={college} value={college}>{college}</option>)}
              </select>
              <select
                value={domainFilter}
                onChange={(event) => { setDomainFilter(event.target.value); setCurrentPage(1); }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
              >
                <option value="">All Domains</option>
                {uniqueDomains.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
              </select>
              <select
                value={paymentFilter}
                onChange={(event) => { setPaymentFilter(event.target.value); setCurrentPage(1); }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
              >
                <option value="">All Payments</option>
                <option value="success">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <Button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCollegeFilter('');
                  setDomainFilter('');
                  setPaymentFilter('');
                  setDateFrom(CURRENT_INTERNSHIP_START_DATE);
                  setDateTo('');
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200"
              >
                Clear
              </Button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:w-1/2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => { setDateFrom(event.target.value); setCurrentPage(1); }}
                className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => { setDateTo(event.target.value); setCurrentPage(1); }}
                className="h-11 rounded-xl border-slate-200 bg-white text-xs font-bold"
              />
            </div>
          </div>

          {/* Table content list */}
          {currentBatchStudents.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <Users size={32} />
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-slate-700">No current internship students yet</p>
                <p className="text-xs font-semibold text-slate-400">Only registrations from 20 July 2026 onward appear here.</p>
              </div>
              <Link to="/emitra/register-student" className="inline-flex pt-2">
                <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-1.5 shadow-sm">
                  <Plus size={15} />
                  Register First Student
                </Button>
              </Link>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="font-extrabold text-sm text-slate-700">No students match these filters</p>
              <p className="text-xs font-semibold text-slate-400">Clear filters or adjust your search to see more records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50/55 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Student</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Contact</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">College</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Domain</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Payment</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Registered On</th>
                    <th className="text-left p-4.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((student) => {
                    const isPaid = student.isPaid || successfulPaymentIds.has(student.uid);
                    
                    // Format registration date and time
                    let formattedDate = '-';
                    let formattedTime = '';
                    if (student.registrationDate) {
                      const d = new Date(student.registrationDate);
                      formattedDate = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
                      formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    }

                    return (
                      <tr key={student.uid} className="hover:bg-blue-50/15 transition-colors">
                        
                        {/* Student profile column */}
                        <td className="p-4.5">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 font-bold text-xs">
                              {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm leading-snug">{student.fullName}</div>
                              <div className="text-[10px] font-semibold text-slate-400 tracking-tight leading-none mt-0.5">{student.uid}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact details */}
                        <td className="p-4.5">
                          <div className="space-y-1 text-left">
                            <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors leading-none">
                              <Mail size={13} className="text-slate-350 shrink-0" />
                              {student.email}
                            </a>
                            <a href={`tel:${student.contactNumber}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors leading-none pt-0.5">
                              <Phone size={13} className="text-slate-350 shrink-0" />
                              {student.contactNumber}
                            </a>
                          </div>
                        </td>

                        {/* College and district/affiliate */}
                        <td className="p-4.5">
                          <div className="text-xs font-bold text-slate-600 leading-normal max-w-[180px] break-words">
                            {student.college}
                          </div>
                        </td>

                        {/* Internship Domain */}
                        <td className="p-4.5">
                          <div className="text-xs font-black text-slate-700 leading-normal max-w-[155px] break-words">
                            {student.internshipDomain}
                          </div>
                        </td>

                        {/* Payment Status badge details */}
                        <td className="p-4.5">
                          <div className="space-y-0.5 text-left">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isPaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              <Circle size={5} className={`fill-current ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`} />
                              {isPaid ? 'Success' : 'Pending'}
                            </span>
                            <p className="text-[9px] text-slate-400 font-bold leading-none pl-1">
                              {isPaid ? 'Payment completed' : 'Awaiting payment'}
                            </p>
                          </div>
                        </td>

                        {/* Registration date and time calendar */}
                        <td className="p-4.5">
                          <div className="flex gap-2 items-start text-left text-xs font-bold text-slate-500">
                            <Calendar size={13} className="text-slate-350 shrink-0 mt-0.5" />
                            <div>
                              <div className="leading-tight text-slate-800">{formattedDate}</div>
                              {formattedTime && <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{formattedTime}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Status badge active */}
                        <td className="p-4.5">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        </td>



                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table pagination & footer controls */}
          {filteredStudents.length > 0 && (
            <div className="p-4.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
              
              {/* Show Entries Dropdown */}
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1); // Re-trigger on change
                  }}
                  className="h-8 border border-slate-200 bg-white rounded-lg px-2 text-xs font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-slate-450 font-bold">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)} to {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} entries
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                        currentPage === idx + 1 
                          ? 'bg-blue-600 border border-blue-650 text-white shadow-sm shadow-blue-500/10' 
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          )}

        </section>

        {/* BOTTOM WHATSAPP NOTIFICATION CONTAINER */}
        <section className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
          
          <div className="flex items-center gap-4 relative z-10 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/10">
              <WhatsAppIcon size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 leading-tight">Stay Connected on WhatsApp</h3>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                Join our WhatsApp channel for important updates, alerts and support.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start gap-2 relative z-10 shrink-0 w-full md:w-auto">
            <a
              href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black uppercase tracking-wider px-6 text-xs shadow-md transition active:scale-95 cursor-pointer w-full md:w-auto text-center"
            >
              <WhatsAppIcon size={14} />
              Join WhatsApp Channel <ArrowRight size={14} />
            </a>
            <span className="text-[10px] text-slate-400 font-bold self-center md:self-start">
              Get instant notifications and never miss an update
            </span>
          </div>

          {/* Right SVG graphic decoration: Floating Blue bell notification inside phone mockup */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-full hidden lg:flex items-center justify-center pointer-events-none opacity-90">
            <svg viewBox="0 0 150 150" className="w-full h-full">
              {/* dashed lines */}
              <path d="M10,80 Q50,40 100,60" fill="none" stroke="#dbeafe" strokeWidth="2" strokeDasharray="4 4" />
              {/* Phone mockup */}
              <rect x="75" y="20" width="55" height="110" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3" />
              <rect x="80" y="30" width="45" height="90" rx="4" fill="white" />
              {/* Speaker */}
              <line x1="95" y1="25" x2="110" y2="25" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              {/* Floating notification badge */}
              <circle cx="65" cy="55" r="18" fill="#3b82f6" className="animate-bounce" style={{ animationDuration: '3s' }} />
              {/* Bell symbol inside bubble */}
              <path d="M65,47 L65,47 C68,47 69,50 69,53 L69,56 L71,58 L71,59 L59,59 L59,58 L61,56 L61,53 C61,50 62,47 65,47 Z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 0)" />
              <path d="M63.5,61 C63.5,62.5 64.5,63 65,63 C65.5,63 66.5,62.5 66.5,61" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </section>

        {/* Center security warning line */}
        <div className="text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-blue-500 shrink-0" />
          <span>Your data is safe and secure with us. We respect your privacy and ensure a smooth experience.</span>
        </div>

      </main>

    </div>
  );
}
