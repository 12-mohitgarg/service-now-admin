import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Download, History, Monitor, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { db } from '../../lib/firebase';
import { useAuth } from '../../components/AuthContext';
import { loadImageAsDataUrl } from '../../lib/offerLetterPdf';

type LoginLog = {
  id: string;
  userId: string;
  studentName?: string;
  email?: string;
  internshipDomain?: string;
  loggedAt?: { toDate?: () => Date };
  loginAtIso?: string;
  status?: string;
  userAgent?: string;
  platform?: string;
};

function getLogDate(log: LoginLog) {
  if (!log) return null;
  if (log.loggedAt?.toDate) return log.loggedAt.toDate();
  if (log.loginAtIso) return new Date(log.loginAtIso);
  return null;
}

function getBrowser(userAgent = '') {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  return 'Browser';
}

export default function InternshipLogbook() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aTime = getLogDate(a)?.getTime() || 0;
      const bTime = getLogDate(b)?.getTime() || 0;
      return bTime - aTime;
    });
  }, [logs]);

  const fetchLogs = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const userSnapshot = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnapshot.exists() ? userSnapshot.data() : profile;
      setLogs(((userData?.loginLogs || []) as LoginLog[]).map((log, index) => ({
        ...log,
        id: log.id || `${log.loginAtIso || 'login'}-${index}`,
        userId: log.userId || user.uid
      })));
    } catch (error) {
      console.error('Error fetching internship logs:', error);
      setLogs(((profile?.loginLogs || []) as LoginLog[]).map((log, index) => ({
        ...log,
        id: log.id || `${log.loginAtIso || 'login'}-${index}`,
        userId: log.userId || user.uid
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user?.uid, profile?.loginLogs]);

  const downloadReport = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const ML = 14;
    const MR = 14;
    const name = profile?.fullName || 'Student';
    const generatedAt = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      const [headerImg, footerImg] = await Promise.all([
        loadImageAsDataUrl('/logbook_header.png'),
        loadImageAsDataUrl('/receipt_footer.png', 'image/jpeg')
      ]);
      const headerH = (247 / 1246) * W;
      pdf.addImage(headerImg, 'PNG', 0, 0, W, headerH);
      pdf.addImage(footerImg, 'JPEG', 0, H - 13, W, 13);
    } catch (error) {
      console.warn('Unable to load internship logbook PDF assets:', error);
      pdf.setFillColor(22, 101, 52);
      pdf.rect(0, 0, W, 26, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('InternMitra', ML, 16);
    }

    let y = 52;
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text('STUDENT INTERNSHIP LOGBOOK', W / 2, y, { align: 'center' });
    y += 10;

    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(ML, y, W - ML - MR, 30, 2, 2, 'FD');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Student Name', ML + 4, y + 8);
    pdf.text('Email', ML + 4, y + 17);
    pdf.text('Internship Domain', 112, y + 8);
    pdf.text('Generated At', 112, y + 17);
    pdf.setFont('Helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(name, ML + 36, y + 8);
    pdf.text(profile?.email || user?.email || '-', ML + 36, y + 17);
    pdf.text(profile?.internshipDomain || '-', 145, y + 8);
    pdf.text(generatedAt, 145, y + 17);
    y += 42;

    pdf.setFontSize(10);
    pdf.setTextColor(30, 64, 175);
    pdf.text(`Total Logbook Entries: ${sortedLogs.length}`, ML, y);
    const lastLogin = getLogDate(sortedLogs[0]);
    pdf.text(`Last Session: ${lastLogin ? lastLogin.toLocaleString('en-IN') : 'N/A'}`, W - MR, y, { align: 'right' });
    y += 9;

    const columns = ['#', 'Date', 'Time', 'Browser', 'Status'];
    const widths = [12, 42, 34, 54, 40];
    pdf.setFillColor(30, 64, 175);
    pdf.rect(ML, y - 5, W - ML - MR, 8, 'F');
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    let x = ML + 2;
    columns.forEach((column, index) => {
      pdf.text(column, x, y);
      x += widths[index];
    });
    y += 7;

    sortedLogs.forEach((log, index) => {
      if (y > H - 26) {
        pdf.addPage();
        y = 24;
      }

      const date = getLogDate(log);
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(ML, y - 5, W - ML - MR, 8, 'F');
      }

      const values = [
        String(index + 1),
        date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
        `${getBrowser(log.userAgent)} / ${log.platform || 'Web'}`,
        log.status || 'Success'
      ];

      pdf.setFont('Helvetica', index === 0 ? 'bold' : 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      x = ML + 2;
      values.forEach((value, valueIndex) => {
        const clipped = pdf.splitTextToSize(value, widths[valueIndex] - 3)[0] || '';
        pdf.text(clipped, x, y);
        x += widths[valueIndex];
      });
      y += 8;
    });

    if (sortedLogs.length === 0) {
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('Helvetica', 'normal');
      pdf.text('No logbook entries found yet.', ML + 2, y);
    }

    pdf.save(`InternMitra_Internship_Logbook_${name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* 1. TOP BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none text-left">
        <div className="space-y-4 z-10 flex-1">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Activity Records
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-none">
            Internship Logbook
          </h2>
          <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
            Your official activity history for internship access and participation tracking.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={fetchLogs} 
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold px-5 text-xs transition active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button 
              onClick={downloadReport} 
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-black uppercase tracking-wider px-5 text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>
        
        {/* Banner Graphic Illustration */}
        <div className="z-10 flex-shrink-0 flex justify-center md:justify-start">
          <img
            src="/reports_illustration.png"
            alt="Internship Logbook Illustration"
            className="h-32 md:h-36 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 select-none">
        
        {/* Total Entries */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 flex-shrink-0">
            <History size={18} className="md:w-5 md:h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Entries</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{sortedLogs.length}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Entries logged</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-3xl"></div>
        </div>

        {/* Latest Status */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 flex-shrink-0">
            <ShieldCheck size={18} className="md:w-5 md:h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Latest Status</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{sortedLogs[0]?.status || 'No Entry'}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Activity check</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-b-3xl"></div>
        </div>

        {/* Last Browser */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 flex-shrink-0">
            <Monitor size={18} className="md:w-5 md:h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Last Browser</span>
            <h4 className="text-base md:text-lg font-black text-slate-800 mt-1">{getBrowser(sortedLogs[0]?.userAgent)}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Access platform</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-b-3xl"></div>
        </div>

      </div>

      {/* 3. TABLE SECTION */}
      <section className="bg-white rounded-3xl border border-gray-200/50 shadow-sm overflow-hidden text-left">
        <div className="border-b border-slate-100 p-5 select-none">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Logbook Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4.5">Date</th>
                <th className="px-6 py-4.5">Time</th>
                <th className="px-6 py-4.5">Browser</th>
                <th className="px-6 py-4.5">Platform</th>
                <th className="px-6 py-4.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 select-text">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Loading logbook...</td>
                </tr>
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">No logbook entries found yet.</td>
                </tr>
              ) : (
                sortedLogs.map((log) => {
                  const date = getLogDate(log);
                  return (
                    <tr key={log.id} className="text-sm text-slate-700 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">
                        {date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{getBrowser(log.userAgent)}</td>
                      <td className="px-6 py-4 text-slate-500">{log.platform || 'Web'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-700 leading-none">
                          <CheckCircle2 size={11} />
                          {log.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
