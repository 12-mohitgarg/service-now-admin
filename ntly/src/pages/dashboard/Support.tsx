import React, { useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  HelpCircle,
  BookOpen,
  Headphones,
  AlertTriangle,
  Search,
  ExternalLink,
  Clock,
  Mail,
  Send,
  X,
  ChevronRight,
  CheckCircle,
  FileText,
  User,
  Award,
  Phone,
  MessageSquare
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface GuideSection {
  title: string;
  steps: string[];
}

export default function Support() {
  const { profile, user } = useAuth();

  // UI Modal triggers
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Support ticket form state
  const [ticketCategory, setTicketCategory] = useState('Technical Issue');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Selected help topic popup state
  const [selectedTopic, setSelectedTopic] = useState<{ title: string; content: string } | null>(null);

  // FAQs data
  const faqs: FaqItem[] = [
    {
      q: "What is InternMitra?",
      a: "InternMitra is a state-of-the-art training & digital internship platform. It connects university students with curriculum-aligned hands-on projects, daily video lectures, assignment grading, and verified completion certifications."
    },
    {
      q: "How to submit an assignment?",
      a: "Go to the Assignments page, locate the active assignment task, and click 'Download PDF' to read instructions. Once solved, save your answer as a single PDF. In the list table, click the Upload icon next to the assignment, select your PDF file, and click submit."
    },
    {
      q: "When will I get my certificate?",
      a: "Completion certificates (including internship report, marksheet, and certificate) are unlocked instantly once you complete 100% of the video progress lectures and successfully submit the final assessment quiz."
    },
    {
      q: "How do I update my profile credentials?",
      a: "Click on your Profile in the top-right profile dropdown header menu. Click 'Edit Profile', modify your fields (Parent name, university details, contact numbers, gender) and click 'Save Changes' to update the registry."
    },
    {
      q: "Who can I contact for payment issues?",
      a: "If you face any issues during fee checkout or e-mitra processing, launch the 'Contact Support' drawer, select 'Payment Query', and submit your transaction UTR reference number. Our support node will resolve it within 2 hours."
    }
  ];

  // Guides data
  const guides: GuideSection[] = [
    {
      title: "1. Onboarding & Registration",
      steps: [
        "Create an account on the InternMitra student portal.",
        "Check your registration status. Unpaid profiles must complete the payment module first.",
        "Once verified, your daily course lectures list is unlocked under the Course tab."
      ]
    },
    {
      title: "2. Lectures & Attendance",
      steps: [
        "Visit the Course page daily to watch day-wise curriculum lectures.",
        "Your watch hours are tracked automatically. Maintain a regular schedule to stay on track.",
        "Your total progress is visible on the main dashboard milestone stepper."
      ]
    },
    {
      title: "3. Assignments & Submissions",
      steps: [
        "Download assignments from the Assignment Center tab.",
        "Draft solutions in PDF format and upload them under the active assignment row.",
        "Keep track of due dates to avoid grading penalties."
      ]
    },
    {
      title: "4. Final Assessment & Certification",
      steps: [
        "Once all lectures are completed, trigger the Final Assessment Test.",
        "Pass the online multiple-choice quiz.",
        "Unlock and download your verified digital certificate, graded marksheet, and recommendation letters instantly."
      ]
    }
  ];

  // Help topics details
  const helpTopics = [
    {
      id: "assignment",
      title: "How to submit an assignment?",
      desc: "Step-by-step guide to submit your assignments.",
      icon: FileText,
      color: "bg-green-50 text-green-600 border-green-100",
      content: "To submit your project assignment: \n\n1. Navigate to the 'Assignments' page.\n2. In the 'All Assignments' table, click the download icon next to the assignment you wish to complete.\n3. Solve the assignment and compile your answer sheet into a single PDF document.\n4. Go to the 'Reports' tab or use the inline upload trigger, select the corresponding assignment ID, upload your PDF file, write an optional summary note, and submit.\n5. You can view your history of submissions in the Reports history table."
    },
    {
      id: "profile",
      title: "How to update my profile?",
      desc: "Update your personal and academic information.",
      icon: User,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      content: "To update your legal student registry details:\n\n1. Click your name/initials avatar in the top-right header menu.\n2. Click the 'Profile' link from the dropdown to load the Student Registry.\n3. Click the 'Edit Profile' button inside the gradient banner card. This slides in the edit panel on the right.\n4. Edit your parent/guardian name, university details, roll numbers, or contact details.\n5. Click 'Save Changes'. The records will persist immediately in our secure servers."
    },
    {
      id: "certs",
      title: "How to download certificates?",
      desc: "Learn how to access and download your certificates.",
      icon: Award,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      content: "To unlock your digital training and internship certification:\n\n1. Ensure your course video progress has reached 100% on the milestone progress bar.\n2. Navigate to the Course (LMS) page, scroll to the bottom, and start the Final Assessment quiz.\n3. Answer the multiple-choice questions. Once submitted, your scores will lock.\n4. Go to the 'Certifications' tab.\n5. Click the download buttons next to 'Internship Certificate', 'Graded Marksheet', and 'Internship Report' to retrieve your verified PDF files."
    },
    {
      id: "support",
      title: "Who can I contact for support?",
      desc: "Reach out to our support team for any assistance.",
      icon: Headphones,
      color: "bg-orange-50 text-orange-600 border-orange-100",
      content: "You have multiple support channels at InternMitra:\n\n1. Submit a Support Ticket: Use the 'Report an Issue' or 'Send us a Message' form on this page to create a ticket. Our engineering support desk reviews tickets within 2 hours.\n2. WhatsApp helpline: Contact our helpdesk team via WhatsApp message at +91 9693921517.\n3. Email: Write to our coordinator desk directly at info@internmitra.com."
    }
  ];

  // Submit Support Ticket to Firestore + Trigger Netlify SMTP Email Function
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      // 1. Save ticket details in Firestore
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        studentName: profile?.fullName || 'N/A',
        studentEmail: profile?.email || user.email || 'N/A',
        category: ticketCategory,
        subject: ticketSubject,
        description: ticketDescription,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      // 2. Send SMTP email notification via Netlify Function API
      try {
        await fetch('/api/support-ticket-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: profile?.fullName || 'N/A',
            studentEmail: profile?.email || user.email || 'N/A',
            category: ticketCategory,
            subject: ticketSubject,
            description: ticketDescription
          })
        });
      } catch (mailErr) {
        console.error('SMTP email function call failed:', mailErr);
      }

      setTicketSuccess(true);
      setTicketSubject('');
      setTicketDescription('');
      setTimeout(() => {
        setTicketSuccess(false);
        setShowTicketModal(false);
      }, 2500);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">

      {/* 1. TOP PREMIUM SEARCH BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden">

        {/* Banner Left Details */}
        <div className="space-y-4 z-10 max-w-lg w-full">
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight flex items-center gap-2">
            How can we help today?
          </h2>
          <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed">
            Explore guides, search frequently asked questions, or submit a support query directly to our tech helpdesk node.
          </p>

          {/* Search bar input container */}
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help articles, FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-semibold outline-none border border-transparent focus:border-white shadow shadow-blue-700/10 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Banner Right 3D Illustration */}
        <div className="z-10 flex-shrink-0">
          <img
            src="/support_illustration.png"
            alt="Support Tech Graphic"
            className="h-32 md:h-40 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Back elements decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. GRID ROW: QUICK HELP CARDS & JOIN WHATSAPP BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns (4 Quick Help Cards Grid) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* FAQs Trigger Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <HelpCircle size={16} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-850">FAQs</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Find clear answers to commonly asked platform questions.
              </p>
            </div>
            <button
              onClick={() => {
                if (filteredFaqs.length > 0) setSelectedFaq(filteredFaqs[0]);
              }}
              className="text-xs font-black text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-4 select-none cursor-pointer self-start"
            >
              View FAQs &rarr;
            </button>
          </div>

          {/* Getting Started Trigger Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <BookOpen size={16} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-850">Getting Started</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                New to InternMitra? Learn how to unlock features step-by-step.
              </p>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 mt-4 select-none cursor-pointer self-start"
            >
              View Guide &rarr;
            </button>
          </div>

          {/* Contact Support Trigger Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Headphones size={16} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-850">Contact Support</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Submit a tech ticket to reach our core assistance desk.
              </p>
            </div>
            <button
              onClick={() => {
                setTicketCategory('General Query');
                setShowTicketModal(true);
              }}
              className="text-xs font-black text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 mt-4 select-none cursor-pointer self-start"
            >
              Contact Now &rarr;
            </button>
          </div>

          {/* Report an Issue Trigger Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                <AlertTriangle size={16} />
              </div>
              <h4 className="font-extrabold text-sm text-slate-850">Report an Issue</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Facing bugs or grading errors? Report the bug for quick fix.
              </p>
            </div>
            <button
              onClick={() => {
                setTicketCategory('Technical Issue');
                setShowTicketModal(true);
              }}
              className="text-xs font-black text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 mt-4 select-none cursor-pointer self-start"
            >
              Report Now &rarr;
            </button>
          </div>

        </div>

        {/* Right Column: WhatsApp Channel Widget Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden">

          <div className="space-y-3 z-10">
            {/* WhatsApp Header Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <h4 className="font-black text-sm text-slate-850 uppercase tracking-wider">Join WhatsApp Channel</h4>
            </div>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Stay updated with important syllabus announcements, test schedules, notifications, and internship study materials.
            </p>
          </div>

          {/* Channel Trigger Button */}
          <div className="z-10 mt-6 space-y-2">
            <a
              href="https://whatsapp.com/channel/0029VbDNWPACxoAsRFQgYz40"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex h-10 items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 transition active:scale-95 cursor-pointer"
            >
              <span>Join WhatsApp Channel</span>
              <ExternalLink size={12} />
            </a>
            <span className="text-xs text-slate-500 font-bold block text-center">
              Get instant updates on your WhatsApp!
            </span>
          </div>

          {/* Bottom right smartphone 3D illustration mockup */}
          <div className="absolute -bottom-8 -right-8 w-24 h-24 opacity-80 pointer-events-none">
            <img
              src="/support_whatsapp_illustration.png"
              alt="WA Icon"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

      </div>

      {/* 3. ROW 3: POPULAR HELP TOPICS GRID & TIMINGS / CONTACT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns: Popular Help Topics Accordions Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-850 uppercase tracking-wider pb-2 border-b border-slate-50">
            Popular Help Topics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {helpTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic({ title: topic.title, content: topic.content })}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-white transition cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${topic.color}`}>
                    <topic.icon size={15} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-850 leading-snug">{topic.title}</h5>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{topic.desc}</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-350" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Support Details Timing & Contact Helpline Info */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50 select-none">
            <Clock size={14} className="text-blue-500" />
            <h4 className="font-black text-sm text-slate-850 uppercase tracking-wider">
              Support Details
            </h4>
          </div>

          <p className="text-xs text-slate-500 font-semibold select-none leading-relaxed">
            For direct inquiries, you can reach our coordinators or verify timing details below.
          </p>

          <div className="space-y-3 pt-1">
            {/* Helpline Contacts */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone size={13} />
                </div>
                <div>
                  <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Helpline Number</span>
                  <a href="tel:+919693921517" className="text-sm font-black text-slate-800 hover:text-blue-600 transition block">
                    +91 9693921517
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Mail size={13} />
                </div>
                <div>
                  <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Support Email</span>
                  <a href="mailto:info@internmitra.com" className="text-sm font-black text-blue-600 hover:underline block">
                    info@internmitra.com
                  </a>
                </div>
              </div>
            </div>

            {/* Weekdays */}
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Monday - Saturday</span>
              <span className="text-sm font-black text-slate-800 mt-1 block">10:00 AM - 06:00 PM</span>
            </div>

            {/* Sunday */}
            <div className="bg-rose-50/15 border border-rose-100/50 rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-xs text-rose-500 font-bold block uppercase tracking-wider">Sunday</span>
              <span className="text-sm font-black text-rose-700 mt-1 block">Closed</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. ROW 4: BOTTOM FEEDBACK / MESSAGE BOX */}
      <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-200/50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner select-none">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800">Can't find what you're looking for?</h4>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Drop us a message directly and our tech coordinators will get back to you as soon as possible.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTicketCategory('Technical Issue');
            setShowTicketModal(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-2xl shadow-sm transition active:scale-95 text-xs flex-shrink-0 cursor-pointer select-none"
        >
          <Send size={13} />
          Send us a Message
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. MODAL 1: FAQS EXPANSION VIEW */}
      {selectedFaq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up select-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle size={15} />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">FAQs Browser</h4>
              </div>
              <button
                onClick={() => setSelectedFaq(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            {/* Modal List Panel */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {filteredFaqs.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border transition ${selectedFaq.q === item.q ? 'bg-blue-50/10 border-blue-200' : 'bg-white border-slate-100'}`}>
                  <button onClick={() => setSelectedFaq(item)} className="w-full text-left font-extrabold text-sm text-slate-800 hover:text-blue-600 flex justify-between items-center cursor-pointer">
                    <span>{item.q}</span>
                  </button>
                  <p className="text-[14px] text-slate-600 mt-2.5 leading-relaxed font-semibold">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedFaq(null)}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL 2: GETTING STARTED GUIDELINES */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up select-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <BookOpen size={15} />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">Getting Started Guide</h4>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            {/* Guide content step tracker */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
              {guides.map((section, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h5 className="font-extrabold text-sm text-slate-850">{section.title}</h5>
                  <ul className="space-y-2 border-l border-slate-100 pl-3 ml-1.5 text-left">
                    {section.steps.map((step, sIdx) => (
                      <li key={sIdx} className="text-[13.5px] text-slate-650 font-semibold list-disc leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm shadow-emerald-500/10"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL 3: HELP TOPIC READING CARD POPUP */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up select-none">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen size={15} />
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">Help Topic Browser</h4>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            {/* Article content */}
            <div className="p-6 space-y-4 select-text text-left">
              <h4 className="font-black text-base text-slate-800 leading-snug">{selectedTopic.title}</h4>
              <p className="text-[14px] text-slate-600 font-semibold leading-relaxed whitespace-pre-line pt-2">
                {selectedTopic.content}
              </p>
            </div>
            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTopic(null)}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL 4: DYNAMIC SUPPORT TICKET DRAWER MODAL */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up select-none">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Headphones size={15} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800">Submit Support Ticket</h4>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Core helpdesk portal node</p>
                </div>
              </div>
              <button
                onClick={() => setShowTicketModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Success screen */}
            {ticketSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-xl shadow">
                  ✓
                </div>
                <h4 className="font-black text-sm text-slate-850">Ticket Submitted Successfully</h4>
                <p className="text-[10px] text-slate-450 font-semibold leading-relaxed max-w-xs mx-auto">
                  Your ticket has been recorded and an email notification has been dispatched to info@internmitra.com. Our co-ordinators will contact you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="p-5 space-y-4">

                {/* Category select dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block uppercase">Query Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-750 bg-white cursor-pointer"
                  >
                    <option value="Technical Issue">Technical Issue (Bugs / Code)</option>
                    <option value="General Query">General Inquiry (Course Schedule)</option>
                    <option value="Payment Query">Payment Query (Fee Slips)</option>
                    <option value="Grading Help">Grading Help (Marksheets / Evaluation)</option>
                  </select>
                </div>

                {/* Subject input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Short description of query..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none text-slate-750 focus:border-blue-500 shadow-inner"
                  />
                </div>

                {/* Message description textarea */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block uppercase">Message Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed description of issue..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none text-slate-750 focus:border-blue-500 shadow-inner resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="h-9 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/10 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Send size={11} />
                    {submitting ? 'Submitting...' : 'Submit Query'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
