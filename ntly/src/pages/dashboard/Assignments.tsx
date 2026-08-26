import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  BookOpen,
  Clock,
  Download,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';

interface Assignment {
  id: string;
  title: string;
  course: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface StudentReport {
  id: string;
  userId: string;
  studentName: string;
  email: string;
  course: string;
  assignmentId?: string;
  assignmentTitle?: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
}

export default function Assignments() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'downloaded' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const normalizeCourseName = (value?: string) => value?.trim().toLowerCase() || '';

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : 'Recent';

  useEffect(() => {
    const fetchAssignments = async () => {
      const studentCourse = normalizeCourseName(profile?.internshipDomain);

      if (!user?.uid || !studentCourse) {
        setAssignments([]);
        setStudentReports([]);
        setLoading(false);
        return;
      }

      try {
        const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
        const courseAssignments = assignmentsSnapshot.docs
          .map((assignmentDoc) => ({ id: assignmentDoc.id, ...assignmentDoc.data() } as Assignment))
          .filter((assignment) =>
            assignment.isActive !== false &&
            normalizeCourseName(assignment.course) === studentCourse
          )
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

        setAssignments(courseAssignments);

        const submissionsQuery = query(
          collection(db, 'studentReports'),
          where('userId', '==', user.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs
          .map((submissionDoc) => ({ id: submissionDoc.id, ...submissionDoc.data() } as StudentReport))
          .filter((submission) => normalizeCourseName(submission.course) === studentCourse)
          .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

        setStudentReports(submissions);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
        setStudentReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [profile?.internshipDomain, user?.uid]);

  // Check if student has submitted/downloaded the assignment
  const checkAssignmentStatus = (assignment: Assignment) => {
    const isSubmitted = studentReports.some(
      (rep) => rep.assignmentId === assignment.id || 
               normalizeCourseName(rep.assignmentTitle) === normalizeCourseName(assignment.title)
    );
    return isSubmitted ? 'Downloaded' : 'New Upload';
  };


  // Filtering logic
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          assignment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = checkAssignmentStatus(assignment);
    if (filterType === 'downloaded') return matchesSearch && status === 'Downloaded';
    if (filterType === 'pending') return matchesSearch && status === 'New Upload';
    return matchesSearch;
  });

  // Pagination calculation
  const totalFiltered = filteredAssignments.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + pageSize);

  // Stats
  const totalCount = assignments.length;
  const downloadedCount = studentReports.length;
  const pendingCount = Math.max(totalCount - downloadedCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. TOP BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none">
        <div className="space-y-3 z-10 flex-1">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
            Assignment Center
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
            Download Your Assignments
          </h2>
          <p className="text-xs text-indigo-100 max-w-md leading-relaxed">
            All your internship assignments uploaded by the admin. Download and complete them on time.
          </p>
        </div>
        
        {/* Banner Graphic Illustration */}
        <div className="z-10 flex-shrink-0 flex justify-center md:justify-start">
          <img
            src="/assignments_illustration.png"
            alt="Assignments Illustration"
            className="w-40 md:w-44 h-auto object-contain"
          />
        </div>

        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        
        {/* Total Assignments */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Assignments</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{totalCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">All time</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-3xl"></div>
        </div>

        {/* Downloaded */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100 flex-shrink-0">
            <Download size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Downloaded</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{downloadedCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Assignments</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-b-3xl"></div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Pending</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{pendingCount}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">Assignments</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-b-3xl"></div>
        </div>

      </div>

      {/* 3. ALL ASSIGNMENTS PANEL & TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm">
        
        {/* Header Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              📁
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">All Assignments</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Review and download assignments</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold w-52 bg-white text-slate-800 outline-none focus:border-blue-500 shadow-sm transition"
              />
            </div>

            {/* Filter Pill Selectors */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterType('downloaded'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === 'downloaded' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                }`}
              >
                Downloaded
              </button>
              <button
                onClick={() => { setFilterType('pending'); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filterType === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Database Loading State */}
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-semibold text-sm">
            Loading assignments records...
          </div>
        ) : paginatedAssignments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-150 rounded-2xl select-none">
            <FileText size={40} className="mx-auto mb-3 text-slate-350" />
            <h4 className="font-extrabold text-sm text-slate-700">No assignments found</h4>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Your course assignments list will show here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="pb-3 px-4">#</th>
                  <th className="pb-3 px-4">Assignment Name</th>
                  <th className="pb-3 px-4">Domain</th>
                  <th className="pb-3 px-4">Uploaded On</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAssignments.map((assignment, idx) => {
                  const idxStr = String(startIndex + idx + 1).padStart(2, '0');
                  const status = checkAssignmentStatus(assignment);
                  
                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/30 transition-colors text-sm text-slate-700">
                      {/* Index */}
                      <td className="py-4 px-4 font-bold text-slate-400 w-10">{idxStr}</td>
                      
                      {/* Name & Desc */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={15} />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 leading-tight">
                              {assignment.title}
                            </h5>
                            {assignment.description && (
                              <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[220px] truncate">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Domain */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide leading-none ${
                          normalizeCourseName(assignment.course).includes('ui') 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                            : normalizeCourseName(assignment.course).includes('data') 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {assignment.course}
                        </span>
                      </td>

                      {/* Uploaded On */}
                      <td className="py-4 px-4 font-semibold text-xs text-slate-400">
                        {formatDate(assignment.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide leading-none ${
                          status === 'Downloaded' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : status === 'New Upload' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Download Action */}
                      <td className="py-4 px-4 text-right">
                        {assignment.fileUrl ? (
                          <a
                            href={assignment.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex h-8 items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-700 px-3 shadow-sm active:scale-95 transition cursor-pointer"
                          >
                            <Download size={11} />
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 inline-block">
                            Instructions
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition active:scale-95 cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
              >
                <ChevronsRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
        )}

      </div>


    </div>
  );
}
