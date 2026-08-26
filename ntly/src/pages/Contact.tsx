import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Mail, Phone, MapPin, HelpCircle, ArrowRight, Send, ShieldCheck,
  Headset, Users, Clock, ThumbsUp, Facebook, Instagram, Twitter,
  Linkedin, Youtube
} from 'lucide-react';

export default function Contact() {
  return (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">
      
      {/* SECTION 1: HERO & SUPPORT ILLUSTRATION */}
      <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-3.5 py-2 rounded-full inline-block">
              Contact Support
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              We're Here to <br />
              <span className="text-blue-600">Help</span> You Succeed
            </h1>
            <p className="text-slate-650 font-medium text-base sm:text-lg leading-relaxed">
              Have questions about our internship programs, technical tracks, or certifications? Our support team and industry experts are here to help you every step of the way.
            </p>
          </div>

          {/* Right Support Illustration Column */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Dotted background grid */}
            <div className="absolute -top-6 -right-6 w-36 h-36 opacity-30 pointer-events-none z-0" 
                 style={{
                   backgroundImage: 'radial-gradient(#2563eb 2px, transparent 2px)',
                   backgroundSize: '16px 16px'
                 }} 
            />

            <img
              src="/support_illustration.png"
              alt="Support Center Illustration"
              className="relative z-10 h-48 md:h-64 w-auto object-contain drop-shadow-md"
            />
          </div>

        </div>
      </section>

      {/* SECTION 2: CARDS & QUERY FORM LAYOUT */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column (Contact Cards) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Card 1: Email */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-start gap-4.5 hover:border-blue-200 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-450 font-black tracking-widest uppercase block leading-none">Email Communication</span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-none pt-0.5">info@internmitra.com</h4>
                <p className="text-xs text-slate-400 font-bold leading-none pt-1">We typically reply within 24 hours</p>
              </div>
            </div>

            {/* Card 2: Phone */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-start gap-4.5 hover:border-blue-200 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-450 font-black tracking-widest uppercase block leading-none">Support Helpline</span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-none pt-0.5">+91 9693921517</h4>
                <p className="text-xs text-slate-400 font-bold leading-none pt-1">Mon – Sat | 10:00 AM – 7:00 PM</p>
              </div>
            </div>

            {/* Card 3: Address */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-start gap-4.5 hover:border-blue-200 transition-colors duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-450 font-black tracking-widest uppercase block leading-none">Main Office</span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-none pt-0.5">Patna, Bihar, India</h4>
                <p className="text-xs text-slate-400 font-bold leading-none pt-1">Our team is based in Bihar, India</p>
              </div>
            </div>

            {/* Card 4: Knowledge Hub (Dark Blue) */}
            <div className="bg-[#0c1329] text-white rounded-[2rem] p-8 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between flex-1 mt-2">
              <div className="space-y-4 relative z-10 text-left">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <HelpCircle size={22} />
                </div>
                <h3 className="text-lg font-black tracking-wider uppercase">Knowledge Hub</h3>
                <p className="text-slate-400 font-semibold leading-relaxed text-sm sm:text-base">
                  Explore our FAQ database and resources for instant answers to common queries.
                </p>
              </div>
              <div className="pt-6 relative z-10 text-left">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider px-6 shadow-md active:scale-95 transition-all cursor-pointer">
                  Explore FAQs <ArrowRight size={14} />
                </button>
              </div>
              {/* Decorative design blob */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
            </div>

          </div>

          {/* Right Column (Submit Query Form Card) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between h-full space-y-6">
              
              <div className="space-y-2 text-left">
                <span className="text-xs text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
                  We Value Your Feedback
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">Submit Your Query</h2>
                <p className="text-slate-450 font-bold text-xs sm:text-sm">
                  Fields marked with <span className="text-blue-600 font-black">*</span> are required for priority processing.
                </p>
              </div>

              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <Label className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-black text-slate-400 px-1">Full Name *</Label>
                    <Input placeholder="Enter your full name" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-800 text-sm sm:text-base" />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <Label className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-black text-slate-400 px-1">Email Address *</Label>
                    <Input placeholder="name@example.com" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-800 text-sm sm:text-base" />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-black text-slate-400 px-1">Reason of Engagement *</Label>
                  <select className="w-full h-12 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 transition-all font-semibold text-slate-850 text-sm sm:text-base appearance-none shadow-sm cursor-pointer">
                    <option>Program Enrollment</option>
                    <option>Technical Track Query</option>
                    <option>Strategic Partnership</option>
                    <option>Certification Verification</option>
                    <option>Infrastructure Support</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-black text-slate-400 px-1">Subject *</Label>
                  <Input placeholder="Enter subject of your query" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-850 text-sm sm:text-base" />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="uppercase tracking-[0.15em] text-[10px] sm:text-xs font-black text-slate-400 px-1">Message *</Label>
                  <textarea
                    rows={4}
                    placeholder="How can we support you today?"
                    className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-semibold text-slate-855 text-sm sm:text-base resize-none shadow-inner"
                  />
                </div>

                {/* Privacy check row */}
                <div className="flex items-start gap-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-left">
                  <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="text-xs sm:text-sm font-black text-slate-800 leading-none">Your data is safe with us.</h5>
                    <p className="text-[11px] sm:text-xs text-slate-450 font-bold leading-normal">We respect your privacy and never share your information with third parties.</p>
                  </div>
                </div>

                {/* Button container */}
                <div className="text-left pt-2">
                  <Button className="h-12 px-8 bg-[#0c1329] hover:bg-[#131d3e] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-[1.01] cursor-pointer">
                    Send Message
                    <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </Button>
                </div>

              </form>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: WHY SUPPORT STANDS OUT */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3.5 py-2 rounded-full inline-block">
              Always Here to Help
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Why InternMitra <span className="text-blue-600">Support</span> Stands Out
            </h2>
          </div>

          {/* Grid of 5 support trust cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              { title: '24/7 Support', desc: 'Get help anytime you need it, round the clock.', icon: Headset },
              { title: 'Expert Guidance', desc: 'Connect with industry professionals & mentors.', icon: Users },
              { title: 'Quick Response', desc: 'We ensure fast and helpful responses.', icon: Clock },
              { title: 'Secure & Private', desc: 'Your information is always protected.', icon: ShieldCheck },
              { title: '100% Satisfaction', desc: 'We are committed to your success.', icon: ThumbsUp }
            ].map((card, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-3 bg-slate-50 p-5 rounded-2.5xl border border-slate-100 shadow-sm hover:bg-white hover:border-blue-100 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 shrink-0">
                  <card.icon size={18} />
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight leading-none">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-500 font-semibold leading-normal max-w-[140px]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

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
