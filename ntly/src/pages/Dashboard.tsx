import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { loadImageAsDataUrl } from '../lib/offerLetterPdf';
import { signOut } from 'firebase/auth';
import {
  BookOpen,
  FileCheck,
  FileText,
  UserCircle,
  Download,
  Video,
  Award,
  ChevronRight,
  Receipt,
  GraduationCap,
  Sparkles,
  Bell,
  Menu,
  X,
  BarChart2,
  LogOut,
  Home,
  MessageSquare,
  Folder,
  HelpCircle,
  Headphones,
  SlidersHorizontal,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import { Button } from '../components/ui/button';

const MainDashboard = lazy(() => import('./dashboard/MainDashboard'));
const OfferLetter = lazy(() => import('./dashboard/OfferLetter'));
const LMS = lazy(() => import('./dashboard/LMS'));
const Assignments = lazy(() => import('./dashboard/Assignments'));
const Profile = lazy(() => import('./dashboard/Profile'));
const Certifications = lazy(() => import('./dashboard/Certifications'));
const Reports = lazy(() => import('./dashboard/Reports'));
const Messages = lazy(() => import('./dashboard/Messages'));
const Support = lazy(() => import('./dashboard/Support'));
const InternshipLogbook = lazy(() => import('./dashboard/InternshipLogbook'));
const Progress = lazy(() => import('./dashboard/Progress'));

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-200/80 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
      <Sparkles className="w-8 h-8 text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title} Page</h2>
    <p className="text-gray-500 max-w-sm">We are working hard to bring this feature to you. Please check back later!</p>
  </div>
);

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const [learningProgress, setLearningProgress] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showManualPaymentOverlay, setShowManualPaymentOverlay] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const isSubUserAutoVerifiedStudent = Boolean(profile?.autoVerifiedBySubUser || profile?.createdBySubUserId);

  const fetchUnreadCount = async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, 'notifications'));
      const snap = await getDocs(q);
      const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
      const activeNotifications = snap.docs.filter(d => d.data().isActive !== false);
      const unread = activeNotifications.filter(d => !readIds.includes(d.id)).length;
      setUnreadMessagesCount(unread);
    } catch (e) {
      console.error('Error fetching unread count in Dashboard:', e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleStorageChange = () => {
      fetchUnreadCount();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!user) return;
    const fetchPayment = async () => {
      const q = query(collection(db, 'payments'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const records = snap.docs
          .map((paymentDoc) => ({ id: paymentDoc.id, ...paymentDoc.data() } as any))
          .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
        const razorpayRecord = records.find((record) =>
          record.status === 'success' &&
          record.paymentMethod !== 'manual' &&
          record.source !== 'manual_admin' &&
          !String(record.razorpayPaymentId || '').startsWith('manual_pay_') &&
          !String(record.razorpayOrderId || '').startsWith('manual_order_')
        );
        setPaymentRecord(razorpayRecord || records[0]);
      }
    };
    fetchPayment();
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.internshipDomain) {
      setLearningProgress(0);
      return;
    }

    const fetchLearningProgress = async () => {
      const course = profile.internshipDomain;
      const videosQuery = query(
        collection(db, 'dailyVideos'),
        where('course', '==', course)
      );
      const videosSnapshot = await getDocs(videosQuery);
      const uploadedDays = new Set(
        videosSnapshot.docs
          .map((videoDoc) => String(videoDoc.data().day || '').trim())
          .filter(Boolean)
      );

      if (uploadedDays.size === 0) {
        setLearningProgress(0);
        return;
      }

      const progressRef = doc(db, 'userVideoProgress', `${user.uid}-${course}`);
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid),
        where('course', '==', course)
      );
      const [progressSnapshot, attendanceSnapshot] = await Promise.all([
        getDoc(progressRef),
        getDocs(attendanceQuery)
      ]);

      const completedDays = new Set<string>();
      if (progressSnapshot.exists()) {
        const completedVideos = progressSnapshot.data().completedVideos || {};
        Object.entries(completedVideos).forEach(([day, completed]) => {
          const normalizedDay = String(day).trim();
          if (completed && uploadedDays.has(normalizedDay)) {
            completedDays.add(normalizedDay);
          }
        });
      }

      attendanceSnapshot.docs.forEach((attendanceDoc) => {
        const normalizedDay = String(attendanceDoc.data().day || '').trim();
        if (uploadedDays.has(normalizedDay)) {
          completedDays.add(normalizedDay);
        }
      });

      const progress = Math.round((completedDays.size / uploadedDays.size) * 100);
      setLearningProgress(progress);

      if (profile.progress !== progress) {
        await updateDoc(doc(db, 'users', user.uid), {
          progress,
          totalHoursCompleted: completedDays.size
        });
      }
    };

    fetchLearningProgress().catch((error) => {
      console.error('Error fetching learning progress:', error);
      setLearningProgress(profile?.progress || 0);
    });
  }, [user, profile?.internshipDomain, profile?.progress]);

  const downloadPaymentSlip = async () => {
    if (isSubUserAutoVerifiedStudent) {
      setShowManualPaymentOverlay(true);
      return;
    }

    const isManualPayment =
      paymentRecord?.paymentMethod === 'manual' ||
      paymentRecord?.source === 'manual_admin' ||
      String(paymentRecord?.razorpayPaymentId || '').startsWith('manual_pay_') ||
      String(paymentRecord?.razorpayOrderId || '').startsWith('manual_order_');

    if (isManualPayment) {
      setShowManualPaymentOverlay(true);
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, ML = 14, MR = 14;

    const name = profile?.fullName || 'N/A';
    const email = profile?.email || 'N/A';
    const contact = profile?.contactNumber || 'N/A';
    const college = profile?.college || 'N/A';
    const dept = profile?.department || 'N/A';
    const domain = profile?.internshipDomain || 'N/A';
    const roll = profile?.universityRoll || 'N/A';
    const paymentId = paymentRecord?.razorpayPaymentId || 'N/A';
    const orderId = paymentRecord?.razorpayOrderId || 'N/A';
    const amountValue = Number(paymentRecord?.amount || 0);
    const amount = amountValue > 0 ? `Rs. ${amountValue.toLocaleString('en-IN')}.00` : 'Rs. 700.00';
    const paidOn = paymentRecord?.timestamp
      ? new Date(paymentRecord.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';

    try {
      const [headerImg, footerImg] = await Promise.all([
        loadImageAsDataUrl('/receipt_header.png', 'image/jpeg'),
        loadImageAsDataUrl('/receipt_footer.png', 'image/jpeg')
      ]);

      // Render custom header image (1024x263 aspect ratio ~3.89, W=210 -> H=54)
      doc.addImage(headerImg, 'JPEG', 0, 0, W, 54);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Receipt No: ${paymentId}`, ML, 66);
      doc.text(`Date: ${paidOn}`, W - MR, 66, { align: 'right' });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(ML, 70, W - MR, 70);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.text('STUDENT DETAILS', ML, 79);
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(ML, 81, ML + 38, 81);

      const studentRows: [string, string][] = [
        ['Full Name', name],
        ['Email Address', email],
        ['Contact Number', contact],
        ['University Reg No.', roll],
        ['College / Institution', college],
        ['Department', dept],
        ['Internship Domain', domain],
      ];

      let y = 89;
      doc.setLineWidth(0.2);
      doc.setDrawColor(226, 232, 240);
      studentRows.forEach(([label, value], i) => {
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(ML, y - 4, W - ML - MR, 7, 'F');
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, ML + 2, y);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(value, ML + 58, y);
        y += 7;
      });

      y += 8;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175);
      doc.text('PAYMENT DETAILS', ML, y);
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(ML, y + 2, ML + 40, y + 2);

      y += 10;
      const payRows: [string, string][] = [
        ['Payment ID', paymentId],
        ['Order ID', orderId],
        ['Amount Paid', amount],
        ['Payment Mode', 'Razorpay (Online)'],
        ['Payment Status', 'SUCCESS'],
        ['Purpose', 'Internship Registration Fee'],
      ];

      payRows.forEach(([label, value], i) => {
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(ML, y - 4, W - ML - MR, 7, 'F');
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, ML + 2, y);
        doc.setFont('Helvetica', label === 'Payment Status' ? 'bold' : 'normal');
        doc.setTextColor(label === 'Payment Status' ? 22 : 15, label === 'Payment Status' ? 163 : 23, label === 'Payment Status' ? 74 : 42);
        doc.text(value, ML + 58, y);
        y += 7;
      });

      y += 10;
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
      doc.setLineWidth(0.4);
      doc.roundedRect(ML, y, W - ML - MR, 14, 2, 2, 'FD');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(22, 163, 74);
      doc.text(`PAYMENT CONFIRMED - ${amount} received successfully.`, W / 2, y + 8, { align: 'center' });

      y += 24;
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text('This is a computer-generated receipt and does not require a physical signature.', W / 2, y, { align: 'center' });
      doc.text('For queries: info@internmitra.com | 9693921517', W / 2, y + 5, { align: 'center' });

      // Render custom footer image (1024x62 aspect ratio ~16.45, W=210 -> H=13)
      doc.addImage(footerImg, 'JPEG', 0, 297 - 13, W, 13);
    } catch (err) {
      console.error('Error loading receipt assets:', err);
      // Fallback text header if images fail to load
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, W, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('InternMitra', ML, 14);
    }

    doc.save(`InternMitra_Payment_Slip_${name.replace(/\s+/g, '_')}.pdf`);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Course', path: '/dashboard/lms', icon: GraduationCap },
    { name: 'Assignments', path: '/dashboard/assignments', icon: FileCheck },
    { name: 'Certifications', path: '/dashboard/certs', icon: Award },
    { name: 'Reports', path: '/dashboard/reports', icon: FileText },
    { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare, badge: unreadMessagesCount || undefined },
    { name: 'Help & Support', path: '/dashboard/help', icon: HelpCircle },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/profile')) return 'Profile';
    if (location.pathname.includes('/offer-letter')) return 'Offer Letter';
    if (location.pathname.includes('/internship-logbook')) return 'Internship Logbook';
    const activeItem = menuItems.find(item => isLinkActive(item.path));
    return activeItem ? activeItem.name : 'Dashboard';
  };

  const sidebarContent = (isMobile = false) => (
    <div className={`flex flex-col h-full select-none ${isMobile ? 'justify-start gap-3' : 'justify-between'}`}>
      <div className={isMobile ? 'shrink-0' : ''}>
        {/* Brand Logo */}
        <div className={`flex items-center justify-center border-b border-gray-100 ${isMobile ? 'pb-3' : 'pb-4'}`}>
          <Link to="/dashboard" onClick={() => isMobile && setIsSidebarOpen(false)} className="flex items-center justify-center group w-full">
            <img
              src="/logo-new.jpeg"
              alt="InternMitra Logo"
              className="h-10 w-auto object-contain rounded-xl max-w-full"
            />
          </Link>
        </div>

        {/* Student Mini Profile Card */}
        <div className={`${isMobile ? 'mt-3 p-2.5 rounded-xl' : 'mt-4 p-3 rounded-2xl'} bg-slate-50/80 border border-slate-150 flex items-center gap-3`}>
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm shadow-blue-500/10">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-black text-slate-800 truncate leading-none">
              {profile?.fullName || 'Student Registry'}
            </h5>
            <span className="text-[9px] font-bold text-blue-600 block mt-1.5 uppercase tracking-wider truncate">
              {profile?.internshipDomain || 'Enrolled Student'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`${isMobile ? 'mt-3 space-y-0.5' : 'mt-4 space-y-1'}`}>
          {menuItems.map((item) => {
            const active = isLinkActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 ${isMobile ? 'py-2 rounded-xl' : 'py-2.5 rounded-2xl'} transition-all duration-200 group relative ${
                  active
                    ? 'bg-[#eff6ff] text-blue-600 font-bold'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 font-bold'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    size={17}
                    className={`transition-colors duration-200 ${
                      active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="text-[13.5px]">{item.name}</span>
                </div>
                
                {/* Badge if present */}
                {item.badge ? (
                  <span className="bg-blue-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                ) : (
                  active && <ChevronRight size={13} className="text-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Support Card & Illustration */}
      <div className={`${isMobile ? 'mt-1 pt-3' : 'mt-4 pt-3'} border-t border-gray-100`}>
        <div className={`bg-[#eff6ff] rounded-2xl ${isMobile ? 'p-3' : 'p-3.5'} border border-blue-100/50 relative overflow-hidden`}>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <HelpCircle size={15} />
            <span>Need Help?</span>
          </div>
          <p className="text-[10px] text-slate-505 mt-1 mb-2.5 leading-relaxed">
            We're here to help you in your journey.
          </p>
          <Link
            to="/dashboard/help"
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className="w-full inline-flex h-8 items-center justify-center gap-1.5 bg-white rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 border border-blue-200/50 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Headphones size={11} />
            Contact Support
          </Link>
        </div>

        {/* Beanbag Illustration */}
        <div className={`${isMobile ? 'hidden' : 'flex'} justify-center -mb-2 mt-3`}>
          <img
            src="/beanbag_guy.png"
            alt="Support Illustration"
            className="h-20 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex relative text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 p-3.5">
        <div className="bg-white h-[calc(100vh-1.75rem)] rounded-[1.75rem] border border-gray-200/50 shadow-sm p-5 flex flex-col justify-between overflow-y-auto scrollbar-none">
          {sidebarContent(false)}
        </div>
      </aside>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Content Top Header */}
        <header className="bg-transparent h-20 flex-shrink-0 flex items-center justify-between px-6 sm:px-8 mt-2">
          
          {/* Left Title & Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden h-10 w-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center text-gray-600 active:scale-95 transition shadow-sm cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header Navigation Actions */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <button
              onClick={() => navigate('/dashboard/messages')}
              className="relative h-10 w-10 bg-white hover:bg-slate-50 border border-gray-200/60 rounded-full flex items-center justify-center text-slate-600 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Bell size={18} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* User Profile Info Dropdown Trigger */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                className="flex items-center gap-3 bg-white pl-3 pr-4 py-1.5 rounded-full border border-gray-200/60 hover:bg-slate-50 shadow-sm active:scale-98 transition cursor-pointer"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <h4 className="text-xs font-black text-slate-900 leading-none">
                    {profile?.fullName || 'Learner'}
                  </h4>
                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">
                    Student
                  </p>
                </div>
                
                {/* User Initials Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {profile?.fullName?.charAt(0).toUpperCase() || 'S'}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-gray-150 shadow-lg p-2 z-50 origin-top-right"
                  >
                    <Link
                      onClick={() => setIsProfileMenuOpen(false)}
                      to="/dashboard"
                      className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      onClick={() => setIsProfileMenuOpen(false)}
                      to="/dashboard/profile"
                      className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      Profile
                    </Link>
                    {paymentRecord && !isSubUserAutoVerifiedStudent && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          downloadPaymentSlip();
                        }}
                        className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 text-left cursor-pointer"
                      >
                        Payment Slip
                      </button>
                    )}
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut(auth);
                        navigate('/login');
                      }}
                      className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 text-left cursor-pointer"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* 3. Subpage Content Router Outlet */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 pb-12 scrollbar-none">
          <div className="w-full h-full">
            <Suspense fallback={
              <div className="bg-white rounded-3xl p-12 text-center font-bold text-slate-400 shadow-sm border border-gray-200/50">
                Loading Workspace...
              </div>
            }>
              <Routes>
                <Route index element={<MainDashboard />} />
                <Route path="offer-letter" element={<OfferLetter />} />
                <Route path="lms/*" element={<LMS />} />
                <Route path="course" element={<Progress />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="certs" element={<Certifications />} />
                <Route path="reports" element={<Reports />} />
                <Route path="internship-logbook" element={<InternshipLogbook />} />
                <Route path="profile" element={<Profile />} />
                <Route path="messages" element={<Messages />} />
                <Route path="resources" element={<PlaceholderPage title="Resources" />} />
                <Route path="help" element={<Support />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>

      {/* 4. Mobile Sliding Sidebar Side-drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white p-4 border-r border-gray-200 flex flex-col overflow-y-auto"
            >
              {sidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManualPaymentOverlay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-50/70">
                <Receipt size={26} />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-900">Payment Slip Not Available</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                This registration was verified without an online Razorpay payment. Payment slips can be downloaded only for payments completed through Razorpay.
              </p>
              <Button
                onClick={() => setShowManualPaymentOverlay(false)}
                className="mt-6 h-11 w-full rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800"
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
