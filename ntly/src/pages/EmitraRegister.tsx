import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  AlertCircle, ArrowRight, Building2, Handshake, Lock, Mail, MapPin,
  Phone, User, ShieldCheck, Sparkles, Users, Headset, Facebook,
  Instagram, Twitter, Linkedin, Youtube
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const DEFAULT_COMMISSION_PERCENTAGE = 5;

export default function EmitraRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    centerName: '',
    ownerName: '',
    email: '',
    contactNumber: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const centerName = formData.centerName.trim();
    const ownerName = formData.ownerName.trim();
    const email = formData.email.trim().toLowerCase();
    const contactNumber = formData.contactNumber.trim();
    const address = formData.address.trim();

    if (!centerName || !ownerName || !email || !contactNumber || !address || !formData.password) {
      setError('Please fill all Cyber cafe details.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, formData.password);

      await setDoc(doc(db, 'emitras', credential.user.uid), {
        uid: credential.user.uid,
        centerName,
        ownerName,
        email,
        contactNumber,
        address,
        commissionPercentage: DEFAULT_COMMISSION_PERCENTAGE,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      navigate('/emitra-dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email.');
      } else {
        setError(err.message || 'Unable to register Cyber cafe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left pb-0">
      
      {/* MAIN REGISTRATION CARD CONTAINER */}
      <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left Dark Column */}
          <div className="lg:col-span-4 bg-[#081026] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-left">
            <div className="space-y-8 relative z-10">
              {/* brand logo circle */}
              <div className="w-12 h-12 rounded-xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Handshake size={24} />
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Partner Registration</span>
                <h1 className="text-3xl font-black uppercase tracking-tight leading-tight">
                  Cyber Cafe <br />
                  <span className="text-blue-500">Registration</span>
                </h1>
                <p className="text-xs font-semibold leading-relaxed text-slate-400 pt-1">
                  Register your Cyber cafe and start enrolling students through the InternMitra platform.
                </p>
              </div>

              {/* Commission Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#0d1633] p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 leading-none block">Default Commission</span>
                  <span className="text-3xl font-black text-white leading-none block pt-0.5">{DEFAULT_COMMISSION_PERCENTAGE}%</span>
                  <p className="text-[10px] font-semibold text-slate-450 leading-relaxed pt-1">
                    Admin can adjust this percentage after registration.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-10 space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck size={16} className="text-blue-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">Secure • Trusted • Verified Partners</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">
                Internmitra Partner Network
              </p>
            </div>

            {/* Dotted decorative mesh */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Right Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 p-8 sm:p-12 space-y-7 bg-white text-left flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-xs text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
                Create Account
              </span>
              <h2 className="text-3xl font-black text-slate-905 uppercase tracking-tight">Cyber Cafe Details</h2>
              <p className="text-slate-400 font-semibold text-xs leading-none">
                Fill in the details below to register your Cyber Cafe with InternMitra.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4.5 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cyber Cafe Name */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <Building2 size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Cyber Cafe Name *</Label>
                  <Input name="centerName" value={formData.centerName} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-800" placeholder="e.g. Kumar Cyber cafe" />
                </div>
              </div>

              {/* Owner Name */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <User size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Owner Name *</Label>
                  <Input name="ownerName" value={formData.ownerName} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-800" placeholder="Owner full name" />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <Mail size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Email Address *</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-850" placeholder="center@email.com" />
                </div>
              </div>

              {/* Contact Number */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <Phone size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Contact Number *</Label>
                  <Input name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-850" placeholder="10 digit mobile number" />
                </div>
              </div>

              {/* Cyber Cafe Address */}
              <div className="flex gap-3.5 items-end md:col-span-2">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Cyber Cafe Address *</Label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full rounded-xl bg-slate-50 border border-transparent px-4 py-3 font-semibold text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none" placeholder="Full address" />
                </div>
              </div>

              {/* Password */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <Lock size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Password *</Label>
                  <Input type="password" name="password" value={formData.password} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-800" placeholder="Minimum 6 characters" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex gap-3.5 items-end">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-[1px]">
                  <Lock size={18} />
                </div>
                <div className="flex-1 space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[9px] sm:text-[10px] font-black text-slate-400 px-1">Confirm Password *</Label>
                  <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-xs sm:text-sm text-slate-800" placeholder="Repeat password" />
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] text-white text-xs font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition duration-300 cursor-pointer shadow-md shadow-blue-500/10">
                <Building2 size={15} />
                {loading ? 'Creating Account...' : 'Register Cyber Cafe'}
                <ArrowRight size={14} />
              </Button>
            </div>

            <p className="text-center text-xs sm:text-sm font-semibold text-slate-400 pt-1">
              Already registered? <Link to="/login" className="text-blue-600 font-extrabold hover:underline">Login here</Link>
            </p>
          </form>
        </div>
      </section>

      {/* TRUST BADGES ROW CONTAINER */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm">
          {[
            { title: 'Trusted Platform', desc: 'Verified by thousands of partners', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-100/50' },
            { title: 'Easy Registration', desc: 'Just a few steps to get started', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
            { title: 'Grow Together', desc: 'Enroll more students and grow your reach', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-100/50' },
            { title: '24/7 Support', desc: 'We\'re here to help you anytime', icon: Headset, color: 'text-amber-600 bg-amber-50 border-amber-100/50' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start p-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5">{item.title}</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-450 font-bold leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b0e1a] text-white pt-20 pb-10 border-t border-slate-900 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 mb-16">

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-new.jpeg"
                  alt="InternMitra Logo"
                  className="h-11 w-auto object-contain rounded-xl"
                />
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
                  <div
                    key={index}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer"
                  >
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
