import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import aboutFullContent from '../content/about-full.txt?raw';
import {
  Handshake, Target, Users, Award, ShieldCheck, Zap, Eye, Gem, Check,
  Mail, Phone, MapPin, X, ArrowRight, ClipboardCheck, UserCheck, Briefcase, FileText,
  GraduationCap, Building2, Layers, Clock, TrendingUp, HelpCircle,
  Facebook, Instagram, Twitter, Linkedin, Youtube
} from 'lucide-react';

export default function About() {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | null>(null);
  const completeAboutContent = aboutFullContent.trim();

  const privacyPolicyContent = {
    title: "Privacy Policy",
    lastUpdated: "July 19, 2026",
    sections: [
      {
        title: "1. Information We Collect",
        content: "We collect information you provide directly to us when registering for an internship, such as your name, email address, phone number, college name, university registration number, and selected internship domain. We also automatically collect log data, device details, browser type, and access times to ensure a secure session."
      },
      {
        title: "2. How We Use Your Information",
        content: "Your data is used to administer your internship programs, generate UGC-compliant certificates, track attendance, log your activities, and communicate support updates. We do not sell or trade your personal information to third parties."
      },
      {
        title: "3. Data Security",
        content: "We implement industry-standard security measures, including Firebase SSL encryption and secure firestore rules, to safeguard your database records. However, no internet transmission is 100% secure, and we urge you to keep your login credentials confidential."
      },
      {
        title: "4. Third-Party Services",
        content: "We may integrate with third-party service providers (such as Razorpay for secure payment processing). These providers access your information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose."
      },
      {
        title: "5. Your Rights",
        content: "You have the right to access, update, or request the deletion of your personal information stored on InternMitra. You can update your profile details in your dashboard or contact our support team at info@internmitra.com for database assistance."
      }
    ]
  };

  const termsConditionsContent = {
    title: "Terms & Conditions",
    lastUpdated: "July 19, 2026",
    sections: [
      {
        title: "1. Enrollment & Verification",
        content: "By registering on InternMitra, you confirm that you are a student enrolled in an academic program and that the information provided (such as college name and registration ID) is accurate. Access is granted strictly to the registered individual."
      },
      {
        title: "2. Internship Requirements & Attendance",
        content: "To qualify for the final UGC-compliant certificate, scholars must complete the designated 120-hour internship syllabus, submit all project logs, and maintain active participation. Certificates are only issued upon successful completion and verification of coursework."
      },
      {
        title: "3. Academic Integrity",
        content: "All assignments, code implementations, and project reports submitted by you must be your own original work. Plagiarism or sharing answers with other candidates may result in immediate suspension from the program without certification."
      },
      {
        title: "4. Intellectual Property",
        content: "The lectures, course contents, project definitions, and templates provided on the platform remain the intellectual property of InternMitra and its partner institutions. Unauthorized distribution of study material is strictly prohibited."
      },
      {
        title: "5. Termination",
        content: "We reserve the right to suspend or terminate your account access if you violate these terms, engage in abusive behavior towards mentors or fellow students, or compromise the platform's security."
      }
    ]
  };

  const selectedContent = activePolicy === 'privacy' ? privacyPolicyContent : termsConditionsContent;

  const offerings = [
    'Structured Internship Programs',
    'Industry-Oriented Skill Development',
    'Live Projects',
    'Case Studies',
    'Professional Assignments',
    'Career Mentorship',
    'Resume Building Workshops',
    'Mock Interviews',
    'LinkedIn Profile Optimization',
    'Communication & Soft Skills Training',
    'Digital Literacy Programs',
    'AI Awareness Sessions',
    'Certificate Programs',
    'Performance Assessments',
    'Career Guidance & Counseling'
  ];

  const programCards = [
    {
      title: 'Bachelor of Arts (B.A.)',
      icon: GraduationCap,
      description: 'Focused on communication, personality development, public speaking, leadership, teaching methodology, office administration, report writing, ethics, time management, and digital productivity.'
    },
    {
      title: 'Bachelor of Science (B.Sc.)',
      icon: ClipboardCheck,
      description: 'Designed for research methodology, scientific documentation, laboratory awareness, data collection, Excel, AI fundamentals, visualization, project management, critical thinking, and presentation skills.'
    },
    {
      title: 'Bachelor of Commerce (B.Com.)',
      icon: Briefcase,
      description: 'Built around financial accounting, business communication, banking operations, GST and taxation basics, entrepreneurship, HR, CRM, digital marketing, analytics, and corporate ethics.'
    },
    {
      title: 'BBA, BCA & Other Programs',
      icon: Layers,
      description: 'Internship modules for business strategy, marketing, IT, software tools, project management, leadership, digital transformation, innovation, and entrepreneurship.'
    }
  ];

  const methodology = [
    'Registration & onboarding with clear structure, expectations, and learning outcomes.',
    'Interactive learning sessions led by experts with real-world examples and industry practices.',
    'Practical assignments that reflect workplace scenarios.',
    'Live or simulated projects that build hands-on experience.',
    'Continuous mentorship with regular feedback and professional support.',
    'Assessments through quizzes, assignments, presentations, and project submissions.',
    'Final evaluation based on participation, project quality, professionalism, and learning outcomes.'
  ];

  const coreValues = [
    'Integrity',
    'Innovation',
    'Excellence',
    'Student First',
    'Collaboration',
    'Professionalism',
    'Continuous Learning'
  ];

  return (
    <div className="bg-[#f8fafc] overflow-hidden select-none font-sans text-left">
      {/* SECTION 1: ABOUT INTERNMITRA */}
      <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              About InternMitra
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Empowering Students. <br className="hidden sm:inline" />
              <span className="text-blue-600">Enabling Careers.</span>
            </h1>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              At INTERNMITRA Technologies Private Limited, we believe that education becomes truly meaningful when it goes beyond textbooks and classrooms.
            </p>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              We are a next-generation EdTech, internship, and career development platform built to bridge the gap between higher education and real-world industry expectations through structured training, mentorship, live projects, assessments, and career guidance.
            </p>

            {/* Badges row */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Practical Learning', label: 'Beyond classrooms', icon: Zap },
                { title: 'Career Ready', label: 'Skills & confidence', icon: Award },
                { title: 'Industry Focused', label: 'Mentored programs', icon: ShieldCheck }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800 leading-tight uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image/Graphic Column */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Dotted decorative grid in the background */}
            <div className="absolute -top-6 -right-6 w-36 h-36 opacity-30 pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(#2563eb 2px, transparent 2px)',
                backgroundSize: '16px 16px'
              }}
            />
            <div className="absolute -bottom-6 -left-6 w-36 h-36 opacity-30 pointer-events-none z-0"
              style={{
                backgroundImage: 'radial-gradient(#2563eb 2px, transparent 2px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* Collage Image Container */}
            <div className="relative z-10 w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-150 bg-white">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
                alt="Students collaborating"
                className="w-full h-[320px] sm:h-[400px] object-cover hover:scale-103 transition-transform duration-500"
              />
            </div>

            {/* Overlay badge 1: MSME Certified */}
            <div className="absolute top-8 -right-4 z-20 bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-lg p-3.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-150">
                <Check size={14} className="stroke-[3]" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-800 tracking-wide block uppercase leading-none">MSME CERTIFIED</span>
              </div>
            </div>

            {/* Overlay badge 2: UGC Compliant */}
            <div className="absolute -bottom-4 -left-4 z-20 bg-white/95 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-lg p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-150">
                <ShieldCheck size={18} />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider leading-none">CERTIFICATION</span>
                <span className="text-[10px] font-black text-slate-800 tracking-wide block uppercase mt-0.5">UGC Compliant</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: OUR STORY */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-4xl space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Built from Friendship, Shaped by Student Challenges
            </h2>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              The story of INTERNMITRA began with two friends, Amarjeet Kumar and Premchand Nirala, whose friendship started in Class 6. Growing up together, they studied side by side, shared ambitions, solved challenges together, and dreamed of creating something that could make a meaningful impact on society.
            </p>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              As they moved through higher education, they saw a common problem across India: internships were becoming part of academic requirements, but genuine opportunities, clear guidance, reliable organizations, and meaningful practical exposure were still difficult for many students to access, especially in rural, Tier-2, and Tier-3 regions.
            </p>
            <p className="text-slate-700 leading-relaxed font-black text-base sm:text-lg">
              "Why should practical learning be a privilege for only a few students when it can become an opportunity for everyone?"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shadow-sm">
                <UserCheck size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Amarjeet Kumar</h3>
              <p className="text-[11px] text-blue-600 font-black uppercase tracking-widest">Founder & Chief Executive Officer</p>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                Driven by educational innovation and youth empowerment, Amarjeet envisioned a technology-enabled ecosystem where students receive mentorship, industry exposure, and real-world learning opportunities before they graduate.
              </p>
              <p className="text-sm text-slate-700 font-black leading-relaxed">
                "Education should prepare students not just to earn degrees, but to solve real-world problems with confidence, integrity, and innovation."
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 border border-green-100/50 flex items-center justify-center shadow-sm">
                <Handshake size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Premchand Nirala</h3>
              <p className="text-[11px] text-green-600 font-black uppercase tracking-widest">Co-Founder</p>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                Premchand contributes to institutional partnerships, program operations, student engagement, and the successful implementation of internship initiatives. His focus is to ensure students receive structured learning supported by mentorship and continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PURPOSE, VISION & MISSION */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Why InternMitra Exists',
              icon: Target,
              text: 'India has one of the world\'s largest student populations, yet many graduates enter the workforce without practical exposure to professional environments. INTERNMITRA was created to bridge this gap with internships, mentorship, assignments, live projects, and skill development.'
            },
            {
              title: 'Our Vision',
              icon: Eye,
              text: 'We aspire to build one of India\'s most trusted and impactful career development ecosystems, where every student, regardless of location, financial background, or academic discipline, has access to practical learning and career opportunities.'
            },
            {
              title: 'Our Mission',
              icon: Gem,
              text: 'Our mission is to bridge education and employment by providing structured, high-quality internship programs that combine academic learning with practical application and help students become career-ready professionals.'
            }
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shadow-sm">
                <item.icon size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{item.title}</h3>
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: STATS BAR */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center relative z-10">
            {[
              { stat: '120 Hrs', label: 'Structured Internships', icon: Clock },
              { stat: '17+', label: 'Learning Domains', icon: Layers },
              { stat: '2030', label: 'Impact Roadmap', icon: TrendingUp },
              { stat: 'India', label: 'Student Ecosystem', icon: Users },
              { stat: 'Career', label: 'Development Focus', icon: Award }
            ].map((statItem, idx) => (
              <div key={idx} className="space-y-2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/10 mb-1">
                  <statItem.icon size={16} />
                </div>
                <h4 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-none">
                  {statItem.stat}
                </h4>
                <p className="text-[10px] md:text-xs text-slate-300 font-bold uppercase tracking-wider">
                  {statItem.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: OFFERINGS & PROGRAMS */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              A Complete Internship & Career Development Ecosystem
            </h2>
            <p className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
              Every program is designed with measurable learning outcomes so students gain practical competencies alongside academic knowledge.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {offerings.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                <Check size={13} className="text-blue-600 stroke-[3]" />
                {item}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programCards.map((program) => (
              <div key={program.title} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col text-left space-y-4 hover:translate-y-[-4px] transition-transform duration-300">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 flex items-center justify-center shadow-sm">
                  <program.icon size={22} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{program.title}</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: METHODOLOGY & IMPACT */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="student-card p-6 md:p-8 bg-white/80 space-y-5">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Learning Methodology
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Students Learn Best Through Experience</h2>
            <div className="space-y-3">
              {methodology.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-600">{index + 1}</span>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="student-card p-6 md:p-8 bg-white/80 space-y-6">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Impact & Responsibility
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Transforming Education Through Access</h2>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              INTERNMITRA believes internships should create real learning outcomes, not simply fulfill academic requirements. We help students build practical skills, communication ability, leadership, digital literacy, analytical thinking, confidence, professional ethics, and workplace readiness.
            </p>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Through technology-enabled learning, institutional collaboration, affordable internship programs, and continuous guidance, we work to make quality career development accessible to students from urban, rural, and underserved communities.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {coreValues.map((value) => (
                <span key={value} className="rounded-xl bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 ring-1 ring-slate-100">
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: ROADMAP & FOUNDER MESSAGE */}
      <section className="py-16 md:py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Roadmap Towards 2030
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">A Trusted Internship Ecosystem for India</h2>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              By 2030, INTERNMITRA aims to expand across every state in India and collaborate with universities, colleges, startups, MSMEs, corporate organizations, and public institutions.
            </p>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              We plan to strengthen the platform with AI-enabled career guidance, personalized learning pathways, skill assessments, mentor matching, internship recommendations, employer dashboards, and learning analytics.
            </p>
          </div>

          <div className="bg-slate-950 rounded-3xl p-6 md:p-8 border border-slate-900 shadow-xl space-y-5 text-white">
            <span className="text-[10px] text-blue-300 font-black uppercase tracking-[0.25em] bg-white/5 px-3 py-1.5 rounded-full inline-block">
              Message from the Founders
            </span>
            <p className="text-sm md:text-base text-slate-300 font-semibold leading-relaxed">
              "INTERNMITRA was born from a simple belief that every student deserves an opportunity to learn beyond the classroom. Our dream is to create an ecosystem where students do not merely complete internships but discover their potential, build confidence, develop professional skills, and prepare for lifelong success."
            </p>
            <div className="pt-2 space-y-1">
              <p className="text-sm font-black text-white">Amarjeet Kumar</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Founder & CEO</p>
              <p className="text-sm font-black text-white pt-3">Premchand Nirala</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Co-Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: COMPLETE DOCUMENT */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/60">
            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
              Complete About Document
            </span>
            <h2 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Full INTERNMITRA Information
            </h2>
            <p className="mt-3 text-sm text-slate-500 font-semibold leading-relaxed max-w-3xl">
              This section includes the complete content provided for the About page, including the company profile, founders, roadmap, services, and privacy-policy information.
            </p>
          </div>
          <div className="max-h-[720px] overflow-y-auto p-5 md:p-8">
            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-600 font-semibold">
              {completeAboutContent}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: POLICIES */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.25em] bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            Policies
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy & Guidelines
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold text-sm sm:text-base">
            We are committed to protecting your privacy and ensuring a safe, transparent and trustworthy experience on InternMitra.
          </p>
        </div>

        {/* Rows of Policies (Privacy and Terms & Conditions) */}
        <div className="space-y-4">

          {/* Privacy Policy */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-200 transition-colors duration-300">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
                  We respect your privacy and ensure that your personal information is protected. Your data is used only to improve your experience and is never shared with third parties.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePolicy('privacy')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold px-4 text-xs tracking-tight transition active:scale-95 cursor-pointer shrink-0"
            >
              Read Full Policy <ArrowRight size={13} />
            </button>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-green-200 transition-colors duration-300">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Terms & Conditions</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
                  By using InternMitra, you agree to our terms and conditions. Please read them carefully to understand your rights and responsibilities.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePolicy('terms')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold px-4 text-xs tracking-tight transition active:scale-95 cursor-pointer shrink-0"
            >
              Read Full Policy <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 6: HAVE QUESTIONS? WE'RE HERE TO HELP! */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 shadow-lg relative overflow-hidden select-none">

          <div className="space-y-4 z-10 flex-1 text-left">
            <h2 className="text-3xl font-black tracking-tight text-white leading-none">
              Have Questions? We're Here to Help!
            </h2>
            <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
              Our support team and expert trainers are available 24/7 to assist you on your learning journey.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="mailto:info@internmitra.com"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold px-5 text-xs transition active:scale-95 cursor-pointer"
              >
                <Mail size={14} />
                info@internmitra.com
              </a>
              <a
                href="tel:+919693921517"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-black px-5 text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Phone size={14} />
                +91 9693921517
              </a>
            </div>
          </div>

          {/* Support Graphic Illustration */}
          <div className="z-10 flex-shrink-0 flex justify-center">
            <img
              src="/support_illustration.png"
              alt="Support Agent Illustration"
              className="h-32 md:h-44 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* POLICY DETAILS MODAL */}
      <AnimatePresence>
        {activePolicy && selectedContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePolicy(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 bg-white w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="space-y-1 text-left">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                    {selectedContent.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Last Updated: {selectedContent.lastUpdated}
                  </span>
                </div>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center transition active:scale-90 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-left">
                {selectedContent.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">
                      {section.title}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
                <button
                  onClick={() => setActivePolicy(null)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 text-xs transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/10"
                >
                  Understood & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <li onClick={() => setActivePolicy('privacy')} className="hover:text-blue-400 cursor-pointer transition-colors">Privacy Policy</li>
                <li onClick={() => setActivePolicy('terms')} className="hover:text-blue-400 cursor-pointer transition-colors">Terms & Conditions</li>
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
