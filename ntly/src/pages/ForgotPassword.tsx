import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion } from 'motion/react';
import {
  Mail, Phone, MapPin, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Lock,
  Sparkles, Users, Headset, Facebook, Instagram, Twitter, Linkedin,
  Youtube, ArrowRight, Send
} from 'lucide-react';

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.321 5.325 0 11.866 0c3.171.001 6.151 1.237 8.391 3.479 2.24 2.24 3.473 5.222 3.471 8.397-.003 6.541-5.325 11.862-11.866 11.862-2.001-.001-3.97-.507-5.713-1.47L0 24zm6.59-15.659c-.224-.498-.46-.508-.673-.517-.174-.007-.373-.007-.573-.007-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.149.2 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
  </svg>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(`Failed to send reset email: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSuccessState = () => (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-auto"
        >
          <div className="bg-white rounded-[2.25rem] shadow-sm p-10 sm:p-12 border border-slate-200/60 flex flex-col items-center relative overflow-hidden text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 border border-green-150 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Email Sent!</h2>
            
            <p className="text-slate-500 font-semibold mb-8 text-xs leading-relaxed max-w-sm">
              We've sent a password reset link to <span className="text-blue-650 font-black">{email}</span>. Please check your inbox and follow the instructions to set a new password.
            </p>
            
            <div className="w-full relative z-10">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-blue-650 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back to Login
              </Button>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b0e1a] text-white pt-20 pb-10 border-t border-slate-900 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <img src="/logo-new.jpeg" alt="InternMitra Logo" className="h-11 w-auto object-contain rounded-xl" />
                <div>
                  <h2 className="text-xl font-black tracking-tight">InternMitra</h2>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Bihar's Internship Portal</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm font-semibold max-w-sm">
                Structured digital internship portal providing industry-aligned training, project learning logs, and verified credentials.
              </p>
              <div className="flex gap-2.5">
                {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, index) => (
                  <div key={index} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Platform</h3>
              <ul className="space-y-3.5 text-slate-400 text-xs font-semibold">
                <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Pricing</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">For Students</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">For Colleges</li>
                <li><Link to="/emitra-register" className="hover:text-blue-400 transition-colors">Cyber Cafe Partner</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Support & Contact</h3>
              <ul className="space-y-3 text-slate-400 text-xs font-semibold">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li className="flex items-center gap-2 pt-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="tel:+919693921517" className="hover:text-blue-400 transition-colors">+91 9693921517</a>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="mailto:info@internmitra.com" className="hover:text-blue-400 transition-colors">info@internmitra.com</a>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Patna, Bihar, India</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Legal</h3>
              <ul className="space-y-3.5 text-slate-400 text-xs font-semibold">
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Terms & Conditions</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Cookie Settings</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-slate-500">
            <p>© 2026 Internmitra. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-500/80" />
              20,000+ Registered Scholars
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  if (success) return renderSuccessState();

  return (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">
      
      {/* SECTION 1: FORGOT PASSWORD GRID CONTAINER */}
      <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Form Card */}
          <div className="lg:col-span-6 bg-white rounded-[2rem] p-8 sm:p-12 border border-slate-200/60 shadow-sm flex flex-col justify-between relative overflow-hidden">
            
            <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-6 shrink-0">
               <Mail size={24} />
            </div>

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Reset Your <span className="text-blue-600">Password</span>
              </h2>
              <p className="text-slate-450 font-semibold text-xs leading-relaxed max-w-sm mx-auto">
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="w-full space-y-6 relative z-10">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <Label htmlFor="email" className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-bold text-slate-400 px-1">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pl-11 transition-all font-semibold text-xs sm:text-sm text-slate-800"
                    placeholder="e.g. name@domain.com"
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" size={16} />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-2">
                <Send size={13} />
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-8 pt-5 border-t border-slate-100 w-full text-center relative z-10">
              <Link to="/login" className="text-slate-400 text-xs font-extrabold uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          </div>

          {/* Right Column: Illustration & WhatsApp */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            {/* Top Illustration Box */}
            <div className="flex justify-center relative py-6">
              <img 
                src="/support_whatsapp_illustration.png" 
                alt="Password Security Recovery illustration"
                className="h-48 md:h-56 w-auto object-contain drop-shadow-md"
              />
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* WhatsApp Community Box */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 flex flex-col gap-4 shadow-sm text-left">
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
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black uppercase tracking-wider text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <WhatsAppIcon size={14} />
                Join WhatsApp Channel
              </a>

              <div className="flex gap-4 items-center pt-1 text-[10px] text-slate-400 font-semibold border-t border-slate-50 justify-center">
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> Instant support</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> Important alerts</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> Updates</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: HORIZONTAL TRUST PILLARS BAR */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-blue-50/40 border border-blue-100 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center text-left">
          
          {/* Main heading badge inside */}
          <div className="md:col-span-1 flex items-start gap-3 border-b md:border-b-0 md:border-r border-blue-100 pb-4 md:pb-0 md:pr-4">
            <ShieldCheck size={20} className="text-blue-650 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-800 leading-none">Your security is our priority.</h5>
              <p className="text-[10px] text-slate-450 font-bold leading-normal">We never share your information with third parties.</p>
            </div>
          </div>

          {/* 3 nodes */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Secure Process', desc: 'End-to-end encrypted reset link', icon: Lock },
              { title: 'Quick Recovery', desc: 'Get back to your account within minutes', icon: Mail },
              { title: '24/7 Support', desc: 'Our team is always here to help you', icon: Headset }
            ].map((node, idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                  <node.icon size={16} />
                </div>
                <div className="space-y-0.5">
                  <h6 className="text-[11px] font-black text-slate-850 uppercase tracking-tight leading-none">{node.title}</h6>
                  <p className="text-[10px] text-slate-450 font-bold leading-relaxed">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 3: NEED HELP BANNER */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="bg-blue-600 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md text-white text-left relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/10">
              <WhatsAppIcon size={22} className="text-white" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-black leading-tight">Need help? Chat with us on WhatsApp</h3>
              <p className="text-xs text-white/80 font-semibold leading-relaxed">Our support coordinator team is available to assist you anytime.</p>
            </div>
          </div>
          
          <a
            href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-black uppercase tracking-wider px-6 text-xs shadow-sm transition active:scale-95 cursor-pointer relative z-10 w-full md:w-auto"
          >
            Join WhatsApp Channel <ArrowRight size={14} />
          </a>

          {/* subtle background mesh decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-xl pointer-events-none" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b0e1a] text-white pt-20 pb-10 border-t border-slate-900 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 mb-16">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <img src="/logo-new.jpeg" alt="InternMitra Logo" className="h-11 w-auto object-contain rounded-xl" />
                <div>
                  <h2 className="text-xl font-black tracking-tight">InternMitra</h2>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Bihar's Internship Portal</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm font-semibold max-w-sm">
                Structured digital internship portal providing industry-aligned training, project learning logs, and verified credentials.
              </p>
              <div className="flex gap-2.5">
                {[Facebook, Instagram, Twitter, Linkedin, Youtube].map((Icon, index) => (
                  <div key={index} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Platform</h3>
              <ul className="space-y-3.5 text-slate-400 text-xs font-semibold">
                <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Pricing</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">For Students</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">For Colleges</li>
                <li><Link to="/emitra-register" className="hover:text-blue-400 transition-colors">Cyber Cafe Partner</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Support & Contact</h3>
              <ul className="space-y-3 text-slate-400 text-xs font-semibold">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li className="flex items-center gap-2 pt-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="tel:+919693921517" className="hover:text-blue-400 transition-colors">+91 9693921517</a>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <a href="mailto:info@internmitra.com" className="hover:text-blue-400 transition-colors">info@internmitra.com</a>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Patna, Bihar, India</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6">Legal</h3>
              <ul className="space-y-3.5 text-slate-400 text-xs font-semibold">
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Terms & Conditions</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors">Cookie Settings</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-slate-500">
            <p>© 2026 Internmitra. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-500/80" />
              20,000+ Registered Scholars
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
