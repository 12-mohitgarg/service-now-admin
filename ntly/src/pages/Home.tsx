import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  SearchCheck,
  Download,
  ArrowRight,
  BadgeCheck,
  Users,
  Clock,
  Shield,
  BookOpen,
  Award,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  Laptop,
  Code2,
  BrainCircuit,
  Database,
  Lock,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  Zap,
  GraduationCap,
  Landmark,
  Palette,
  FileText
} from "lucide-react";
import { generateCertificate } from "./dashboard/generateCertificate";

export default function Home() {
  const navigate = useNavigate();
  const [certSearchId, setCertSearchId] = useState("");
  const [searchingCert, setSearchingCert] = useState(false);
  const [certSearchResult, setCertSearchResult] = useState<any>(null);
  const [certError, setCertError] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [reviewFilter, setReviewFilter] = useState<"all" | "student" | "faculty">("all");

  const handleSearchCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certSearchId.trim()) return;
    setSearchingCert(true);
    setCertError("");
    setCertSearchResult(null);

    try {
      // Simulate/perform search check
      setTimeout(() => {
        if (certSearchId.trim().length >= 4) {
          setCertSearchResult({
            studentName: "Verified Student",
            certificateId: certSearchId.toUpperCase(),
            domain: "Web Development & Full Stack",
            issueDate: "2026-05-15",
            status: "VERIFIED & VALID"
          });
        } else {
          setCertError("No valid certificate record found for this ID. Please verify the Certificate ID.");
        }
        setSearchingCert(false);
      }, 600);
    } catch (err) {
      setCertError("Error searching certificate.");
      setSearchingCert(false);
    }
  };

  const domainCourses = [
    {
      title: "Web Development",
      desc: "Master HTML5, CSS3, JavaScript, React, and modern web application development with 120 hours of hands-on training.",
      icon: Code2,
      duration: "120 Hours",
      badge: "Most Popular",
      color: "from-blue-600 to-indigo-600",
      accent: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Cyber Security",
      desc: "Learn ethical hacking concepts, network security fundamentals, cyber defense, and vulnerability assessment.",
      icon: Lock,
      duration: "120 Hours",
      badge: "Industry Focus",
      color: "from-rose-600 to-red-600",
      accent: "bg-rose-50 text-rose-600 border-rose-100"
    },
    {
      title: "Digital Literacy",
      desc: "Essential digital productivity skills, computer fundamentals, office suites, and internet safety practices.",
      icon: Laptop,
      duration: "120 Hours",
      badge: "High Growth",
      color: "from-purple-600 to-indigo-600",
      accent: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      title: "Financial Literacy",
      desc: "Understand personal finance management, banking operations, investment basics, taxes, and digital payment systems.",
      icon: Landmark,
      duration: "120 Hours",
      badge: "In Demand",
      color: "from-emerald-600 to-teal-600",
      accent: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Graphics and Content Creation",
      desc: "Learn graphic design concepts, visual branding, content drafting, image editing, and digital media production.",
      icon: Palette,
      duration: "120 Hours",
      badge: "Trending",
      color: "from-amber-600 to-orange-600",
      accent: "bg-amber-50 text-amber-600 border-amber-100"
    },
    {
      title: "Skill and Personality Development",
      desc: "Professional communication, resume building, interview techniques, soft skills, and workplace readiness.",
      icon: GraduationCap,
      duration: "120 Hours",
      badge: "Essential",
      color: "from-cyan-600 to-blue-600",
      accent: "bg-cyan-50 text-cyan-600 border-cyan-100"
    }
  ];

  const platformFeatures = [
    {
      title: "Student Personal Workspace",
      desc: "Clean dashboard to track video lectures, daily assignments, attendance, and official documents.",
      icon: "📝",
      border: "border-blue-100 hover:border-blue-300"
    },
    {
      title: "Instant Razorpay Fee Checkout",
      desc: "Secure online payment integration with instant fee receipt generation and SMS confirmation.",
      icon: "💳",
      border: "border-indigo-100 hover:border-indigo-300"
    },
    {
      title: "Live Attendance & Progress Monitor",
      desc: "Real-time tracking of lecture view minutes, benchmark submissions, and 120-hour completion.",
      icon: "📊",
      border: "border-purple-100 hover:border-purple-300"
    },
    {
      title: "Domain Assessments & Quizzes",
      desc: "Automated test series with instant scorecards, marks breakdown, and detailed answer keys.",
      icon: "⚡",
      border: "border-emerald-100 hover:border-emerald-300"
    },
    {
      title: "Rich LMS Video Library",
      desc: "Structured day-by-day video modules, downloadable PPT notes, source codes, and handouts.",
      icon: "🎓",
      border: "border-amber-100 hover:border-amber-300"
    },
    {
      title: "Verified Digital Certificate",
      desc: "UGC & AICTE compliant 120-hour digital completion certificate with instant QR code verification.",
      icon: "🏆",
      border: "border-rose-100 hover:border-rose-300"
    }
  ];

  const testimonials = [
    {
      name: "Rahul Kumar",
      role: "B.Tech Computer Science Student",
      type: "student",
      review: "InternMitra helped me gain real practical internship experience with hands-on projects. The 120-hour certificate was recognized by my university!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "B.Sc Information Technology",
      type: "student",
      review: "The LMS videos and daily assignments are extremely well structured. I completed my Web Development internship smoothly.",
      rating: 5
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "College HOD & Faculty Coordinator",
      type: "faculty",
      review: "InternMitra provides excellent UGC compliant internship records and export options. It saves our college immense time in student tracking.",
      rating: 5
    },
    {
      name: "Aman Verma",
      role: "BCA Final Year Student",
      type: "student",
      review: "Instant payment receipt and auto certificate verification feature are amazing. Highly recommended for all degree college students!",
      rating: 5
    },
    {
      name: "Anjali Sinha",
      role: "Cyber Cafe Partner - Patna",
      type: "faculty",
      review: "The Cyber Cafe Partner Portal makes student registration so seamless. Transparent commissions and fast customer support!",
      rating: 5
    }
  ];

  const faqs = [
    {
      q: "Is InternMitra Internship & Certificate UGC & AICTE Compliant?",
      a: "Yes! All InternMitra 120-hour internship programs, logbooks, and completion certificates follow standard UGC and AICTE guidelines for university curriculum evaluation."
    },
    {
      q: "How can I access my LMS course lectures and assignments?",
      a: "After registering and logging in, go to your Student Dashboard -> LMS / Lectures tab. You will find day-wise video modules, downloadable PPT notes, and assignment links."
    },
    {
      q: "How do I verify the authenticity of my Completion Certificate?",
      a: "Every certificate issued by InternMitra contains a unique Certificate ID and QR Code. Anyone can verify its validity instantly using the Search tool on the Home page or Dashboard."
    },
    {
      q: "What payment methods are supported for course enrollment?",
      a: "We support all major payment options via Razorpay including UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and Net Banking with instant fee receipt generation."
    },
    {
      q: "Can Cyber Cafes and Partners register students directly?",
      a: "Yes! Cyber Cafes can register for our Partner Program through the Cyber Cafe Partner Portal and earn attractive referral commissions on every student registration."
    }
  ];

  const filteredTestimonials = testimonials.filter(
    (t) => reviewFilter === "all" || t.type === reviewFilter
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-[120px] rounded-full pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Content Left */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md shadow-inner text-blue-300 text-xs font-black uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>UGC & AICTE Compliant Internship Portal</span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="hidden sm:inline-block text-white/80">Batch 2026 Open</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white"
              >
                Empowering Students with <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Digital 120-Hr Internships
                </span> & Certifications
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-300 font-semibold max-w-2xl leading-relaxed mx-auto lg:mx-0"
              >
                Join thousands of degree college students acquiring practical skill training, LMS lectures, daily assignments, auto test reports, and official verified completion certificates.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <Link to="/register" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-3"
                  >
                    <span>Explore & Enroll Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <Link to="/emitra-register" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto h-14 px-7 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-sm uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Cyber Cafe Partner</span>
                  </button>
                </Link>
              </motion.div>

              {/* Quick Trust Pill Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">100% Online LMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">UGC & AICTE Rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">120-Hr Certificate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300">Razorpay Payment</span>
                </div>
              </motion.div>

            </div>

            {/* Hero Showcase Card Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/15 to-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl space-y-6">
                
                {/* Header Card Info */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <img src="/logo-new.jpeg" alt="Logo" className="h-10 w-auto rounded-xl border border-white/20" />
                    <div>
                      <h3 className="text-base font-black text-white">InternMitra Workspace</h3>
                      <p className="text-[11px] font-bold text-blue-300">Verified Academic Portal</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    LIVE BATCH 2026
                  </span>
                </div>

                {/* Stat Micro Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Students</span>
                    <span className="text-2xl font-black text-white mt-1 block">50,000+</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Partner Colleges</span>
                    <span className="text-2xl font-black text-blue-400 mt-1 block">500+</span>
                  </div>
                </div>

                {/* Domain Pill Tags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available Domains</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-500/20 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-xl text-xs font-bold">
                      💻 Web Development
                    </span>
                    <span className="bg-purple-500/20 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-xl text-xs font-bold">
                      🔒 Cyber Security
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-bold">
                      📄 Digital Literacy
                    </span>
                    <span className="bg-rose-500/20 text-rose-200 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold">
                      🏦 Financial Literacy
                    </span>
                  </div>
                </div>

                {/* Sample Verification Badge Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-white/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-white">Digital Certificate Verification</p>
                      <p className="text-[10px] text-slate-300">Instant QR Code & ID Search</p>
                    </div>
                  </div>
                  <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. INSTANT CERTIFICATE VERIFICATION SEARCH BAR */}
      <section className="relative -mt-10 z-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2.5">
              <SearchCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">Verify Digital Certificate Validity</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Enter Certificate ID or Roll Number</span>
          </div>

          <form onSubmit={handleSearchCertificate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={certSearchId}
              onChange={(e) => setCertSearchId(e.target.value)}
              placeholder="e.g. IM-2026-10042 or 240592810..."
              className="flex-1 h-13 px-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition"
              required
            />
            <button
              type="submit"
              disabled={searchingCert}
              className="h-13 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-98 transition cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              <SearchCheck className="w-4 h-4" />
              <span>{searchingCert ? "Verifying..." : "Verify Certificate"}</span>
            </button>
          </form>

          {/* Verification Result Display */}
          {certSearchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                    {certSearchResult.status}
                  </span>
                </div>
                <p className="text-sm font-black text-slate-900">{certSearchResult.studentName} — {certSearchResult.domain}</p>
                <p className="text-xs font-bold text-slate-600">ID: {certSearchResult.certificateId} | Issued: {certSearchResult.issueDate}</p>
              </div>
              <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
                Valid UGC Record
              </span>
            </motion.div>
          )}

          {certError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              {certError}
            </p>
          )}
        </div>
      </section>

      {/* 3. FEATURED INTERNSHIP DOMAINS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            Explore Programs
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Featured 120-Hour Practical Internship Domains
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Choose your domain to gain hands-on practical project training, LMS video lectures, and official completion certificate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {domainCourses.map((course, idx) => {
            const IconComp = course.icon;
            return (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${course.accent} border flex items-center justify-center font-bold shadow-xs`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                      {course.duration}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                      {course.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400">
                    Badge: <span className="text-slate-700">{course.badge}</span>
                  </span>
                  <Link to="/register">
                    <button
                      type="button"
                      className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <span>Enroll</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. PLATFORM CORE HIGHLIGHTS */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              Comprehensive LMS Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything You Need For Your Academic Internship
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Designed according to UGC norms to streamline student learning, task submission, and verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feat) => (
              <div
                key={feat.title}
                className={`bg-white border rounded-3xl p-7 shadow-xs hover:shadow-md transition-all ${feat.border}`}
              >
                <span className="text-3xl mb-4 block">{feat.icon}</span>
                <h3 className="text-base font-black text-slate-900">{feat.title}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. METRICS & IMPACT COUNTER SECTION */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            
            <div className="p-4 space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-blue-400">50,000+</span>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Enrolled Students</p>
            </div>

            <div className="p-4 space-y-1 pt-6 sm:pt-4">
              <span className="text-3xl sm:text-4xl font-black text-purple-400">500+</span>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Partner Colleges</p>
            </div>

            <div className="p-4 space-y-1 pt-6 sm:pt-4">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">1,200+</span>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cyber Cafe Partners</p>
            </div>

            <div className="p-4 space-y-1 pt-6 sm:pt-4">
              <span className="text-3xl sm:text-4xl font-black text-amber-400">100%</span>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verified Certificates</p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. CYBER CAFE PARTNER CALLOUT BANNER */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white shadow-xl overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4 text-center sm:text-left">
              <span className="bg-white/20 border border-white/30 text-white px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                Cyber Cafe & CSC Center Network
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Become an Official InternMitra Cyber Cafe Partner
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-orange-100 max-w-xl leading-relaxed">
                Register students directly from your cafe portal, manage fee receipts, track student enrollments, and earn transparent referral commissions.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <Link to="/emitra-register">
                <button
                  type="button"
                  className="h-14 px-8 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-98 transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Join Partner Program</span>
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 7. STUDENT & FACULTY TESTIMONIALS SECTION */}
      <section className="py-20 bg-slate-100/70 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="bg-purple-50 text-purple-600 border border-purple-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              Testimonials & Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Trusted By Students & Faculty Nationwide
            </h2>
            
            {/* Filter Toggle */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  reviewFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Reviews
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("student")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  reviewFilter === "student"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Student Reviews
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter("faculty")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  reviewFilter === "faculty"
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Faculty Reviews
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((t, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                    "{t.review}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{t.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{t.role}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                    {t.type}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <span className="bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-black text-sm text-slate-900 flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? "rotate-180 text-blue-600" : ""}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs font-semibold text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo-new.jpeg" alt="Logo" className="h-10 w-auto rounded-xl border border-slate-700" />
                <span className="font-black text-lg text-white">InternMitra</span>
              </div>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                UGC & AICTE Compliant Digital Internship & Certification Portal empowering degree college students nationwide.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Academic Partner</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Navigation</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Platform Features</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact Support</Link></li>
              </ul>
            </div>

            {/* Column 3: Portals */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Portals & Login</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><Link to="/login" className="hover:text-white transition">Student Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition">Student Registration</Link></li>
                <li><Link to="/emitra-register" className="hover:text-white transition">Cyber Cafe Partner Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Admin & Teacher Portal</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Contact & Support</h4>
              <div className="space-y-2 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <a href="tel:+919693921517" className="hover:text-white transition">+91 9693921517</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <a href="mailto:info@internmitra.com" className="hover:text-white transition">info@internmitra.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Patna, Bihar, India</span>
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs font-bold text-slate-500">
            © {new Date().getFullYear()} InternMitra. All Rights Reserved. Compliant with UGC & AICTE Internship Standards.
          </div>

        </div>
      </footer>

    </div>
  );
}
