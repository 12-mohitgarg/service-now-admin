import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  LayoutDashboard,
  MapPin,
  GraduationCap,
  BookOpen,
  Building2,
  List,
  Youtube,
  ChevronRight,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Users,
  ListPlus,
  KeyRound,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type AdminMenuSection = {
  title: string;
  path?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subItems?: Array<{
    name: string;
    path: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }>;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { adminProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const topMenuRef = useRef<HTMLDivElement | null>(null);
  const isTeacher = adminProfile?.role === 'teacher';
  const isSubUser = adminProfile?.role === 'sub_user';

  // Expanded states for menu sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Academic Settings': true,
    'Course Management': true,
    'Geography Settings': true
  });

  const handleLogout = async () => {
    try {
      setIsTopMenuOpen(false);
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    if (!isTopMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!topMenuRef.current?.contains(event.target as Node)) {
        setIsTopMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isTopMenuOpen]);

  const dashboardMenuSection: AdminMenuSection = {
    title: 'Dashboard',
    path: '/admin-dashboard',
    icon: LayoutDashboard
  };

  const menuSections: AdminMenuSection[] = isSubUser ? [
    dashboardMenuSection
  ] : [
    dashboardMenuSection,
    {
      title: 'Academic Settings',
      icon: GraduationCap,
      subItems: [
        { name: 'Universities', path: '/admin/universities', icon: Building2 },
        { name: 'Colleges', path: '/admin/colleges', icon: GraduationCap },
        { name: 'Bulk Add Colleges', path: '/admin/bulk-colleges', icon: ListPlus },
        { name: 'Subjects', path: '/admin/subjects', icon: List },
        { name: 'Import Students', path: '/admin/import-students', icon: Upload }
      ]
    },
    {
      title: 'Course Management',
      icon: BookOpen,
      subItems: [
        { name: 'Courses', path: '/admin/courses', icon: BookOpen },
        { name: 'Daily Videos', path: '/admin/daily-videos', icon: Youtube }
      ]
    },
    {
      title: 'Geography Settings',
      icon: MapPin,
      subItems: [
        { name: 'Districts', path: '/admin/districts', icon: MapPin }
      ]
    },
    {
      title: 'Payment Settings',
      path: '/admin/payment-settings',
      icon: KeyRound
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const isSectionActive = (section: any) => {
    if (section.path) return isActive(section.path);
    if (section.subItems) {
      return section.subItems.some((item: any) => isActive(item.path));
    }
    return false;
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col flex-1 overflow-y-auto pr-1">
        {/* User Card */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
              {isTeacher ? 'T' : isSubUser ? 'S' : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-wider text-blue-500">
                {isTeacher ? 'Teacher Portal' : isSubUser ? 'Dashboard Operator' : 'Admin Area'}
              </p>
              <h4 className="truncate text-xs font-bold text-slate-200 mt-0.5" title={adminProfile?.email || 'Administrator'}>
                {adminProfile?.email?.split('@')[0] || 'Admin'}
              </h4>
              <p className="text-[9px] text-slate-500 truncate mt-0.5 font-medium">{adminProfile?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Links */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <Users size={11} className="text-slate-500" />
            Control Center
          </div>
          <nav className="space-y-1">
            {menuSections.map((section) => {
              const active = isSectionActive(section);
              const hasSubItems = !!section.subItems;

              if (!hasSubItems && section.path) {
                return (
                  <Link
                    key={section.title}
                    to={section.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`relative flex items-center justify-between py-3 px-4 rounded-xl transition-all border ${active
                        ? 'bg-blue-500/5 text-blue-400 border-blue-500/25 shadow-sm font-semibold'
                        : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-800/80'
                      }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r" />}
                    <div className="flex items-center space-x-3">
                      <section.icon size={16} className={active ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{section.title}</span>
                    </div>
                  </Link>
                );
              }

              const isOpen = expandedSections[section.title];

              return (
                <div key={section.title} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`relative w-full flex items-center justify-between py-3 px-4 rounded-xl transition border text-left cursor-pointer ${active
                        ? 'bg-blue-500/5 text-blue-400 border-blue-500/10'
                        : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                  >
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r" />}
                    <div className="flex items-center space-x-3">
                      {section.icon && <section.icon size={16} className={active ? 'text-blue-400' : 'text-slate-500'} />}
                      <span className="text-[11px] font-bold uppercase tracking-wider">{section.title}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden pl-3 space-y-1 border-l border-slate-800/80 ml-5"
                      >
                        {section.subItems?.map((item) => {
                          const itemActive = isActive(item.path);
                          return (
                            <Link
                              key={item.name}
                              to={item.path}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center space-x-2.5 py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${itemActive
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/30'
                                }`}
                            >
                              <item.icon size={12} className={itemActive ? 'text-blue-400' : 'text-slate-600'} />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 shrink-0">
        <button
          onClick={() => {
            handleLogout();
            setIsSidebarOpen(false);
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-950/30 transition hover:bg-rose-900/20 cursor-pointer"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50/50 flex flex-col relative">
      {/* Premium Admin Top Header */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-opacity-95 h-20 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Left: Brand Logo & Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <Link to="/admin-dashboard" className="flex items-center gap-2 group shrink-0">
              <div className="shrink-0 w-8 h-8 md:w-auto md:h-auto overflow-hidden flex items-center justify-start rounded-lg">
                <img
                  src="/logo-new.jpeg"
                  alt="Logo"
                  className="h-8 md:h-11 w-auto max-w-none object-contain rounded-lg"
                />
              </div>
              <span className="hidden sm:inline-block text-sm font-black tracking-wider leading-none uppercase italic text-slate-900 font-sans">
                Console<span className="text-blue-600">Center</span>
              </span>
            </Link>
          </div>

          {/* Right: User Profile Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
                {isTeacher ? 'Teacher' : isSubUser ? 'Dashboard Operator' : 'Administrator'}
              </p>
              <h4 className="text-xs font-bold text-slate-800 mt-1 max-w-[150px] truncate leading-none">
                {adminProfile?.email?.split('@')[0] || 'Console'}
              </h4>
            </div>

            <div ref={topMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsTopMenuOpen((open) => !open)}
                aria-expanded={isTopMenuOpen}
                className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black uppercase tracking-widest gap-1.5 active:scale-95 transition-all text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Menu
                <ChevronDown size={13} className={`transition-transform ${isTopMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {/* Dropdown Menu */}
              <AnimatePresence>
                {isTopMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50"
                  >
                    <Link
                      to="/admin-dashboard"
                      onClick={() => setIsTopMenuOpen(false)}
                      className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                    <div className="h-px bg-slate-150 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 text-left cursor-pointer"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </header>

      {/* Main Layout Area: Desktop Sidebar + Main Panel */}
      <div className="h-[calc(100vh-80px)] flex flex-row overflow-hidden relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.04),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(6,182,212,0.03),transparent_30%)]" />

        {/* Desktop Sidebar (Left side, sticky, scrollable menu) */}
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-900 bg-slate-950 p-5 h-full z-20">
          {renderSidebarContent()}
        </aside>

        {/* Mobile Slide Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              {/* Drawer */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-slate-950 text-slate-350 p-6 border-r border-slate-900 flex flex-col justify-between animate-fade-in"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 shrink-0">
                  <span className="text-sm font-extrabold uppercase tracking-widest text-blue-500">Admin Console</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  {renderSidebarContent()}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="relative z-10 h-full w-full flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto h-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
