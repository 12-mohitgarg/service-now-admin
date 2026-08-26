import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { INTERNSHIP_DOMAINS } from '../lib/constants';
import {
  CheckCircle2, GraduationCap, LayoutDashboard, FileText, Users, Headset,
  Award, Clock, Briefcase, Heart, Cloud, ArrowRight, ShieldCheck, Zap,
  Eye, Gem, Check, Mail, Phone, MapPin, X, Play, Code, ShieldAlert, Landmark,
  HeartPulse, Compass, Sprout, Palette, Lightbulb, Building2, Sparkles,
  AlertTriangle, LayoutGrid, ClipboardCheck, Facebook, Instagram, Twitter,
  Linkedin, Youtube
} from 'lucide-react';

function getDomainIcon(domain: string) {
  switch (domain) {
    case "Web Development": return Code;
    case "Cyber Security": return ShieldAlert;
    case "Digital Literacy": return FileText;
    case "Financial Literacy": return Landmark;
    case "Healthcare": return HeartPulse;
    case "Teacher Training": return GraduationCap;
    case "Tourism": return Compass;
    case "Agriculture": return Sprout;
    case "Graphics and Content Creation": return Palette;
    case "Entrepreneurship": return Lightbulb;
    case "Politics and Governance": return Building2;
    case "Skill and Personality Development": return Sparkles;
    case "Disaster Management": return AlertTriangle;
    default: return GraduationCap;
  }
}

