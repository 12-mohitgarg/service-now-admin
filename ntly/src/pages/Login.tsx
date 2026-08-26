import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { arrayUnion, collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Lock, Mail, AlertCircle, Handshake, Eye, EyeOff,
  AlertTriangle, ShieldCheck, Rocket, Headset, Link2, Users,
  User, Check, IdCard
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.321 5.325 0 11.866 0c3.171.001 6.151 1.237 8.391 3.479 2.24 2.24 3.473 5.222 3.471 8.397-.003 6.541-5.325 11.862-11.866 11.862-2.001-.001-3.97-.507-5.713-1.47L0 24zm6.59-15.659c-.224-.498-.46-.508-.673-.517-.174-.007-.373-.007-.573-.007-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.149.2 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
  </svg>
);

const uniqueIdentifierValues = (value: string) => Array.from(new Set([
  value,
  value.toUpperCase(),
  value.toLowerCase(),
].filter(Boolean)));

export default function Login() {
  const { user, profile, isAdmin, isEmitra, isCollege, adminProfile, loading: authLoading } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !user) return;

    if (isAdmin) {
      navigate(adminProfile?.role === 'teacher' ? '/admin/daily-videos' : '/admin-dashboard', { replace: true });
      return;
    }

    if (isEmitra) {
      navigate('/emitra-dashboard', { replace: true });
      return;
    }

    if (isCollege) {
      navigate('/college-dashboard', { replace: true });
      return;
    }

    if (profile) {
      const paymentComplete = profile.paymentStatus !== 'rejected' && Boolean(profile.isPaid || profile.hasPaid || profile.paymentStatus === 'success');
      navigate(paymentComplete ? '/dashboard' : '/payment', { replace: true });
    }
  }, [user, profile, isAdmin, isEmitra, isCollege, adminProfile?.role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loginId = loginIdentifier.trim();
      let resolvedEmail = loginId.toLowerCase();

      const resolveStudentEmailFromFirestore = async () => {
        const usersRef = collection(db, 'users');
        const phone = loginId.replace(/\D/g, '').slice(-10);
        const lookups = [];

        if (phone.length === 10) {
          lookups.push(getDocs(query(usersRef, where('contactNumber', '==', phone), limit(1))));
        }

        uniqueIdentifierValues(loginId).forEach((value) => {
          lookups.push(getDocs(query(usersRef, where('universityRoll', '==', value), limit(1))));
          lookups.push(getDocs(query(usersRef, where('universityRollNo', '==', value), limit(1))));
        });

        const snapshots = await Promise.all(lookups);
        const matchedDoc = snapshots.find((snapshot) => !snapshot.empty)?.docs[0];
        const email = String(matchedDoc?.data()?.email || '').trim().toLowerCase();

        if (!email) {
          throw new Error('No student account found for this login ID.');
        }

        return email;
      };

      if (!loginId) {
        setError('Please enter email, mobile number, roll number, or registration number.');
        return;
      }

      if (!loginId.includes('@')) {
        try {
          resolvedEmail = await resolveStudentEmailFromFirestore();
        } catch (fallbackError: any) {
          console.warn('Student login Firestore lookup failed, trying API fallback:', fallbackError);
          try {
            const lookupResponse = await fetch('/api/auth/student-login-identifier', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: loginId }),
            });

            const lookupResult = await lookupResponse.json().catch(() => ({}));

            if (!lookupResponse.ok || !lookupResult?.email) {
              throw new Error(lookupResult?.error || 'No student account found for this login ID.');
            }

            resolvedEmail = String(lookupResult.email).trim().toLowerCase();
          } catch (lookupError: any) {
            setError(fallbackError?.message || lookupError?.message || 'No student account found for this login ID.');
            return;
          }
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, password);
      const user = userCredential.user;

      const safeGetDoc = (collectionName: string) =>
        getDoc(doc(db, collectionName, user.uid)).catch((error) => {
          console.warn(`${collectionName} lookup failed:`, error);
          return null;
        });

      if (user.email === 'admin@internmitra.com') {
        navigate('/admin-dashboard', { replace: true });
        return;
      }

      const [adminDoc, emitraDoc, collegeDoc, userDoc] = await Promise.all([
        safeGetDoc('admins'),
        safeGetDoc('emitras'),
        safeGetDoc('collegeUsers'),
        safeGetDoc('users')
      ]);

      const adminData = adminDoc?.exists() ? adminDoc.data() : null;

      if (adminDoc?.exists()) {
        if (adminData?.role === 'district_user') {
          navigate('/college-dashboard', { replace: true });
          return;
        }

        navigate(adminData?.role === 'teacher' ? '/admin/daily-videos' : '/admin-dashboard', { replace: true });
        return;
      }

      if (emitraDoc?.exists()) {
        navigate('/emitra-dashboard', { replace: true });
        return;
      }

      if (collegeDoc?.exists()) {
        navigate('/college-dashboard', { replace: true });
        return;
      }

      // const collegeToken = await user.getIdToken();
      // const collegeProfileResponse = await fetch('/api/auth/college-profile', {
      //   headers: {
      //     Authorization: `Bearer ${collegeToken}`,
      //   },
      // }).catch(() => null);
      // if (collegeProfileResponse?.ok) {
      //   navigate('/college-dashboard', { replace: true });
      //   return;
      // }

      if (userDoc?.exists()) {
        const userData = userDoc.data();
        const paymentComplete = userData?.paymentStatus !== 'rejected' && Boolean(userData?.isPaid || userData?.hasPaid || userData?.paymentStatus === 'success');
        const loginAtIso = new Date().toISOString();
        navigate(paymentComplete ? '/dashboard' : '/payment', { replace: true });
        updateDoc(doc(db, 'users', user.uid), {
          loginLogs: arrayUnion({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: user.uid,
            studentName: userData.fullName || 'Student',
            email: user.email || userData.email || '',
            internshipDomain: userData.internshipDomain || '',
            loginAtIso,
            status: 'Success',
            userAgent: navigator.userAgent,
            platform: navigator.platform || 'Web',
          }),
          lastLoginAt: loginAtIso
        }).catch((error) => {
          console.warn('Unable to save login log:', error);
        });
        // navigate(paymentComplete ? '/dashboard' : '/payment', { replace: true });
        return;
      }
      const collegeToken = await user.getIdToken();
      const collegeProfileResponse = await fetch('/api/auth/college-profile', {
        headers: {
          Authorization: `Bearer ${collegeToken}`,
        },
      }).catch(() => null);
      if (collegeProfileResponse?.ok) {
        navigate('/college-dashboard', { replace: true });
        return;
      }

      setError('Login successful, but no student/admin/teacher/Cyber cafe/college profile was found for this account.');
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f8fafc] flex items-center justify-center p-4 md:p-8 relative overflow-hidden select-none font-sans text-left">
      {/* Background gradients */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Password Reset instructions notice modal */}
      <AnimatePresence>
        {showNotice && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden text-left"
            >
              {/* Heading */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Important Notice</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Before you proceed, please read carefully</p>
                </div>
              </div>

              {/* Hindi Instructions Box */}
              <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-5 space-y-4">
                <h4 className="text-amber-700 font-black text-xs uppercase tracking-wider">
                  पासवर्ड रीसेट करने के लिए निर्देश:
                </h4>

                <div className="space-y-3.5">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <Link2 size={15} />
                    </div>
                    <p className="text-xs text-slate-650 font-bold leading-normal">
                      1. यदि आप अपना पासवर्ड भूल गए हैं, तो नीचे दिए गए <strong className="text-blue-600">"Forgot Password"</strong> लिंक पर क्लिक करें।
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <Mail size={15} />
                    </div>
                    <p className="text-xs text-slate-650 font-bold leading-normal">
                      2. अपना पंजीकृत ईमेल दर्ज करें और रीसेट ईमेल प्राप्त करें।
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <Users size={15} />
                    </div>
                    <p className="text-xs text-slate-650 font-bold leading-normal">
                      3. किसी भी सहायता के लिए हमारे आधिकारिक व्हाट्सऐप चैनल से जुड़ें।
                    </p>
                  </div>
                </div>

                {/* Inner WhatsApp widget */}
                <div className="bg-white border border-emerald-100 rounded-2xl p-4.5 space-y-3 shadow-inner-sm">
                  <div className="flex items-start gap-3">
                    <WhatsAppIcon size={22} className="text-[#25D366] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 leading-none">Join our WhatsApp Channel</span>
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-100">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold leading-tight">
                        Get instant updates, important alerts and support notifications.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black uppercase tracking-wider text-[10px] shadow-sm transition cursor-pointer"
                  >
                    <WhatsAppIcon size={12} />
                    Join WhatsApp Channel
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowNotice(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest transition cursor-pointer w-full"
                >
                  I Understood
                </button>
                <a
                  href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition text-center shadow-md shadow-blue-500/10 cursor-pointer w-full"
                >
                  Support Channel
                </a>
              </div>

              {/* Footer notice */}
              <div className="border-t border-slate-100 pt-3.5 flex items-start gap-2.5 text-slate-400">
                <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold leading-normal">
                  Your security is our priority. We never share your information with third parties.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid content */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">

        {/* Left Side: Welcome and trust columns (Visible on lg desktop displays) */}
        <div className="lg:col-span-6 hidden lg:flex flex-col space-y-8 text-left">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100/50">
              ⭐ Welcome to Internmitra
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Welcome <span className="text-blue-600">Back!</span>
            </h1>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              Sign in to continue your internship registration and manage your program.
            </p>
          </div>

          {/* Trust pillar grid list */}
          <div className="space-y-5">
            {[
              { title: 'Secure & Trusted', desc: 'Your data is protected with industry-standard security.', icon: ShieldCheck },
              { title: 'Track Your Progress', desc: 'Monitor your registration and program status in real-time.', icon: Rocket },
              { title: 'Always Here to Help', desc: 'Our support team is available whenever you need assistance.', icon: Headset }
            ].map((pillar, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-white/40 border border-slate-200/40 p-4.5 rounded-2.5xl hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                  <pillar.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-tight mb-0.5">{pillar.title}</h4>
                  <p className="text-xs text-slate-450 font-bold leading-normal">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Illustration graphic */}
          <div className="flex justify-start pt-4">
            <img
              src="/welcome_illustration.png"
              alt="Welcome back to Internmitra"
              className="h-44 w-auto object-contain drop-shadow-md rounded-2xl"
            />
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white rounded-[2.25rem] shadow-sm hover:shadow-md transition-all duration-300 p-8 sm:p-12 border border-slate-200/60 max-w-lg w-full flex flex-col items-center relative overflow-hidden">

            {/* Top User logo background circle */}
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-600/10 shrink-0">
              <User size={24} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-905 tracking-tight mb-1 uppercase text-center">Login to Your Account</h2>
            <p className="text-slate-400 font-semibold mb-8 text-xs text-center">Enter your credentials to access your dashboard</p>

            <form onSubmit={handleLogin} className="w-full space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Login ID input */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="loginIdentifier" className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-bold text-slate-400 px-1">Login ID</Label>
                <div className="relative">
                  <Input
                    id="loginIdentifier"
                    type="text"
                    value={loginIdentifier}
                    required
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pl-11 transition-all font-semibold text-xs sm:text-sm text-slate-800"
                    placeholder="Email, mobile, roll no, or registration no"
                  />
                  {loginIdentifier.includes('@') ? (
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" size={16} />
                  ) : (
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" size={16} />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold px-1">
                  Students can use email, mobile number, university roll no, or registration number.
                </p>
              </div>

              {/* Password input */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-bold text-slate-400">Password</Label>
                  <Link to="/forgot-password" id="forgot-password-link" className="text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-wider">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pl-11 pr-11 transition-all font-semibold text-xs sm:text-sm text-slate-800"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me option */}
              <div className="flex items-center gap-2 px-1 text-left cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-slate-50'
                  }`}>
                  {rememberMe && <Check size={11} className="stroke-[3] text-white" />}
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 font-bold select-none cursor-pointer">Remember me</span>
              </div>

              {/* Submit button */}
              <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 uppercase tracking-widest transition-all duration-300 cursor-pointer">
                {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={14} />
              </Button>
            </form>

            {/* Bottom Register Links */}
            <div className="mt-8 pt-5 border-t border-slate-100 w-full text-center space-y-2 text-xs sm:text-sm">
              <p className="text-slate-400 font-semibold">
                Don't have an account? <Link to="/register" className="text-blue-600 font-extrabold hover:underline underline-offset-4 decoration-2">Register here</Link>
              </p>
              <p className="text-slate-400 font-semibold">
                Cyber cafe? <Link to="/emitra-register" className="text-blue-600 font-extrabold hover:underline underline-offset-4 decoration-2">Register Cyber cafe</Link>
              </p>
            </div>

            {/* Decorative background blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
