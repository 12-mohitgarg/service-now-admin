import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Download, 
  FileText, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Hash
} from 'lucide-react';
import {
  createOfferLetterPdf,
  getOrCreateOfferLetterNumber,
  loadImageAsDataUrl,
  offerLetterFileName
} from '../../lib/offerLetterPdf';

export default function OfferLetter() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [headerImg, setHeaderImg] = useState<string>('');
  const [footerImg, setFooterImg] = useState<string>('');
  const [watermarkImg, setWatermarkImg] = useState<string>('');
  const [offerLetterNumber, setOfferLetterNumber] = useState<string>('');

  useEffect(() => {
    loadImageAsDataUrl('/offer-letter-header.png').then(setHeaderImg).catch(console.error);
    loadImageAsDataUrl('/ff.png').then(setFooterImg).catch(console.error);
    loadImageAsDataUrl('/dded.jpeg', 'image/jpeg').then(setWatermarkImg).catch(console.error);
  }, []);

  const getOfferLetterNumber = async (): Promise<string> => {
    if (!user) return '10000';
    return getOrCreateOfferLetterNumber(user.uid);
  };

  const generatePDF = async () => {
    if (!headerImg || !footerImg) { alert('Images are still loading, please try again in a moment.'); return; }

    // Get the sequential offer letter number
    const letterNumber = await getOfferLetterNumber();
    const pdf = createOfferLetterPdf(profile || {}, letterNumber, { headerImg, footerImg, watermarkImg });
    pdf.save(offerLetterFileName(profile?.fullName));
  };


  const details = [
    { label: 'Student Identity', value: profile?.fullName, icon: User },
    { label: 'Registration No.', value: profile?.universityRoll, icon: Hash },
    { label: 'Roll No.', value: profile?.universityRollNo, icon: Hash },
    { label: 'Campus/College', value: profile?.college, icon: Building2 },
    { label: 'Internship Path', value: profile?.internshipDomain, icon: ShieldCheck },
  ];

  return (
    <div className="student-page">
      <header className="student-card overflow-hidden p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="student-kicker">Document Desk</p>
            <h1 className="student-title mt-2">Internship Offer Letter</h1>
            <p className="student-subtitle">Your verified internship joining document is ready from the details saved in your profile.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 size={24} />
            <span className="text-[11px] font-black uppercase tracking-[0.16em] leading-tight">Application Approved</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {details.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="student-card flex items-center gap-4 p-4 sm:p-5"
          >
            <div className="student-icon">
              <item.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="student-label">{item.label}</p>
              <p className="truncate text-sm font-black text-slate-900">{item.value || 'Not Set'}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="student-card relative overflow-hidden p-6 text-center sm:p-10 lg:p-14">
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mx-auto mb-7 flex size-20 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
            <FileText size={38} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">Generate Official Offer Letter</h2>
          <p className="mx-auto mb-8 mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
            Your PDF uses verified registration records. Please confirm your name, registration number, roll number, college, and domain before downloading.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <button onClick={generatePDF} className="student-button-primary w-full sm:w-auto">
              <Download size={20} />
              Download Official PDF
            </button>
            <div className="flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              <Calendar size={16} />
              Valid for IM/2026 Session
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/60 blur-3xl" />
      </div>

      <div className="student-panel flex flex-col gap-6 overflow-hidden p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="relative z-10">
          <h3 className="text-xl font-black tracking-tight sm:text-2xl">Need to update details?</h3>
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-400">Update your profile before generating the document if any academic detail has changed.</p>
        </div>
        <button onClick={() => navigate('/dashboard/profile')} className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15 sm:w-auto">Go to Profile</button>
      </div>
    </div>
  );
}