export default function Features() {
  const coreFeatures = [
    {
      title: 'LMS (Learning Management System)',
      desc: 'Access video lectures, PPTs, notes, and interactive study materials for 17+ specialized subjects.',
      icon: LayoutGrid
    },
    {
      title: 'Live Training Sessions',
      desc: '120 hours of interactive training (4 hours daily for 30 days) with industry veterans and experts.',
      icon: GraduationCap
    },
    {
      title: 'Real-time Progress Tracking',
      desc: 'Visual progress bars and analytics to monitor your learning journey and internship status.',
      icon: Clock
    },
    {
      title: 'Assessments & Quizzes',
      desc: 'Chapter-wise tests, MCQs, and assignments to evaluate and strengthen your knowledge.',
      icon: ClipboardCheck
    },
    {
      title: 'Project Based Learning',
      desc: 'Work on real-world projects and case studies to build your portfolio and practical expertise.',
      icon: Briefcase
    },
    {
      title: 'Certification & Verification',
      desc: 'Get UGC-compliant digital certificates to validate your skills and boost your career.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">

      {/* SECTION 1: HERO & DASHBOARD MOCKUP */}
      <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Powerful Features
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Everything You Need to <br />
              <span className="text-blue-600">Learn, Grow & Get</span> Certified
            </h1>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              InternMitra brings together industry-relevant training, live mentorship, smart tools, and verified certification — all in one platform.
            </p>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              Designed to help students gain practical skills and kickstart their careers with real-world project portfolios and UGC-compliant credentials.
            </p>
          </div>

          {/* Right Dashboard Mockup Column */}
          <div className="lg:col-span-6 relative flex justify-center">

            {/* Background decorative dot grid */}
            <div className="absolute -top-6 -right-6 w-36 h-36 opacity-30 pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(#2563eb 2px, transparent 2px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Dashboard Mockup Layout */}
            <div className="relative z-10 w-full max-w-[480px] bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-800/80 overflow-hidden flex text-slate-200">

              {/* Left Sidebar Mockup (Dark icons column) */}
              <div className="w-12 md:w-14 border-r border-slate-800 bg-slate-950 flex flex-col items-center py-6 space-y-5 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <LayoutDashboard size={12} />
                </div>
                {[GraduationCap, ClipboardCheck, Award, Users, Headset].map((Icon, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-lg text-slate-500 flex items-center justify-center hover:text-slate-350 transition-colors">
                    <Icon size={12} />
                  </div>
                ))}
              </div>

              {/* Main App Content Panel Mockup */}
              <div className="flex-1 bg-white text-slate-800 p-5 md:p-6 space-y-5 text-left">

                {/* Header section with User and Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h4 className="text-[13px] font-black text-slate-900">Welcome back, Student 👋</h4>
                    <p className="text-[9px] text-slate-400 font-bold">Track your internship progress and continue learning</p>
                  </div>
                  <span className="text-[8px] bg-blue-600 text-white font-black px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={9} /> UGC Compliant
                  </span>
                </div>

                {/* Progress Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                    <span>Overall Progress</span>
                    <span className="text-blue-600">75%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[75%] rounded-full" />
                  </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Clock size={14} className="text-blue-600 mb-1" />
                    <span className="text-[11px] font-black text-slate-800">120+</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Hours Done</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <LayoutGrid size={14} className="text-green-600 mb-1" />
                    <span className="text-[11px] font-black text-slate-800">15</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Modules Done</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Award size={14} className="text-purple-600 mb-1" />
                    <span className="text-[11px] font-black text-slate-800">4</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Certs Earned</span>
                  </div>
                </div>

                {/* Activity Feed Mockup */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Recent Activity</span>

                  {/* Item 1 */}
                  <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                        <ClipboardCheck size={12} />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-800 block">Web Development Assignment</span>
                        <span className="text-[8px] text-green-600 font-bold uppercase">Submitted</span>
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold">2h ago</span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Play size={10} className="fill-blue-600 text-blue-600 stroke-[3]" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-800 block">Live Training Session</span>
                        <span className="text-[8px] text-blue-600 font-bold uppercase">Completed</span>
                      </div>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold">5h ago</span>
                  </div>

                </div>

              </div>

            </div>

            {/* Overlaid blue shield badge */}
            <div className="absolute -bottom-4 -left-4 z-20 w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center border border-blue-500 animate-pulse">
              <ShieldCheck size={22} />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: TECHNICAL MODULES (Specialized Industry Domains) */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">

          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Technical Modules
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Specialized <span className="text-blue-600">Industry Domains</span>
            </h2>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              Choose from our massive registry of 17+ industrial specializations curated for global dominance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INTERNSHIP_DOMAINS.map((domain, i) => {
              const Icon = getDomainIcon(domain);
              return (
                <div
                  key={domain}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Icon size={18} />
                  </div>
                  <span className="text-slate-900 font-black uppercase tracking-tight text-[11px] group-hover:text-blue-600 transition-colors">
                    {domain}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 3: ECOSYSTEM ARCHITECTURE */}
      <section className="py-16 md:py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">

          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Ecosystem Architecture
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Sovereign Tools for <span className="text-blue-600">Modern Interns</span>
            </h2>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              InternMitra provides a premium suite of tools designed to transform your academic baseline into professional superiority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col text-left space-y-4"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50 shadow-sm">
                  <feature.icon size={20} />
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 4: WHY CHOOSE INTERNMITRA? */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">

          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Why Choose InternMitra?
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Why Thousands of Students <span className="text-blue-600">Trust Us</span>
            </h2>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              We are committed to delivering quality education, practical exposure, and career support that makes a real difference.
            </p>
          </div>

          {/* Row of trust factors */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {[
              { label: 'UGC Compliant Programs', icon: ShieldCheck },
              { label: 'Industry Verified Certificates', icon: Award },
              { label: 'Expert Mentor Support', icon: Users },
              { label: 'Placement Assistance', icon: Briefcase },
              { label: 'Lifetime Access to Resources', icon: Cloud }
            ].map((factor, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-3 bg-slate-50 p-5 rounded-2.5xl border border-slate-100 shadow-sm hover:bg-white hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 shrink-0">
                  <factor.icon size={18} />
                </div>
                <h4 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-tight leading-relaxed max-w-[140px]">
                  {factor.label}
                </h4>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 5: CALL TO ACTION (CTA) */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-lg relative overflow-hidden select-none">

          <div className="space-y-4 z-10 flex-1 text-left">
            <h2 className="text-3xl font-black tracking-tight text-white leading-none">
              Start Your Learning Journey Today!
            </h2>
            <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
              Join InternMitra and gain industry-ready skills, hands-on experience, and a certificate that defines your future.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/features"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-black px-5 text-xs transition active:scale-95 cursor-pointer shadow-md"
              >
                EXPLORE COURSES <ArrowRight size={13} />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-650 text-white font-black px-5 text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                JOIN NOW <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Certificate/Grad cap illustration */}
          <div className="z-10 flex-shrink-0 flex justify-center">
            <img
              src="/certifications_illustration.png"
              alt="Certifications Illustration"
              className="h-32 md:h-44 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b0e1a] text-white pt-20 pb-10 border-t border-slate-900 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 mb-16">

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-600/10">
                  IM
                </div>
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
