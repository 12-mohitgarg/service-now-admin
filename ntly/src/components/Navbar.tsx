import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User, LogOut, Menu, X, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function Navbar() {
  const { user, isAdmin, isEmitra } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Features', path: '/features' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-md border-b border-slate-200/80 py-2.5'
            : 'bg-white/80 backdrop-blur-md border-b border-slate-100 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16 gap-4">
            
            {/* Clean Logo Only Section */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5"
              >
                <img
                  src="/logo-new.jpeg"
                  alt="InternMitra Logo"
                  className="h-10 md:h-12 w-auto object-contain rounded-xl shadow-sm border border-slate-200/80 transition-shadow group-hover:shadow-md"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 bg-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <Link to="/admin-dashboard">
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 h-10 text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard size={15} />
                        <span>Admin Panel</span>
                      </Button>
                    </Link>
                  ) : isEmitra ? (
                    <Link to="/emitra-dashboard">
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 h-10 text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                        <User size={15} />
                        <span>Cyber Cafe Panel</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/dashboard">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 h-10 text-xs font-extrabold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer">
                        <User size={15} />
                        <span>Student Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 w-10 transition-all cursor-pointer"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-extrabold uppercase text-xs tracking-wider rounded-xl px-5 h-10 transition-all cursor-pointer"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl px-6 h-10 font-black uppercase text-xs tracking-wider shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5">
                      <span>Register</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center gap-2">
              {!user && (
                <div className="flex items-center gap-1.5">
                  <Link to="/login">
                    <button
                      type="button"
                      className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-black text-[10px] uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      Login
                    </button>
                  </Link>
                  <Link to="/register">
                    <button
                      type="button"
                      className="h-9 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      Register
                    </button>
                  </Link>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Nav Side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 flex flex-col justify-between border-l border-slate-100 z-[10000] overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <img src="/logo-new.jpeg" alt="Logo" className="h-9 w-auto rounded-lg border" />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`text-sm font-extrabold px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{link.name}</span>
                        {isActive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </Link>
                    );
                  })}
                </div>

                {!user && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all text-center"
                    >
                      <LogIn size={15} />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-black uppercase tracking-wider text-white shadow-md hover:opacity-95 transition-all text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                {user ? (
                  <>
                    {isAdmin ? (
                      <Link
                        to="/admin-dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all text-center"
                      >
                        <LayoutDashboard size={16} /> Admin Dashboard
                      </Link>
                    ) : isEmitra ? (
                      <Link
                        to="/emitra-dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all text-center"
                      >
                        <User size={16} /> Cyber Cafe Panel
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-blue-500 transition-all text-center"
                      >
                        <User size={16} /> Student Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-xs font-black uppercase tracking-wider text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-black uppercase tracking-wider text-white shadow-md hover:opacity-95 transition-all text-center"
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
