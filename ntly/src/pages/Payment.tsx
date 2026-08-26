import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import {
  CreditCard, ShieldCheck, CheckCircle2, Zap, Headset, Lock, Sparkles,
  ClipboardCheck, ArrowRight, Facebook, Instagram, Twitter, Linkedin,
  Youtube, Users, RotateCcw, ShieldAlert, Phone, Mail, MapPin
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface College {
  id: string;
  name: string;
  districtId: string;
  price: number;
}

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.321 5.325 0 11.866 0c3.171.001 6.151 1.237 8.391 3.479 2.24 2.24 3.473 5.222 3.471 8.397-.003 6.541-5.325 11.862-11.866 11.862-2.001-.001-3.97-.507-5.713-1.47L0 24zm6.59-15.659c-.224-.498-.46-.508-.673-.517-.174-.007-.373-.007-.573-.007-.2 0-.523.074-.797.373-.273.3-1.045 1.02-1.045 2.487 0 1.468 1.07 2.885 1.22 3.085.149.2 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m0 0" />
  </svg>
);

export default function Payment() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState(1000);
  const paymentRejected = profile?.paymentStatus === 'rejected';
  const paymentComplete = !paymentRejected && Boolean(profile?.isPaid || profile?.hasPaid || profile?.paymentStatus === 'success');

  useEffect(() => {
    if (paymentComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [paymentComplete, navigate]);

  useEffect(() => {
    if (profile?.college) {
      fetchColleges();
    }
  }, [profile?.college]);

  const fetchColleges = async () => {
    try {
      if (profile?.college) {
        const collegesQuery = query(
          collection(db, 'colleges'),
          where('name', '==', profile.college),
          limit(1)
        );
        const collegesSnapshot = await getDocs(collegesQuery);
        const userCollege = collegesSnapshot.docs[0]?.data() as College | undefined;
        setAmount(userCollege?.price || 1000);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    if (paymentComplete) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      console.error('Razorpay SDK not loaded');
      alert('Payment gateway is still initializing. Please wait a moment and try again.');
      return;
    }

    setLoading(true);

    try {
      const token = await user.getIdToken();
      const orderResponse = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentForUserId: user.uid }),
      });

      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        if (orderResponse.status === 409) {
          navigate('/dashboard', { replace: true });
          return;
        }
        throw new Error(order?.details || order?.error || 'Could not create payment order');
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'INTERNMITRA',
        description: 'Internship Registration Fee',
        handler: async function (response: any) {
          console.log('Payment received:', response.razorpay_payment_id);
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Missing Razorpay verification details');
            }

            const verifyToken = await user.getIdToken();
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${verifyToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok || verifyResult.status !== 'success') {
              throw new Error(verifyResult?.message || verifyResult?.details || 'Payment verification failed');
            }

            setSuccess(true);
          } catch (err) {
            console.error('Firestore update error:', err);
            alert('Payment received but server verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            setLoading(false);
          }
        },
        prefill: {
          name: profile?.fullName,
          email: profile?.email,
          contact: profile?.contactNumber
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment Failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Could not initialize payment. Please check your internet connection and try again.');
      setLoading(false);
    }
  };

  const renderSuccessState = () => (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-auto bg-[#0c1329] p-10 sm:p-12 rounded-[2.25rem] shadow-2xl text-center relative overflow-hidden group border border-slate-800"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto border-4 border-slate-800 shadow-xl shadow-blue-500/10 transition-transform group-hover:rotate-6">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">Payment Complete</h2>
            <p className="text-slate-400 leading-relaxed text-xs">Registration credentials synchronized. Your industry training program begins now.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full h-12 bg-white hover:bg-blue-600 hover:text-white text-slate-900 text-xs uppercase tracking-widest font-black rounded-xl shadow-md cursor-pointer transition-all duration-300">
              Enter Operations Dashboard
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
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
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left pb-0">
      
      {/* SECTION 1: PAY CONTAINER CARD */}
      <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left Column: Secure Overview Banner */}
          <div className="lg:col-span-4 bg-slate-50/50 p-8 sm:p-10 border-r border-slate-100 flex flex-col justify-between items-center text-center relative overflow-hidden">
            
            {/* Custom SVG Shield & Rupee illustration */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center pt-2">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="82" fill="#eff6ff" />
                <circle cx="100" cy="100" r="62" fill="#dbeafe" opacity="0.6" />
                <rect x="42" y="62" width="48" height="68" rx="6" fill="white" stroke="#bfdbfe" strokeWidth="2" transform="rotate(-10 65 95)" />
                <line x1="52" y1="82" x2="78" y2="82" stroke="#bfdbfe" strokeWidth="2" transform="rotate(-10 65 95)" />
                <line x1="52" y1="96" x2="72" y2="96" stroke="#bfdbfe" strokeWidth="2" transform="rotate(-10 65 95)" />
                <text x="52" y="116" fill="#2563eb" fontSize="15" fontWeight="bold" transform="rotate(-10 65 95)">₹</text>
                <path d="M100 48 C118 48 134 42 140 39 C140 75 131 120 100 148 C69 120 60 75 60 39 C66 42 82 48 100 48 Z" fill="url(#shieldGrad)" />
                <path d="M86 96 L96 106 L118 78" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Secure Enrollment Payment</h3>
              <p className="text-[11px] text-slate-450 font-semibold leading-relaxed max-w-[240px] mx-auto">
                Complete your enrollment by paying the registration fee. This helps us verify your application and continue your onboarding.
              </p>
            </div>

            {/* 3 secure bullet tags */}
            <div className="w-full pt-8 space-y-4 text-left border-t border-slate-100 mt-6">
              {[
                { title: '100% Secure', desc: 'Your payment is protected with bank-level security.', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-100/50' },
                { title: 'Instant & Easy', desc: 'Quick payment with instant confirmation.', icon: Zap, color: 'text-emerald-600 bg-emerald-50 border-emerald-100/50' },
                { title: '24/7 Support', desc: 'Our team is always here to help you.', icon: Headset, color: 'text-purple-600 bg-purple-50 border-purple-100/50' }
              ].map((node, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 ${node.color}`}>
                    <node.icon size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-black text-slate-850 uppercase tracking-tight leading-none">{node.title}</h5>
                    <p className="text-[10px] text-slate-450 font-bold leading-normal">{node.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Right Column: Payment Details Box */}
          <div className="lg:col-span-8 p-8 sm:p-12 space-y-7 bg-white text-left flex flex-col justify-between">
            
            <div className="space-y-2">
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
                Step 04 of 04
              </span>
              <h2 className="text-3xl font-black text-slate-905 uppercase tracking-tight leading-tight">Enrollment Payment</h2>
              <p className="text-slate-400 font-semibold text-xs leading-none">
                Review your payment details and proceed to complete your enrollment.
              </p>
            </div>

            {/* Reference ID card widget */}
            <div className="border border-slate-200/60 rounded-2.5xl p-5 flex items-center justify-between bg-slate-50/20">
              <div className="grid grid-cols-2 gap-8 flex-1">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none block">Reference ID</span>
                  <span className="text-sm font-black text-slate-850 leading-none block">IM-2026-ACTIVE</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none block">Payment For</span>
                  <span className="text-sm font-black text-slate-850 leading-none block">Commitment Fee</span>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <ClipboardCheck size={18} />
              </div>
            </div>

            {/* Payment summary grid box */}
            <div className="bg-slate-50 p-6 rounded-2.5xl border border-slate-100 space-y-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none block">Payment Summary</span>
              
              <div className="flex justify-between items-center text-xs text-slate-650 border-b border-slate-200/50 pb-3">
                <span className="font-bold">Commitment Fee</span>
                <span className="font-black text-slate-900">₹{amount}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span className="text-blue-600 uppercase tracking-tight">Total Amount</span>
                <span className="text-blue-600 text-xl">₹{amount}</span>
              </div>
            </div>

            {/* Razorpay tunnel transaction alert */}
            <div className="flex items-center gap-2.5 text-slate-450 text-xs font-semibold">
              <Lock size={14} className="text-blue-600 shrink-0" />
              <span>Secure transaction via <strong className="text-slate-800 font-extrabold">RAZORPAY</strong> encrypted tunnel.</span>
            </div>

            {/* Pay registration button */}
            <Button onClick={handlePayment} disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 uppercase tracking-widest flex items-center justify-center gap-2 transition duration-300 cursor-pointer">
              <ShieldCheck size={15} />
              {loading ? 'Initializing Tunnel...' : `Pay Registration Fee (₹${amount})`}
              <ArrowRight size={14} />
            </Button>

            {/* Pay summary checks badges list */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-600" /> Secure Payment</span>
              <span className="flex items-center gap-1"><Zap size={13} className="text-blue-500" /> Instant Confirmation</span>
              <span className="flex items-center gap-1"><RotateCcw size={13} className="text-purple-500" /> Zero Hidden Charges</span>
            </div>

            {/* WhatsApp Widget container */}
            <div className="bg-emerald-50/20 border border-emerald-100 rounded-2.5xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3.5 text-left flex-1">
                <WhatsAppIcon size={26} className="text-[#25D366] shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 leading-none">Stay Updated on WhatsApp</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                    Join our WhatsApp channel for important updates, alerts and support.
                  </p>
                </div>
              </div>
              <a
                href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-[#25D366] font-black uppercase tracking-wider px-4 text-[10px] shadow-sm transition shrink-0 cursor-pointer"
              >
                <WhatsAppIcon size={12} />
                Join WhatsApp Channel
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* Trust description alert below card */}
      <div className="max-w-6xl mx-auto text-center px-4 mb-16 space-y-1 text-slate-400">
        <p className="text-[10px] font-black flex items-center justify-center gap-1.5 uppercase tracking-wide leading-none">
          🛡 Your trust is important to us.
        </p>
        <p className="text-[10px] font-bold leading-none">
          All payments are secure, encrypted and processed through trusted gateways.
        </p>
      </div>

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
