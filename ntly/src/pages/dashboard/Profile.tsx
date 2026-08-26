import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';
import {
  DEGREES,
  INTERNSHIP_DOMAINS,
  SESSIONS,
  SEMESTERS
} from '../../lib/constants';

import {
  UserCircle,
  Mail,
  Phone,
  Save,
  Edit2,
  User,
  GraduationCap,
  BookMarked,
  Calendar,
  FileText,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface Degree {
  id: string;
  name: string;
  subjects: string[];
}

interface Course {
  id: string;
  name: string;
}

export default function Profile() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    contactNumber: profile?.contactNumber || '',
    internshipDomain: profile?.internshipDomain || '',
    gender: profile?.gender || 'Male',
    parentName: profile?.parentName || '',
    degree: profile?.degree || '',
    department: profile?.department || '',
    subject: profile?.subject || '',
    session: profile?.session || '',
    semester: profile?.semester || '',
    universityRoll: profile?.universityRoll || '',
    universityRollNo: profile?.universityRollNo || '',
    university: profile?.university || 'Lalit Narayan Mithila University, Darbhanga',
    college: profile?.college || 'G. D. College, Begusarai'
  });

  useEffect(() => {
    fetchProfileOptions();
  }, []);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      fullName: profile.fullName || '',
      contactNumber: profile.contactNumber || '',
      internshipDomain: profile.internshipDomain || '',
      gender: profile.gender || 'Male',
      parentName: profile.parentName || '',
      degree: profile.degree || '',
      department: profile.department || '',
      subject: profile.subject || '',
      session: profile.session || '',
      semester: profile.semester || '',
      universityRoll: profile.universityRoll || '',
      universityRollNo: profile.universityRollNo || '',
      university: profile.university || 'Lalit Narayan Mithila University, Darbhanga',
      college: profile.college || 'G. D. College, Begusarai'
    });
  }, [profile]);

  const fetchProfileOptions = async () => {
    try {
      const degreesRef = collection(db, 'degrees');
      const degreesQuery = query(degreesRef, orderBy('name'));
      const coursesRef = collection(db, 'courses');
      const coursesQuery = query(coursesRef, orderBy('name'));
      const [degreesSnapshot, coursesSnapshot] = await Promise.all([
        getDocs(degreesQuery),
        getDocs(coursesQuery),
      ]);
      const degreesData = degreesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree));
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setDegrees(degreesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching profile options:', error);
    }
  };

  const domainOptions = courses.length > 0 ? courses.map((course) => course.name) : INTERNSHIP_DOMAINS;
  const selectedDomainExists = domainOptions.some((domain) => domain === formData.internshipDomain);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        course: formData.internshipDomain,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const userInitial = profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Dynamic two-column registry layout: Details Left (3/5), Forms Panel Right (2/5) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* VIEW DETAILS PANEL (Col 1) */}
        <div className={`w-full ${isEditing ? 'lg:w-[58%]' : 'w-full'} space-y-6 transition-all duration-350`}>

          {/* 1. TOP PREMIUM BANNER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/10 shadow-sm relative overflow-hidden select-none">

            <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-6 z-10 text-center sm:text-left w-full sm:w-auto">

              {/* Avatar Initial Ring */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/30 backdrop-blur-md flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-lg relative flex-shrink-0 animate-pulse">
                {userInitial}
                <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-indigo-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow">
                  ✓
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                    {profile?.fullName || 'Student Registry'}
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 leading-none">
                    <ShieldCheck size={10} />
                    Verified Student
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed max-w-sm">
                  Manage your personal information, profile parameters, and academic credentials registry.
                </p>
              </div>
            </div>

            {/* Toggle Edit Form Trigger */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="z-10 inline-flex h-11 items-center justify-center gap-2 bg-white hover:bg-slate-50 text-blue-600 font-bold px-6 rounded-2xl shadow-md transition active:scale-95 text-xs flex-shrink-0 cursor-pointer border border-slate-200 w-full sm:w-auto mt-4 sm:mt-0"
              >
                <Edit2 size={13} />
                Edit Profile
              </button>
            )}

            {/* Decorative background vectors */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Success Save Banner */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider text-center select-none shadow-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={14} />
              Changes Saved successfully ✓
            </div>
          )}

          {/* 2. PERSONAL INFORMATION */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm relative overflow-hidden border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6 select-none">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Personal Information</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Primary legal details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Full Name */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Full Name</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.fullName || 'Not provided'}</span>
                </div>
              </div>

              {/* Gender */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Gender</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.gender || 'Male'}</span>
                </div>
              </div>

              {/* Parent Name */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Parent / Guardian</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.parentName || 'Not provided'}</span>
                </div>
              </div>

              {/* Contact Number */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Contact Number</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.contactNumber || 'Not provided'}</span>
                </div>
              </div>

              {/* Email Address */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition md:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Email Address</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{profile?.email || 'Not provided'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. ACADEMIC INFORMATION */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm relative overflow-hidden border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6 select-none">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Academic Information</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">University and college credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* University */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition md:col-span-2 lg:col-span-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">University</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block leading-snug">{profile?.university || 'Veer Kunwar Singh University'}</span>
                </div>
              </div>

              {/* College */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition md:col-span-2 lg:col-span-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <BookMarked size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">College</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block leading-snug">{profile?.college || 'Maharaja College, Ara'}</span>
                </div>
              </div>

              {/* Degree */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Degree</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.degree || 'Not provided'}</span>
                </div>
              </div>

              {/* Department */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <BookMarked size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Department</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.department || 'Not provided'}</span>
                </div>
              </div>

              {/* Session */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Session</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.session || 'Not provided'}</span>
                </div>
              </div>

              {/* University Registration Number */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition md:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">University Registration Number</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.universityRoll || 'Not provided'}</span>
                </div>
              </div>

              {/* University Roll No */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">University Roll No</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.universityRollNo || 'Not provided'}</span>
                </div>
              </div>

              {/* Semester */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Semester</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">{profile?.semester || 'Not provided'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4. INTERNSHIP PROGRAM DETAILS */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm relative overflow-hidden border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6 select-none">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Internship Details</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your registered program domain</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Internship Domain */}
              <div className="bg-slate-50/45 border border-slate-100/70 rounded-2xl p-4 flex items-center gap-3.5 hover:bg-slate-50 transition sm:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Registered Domain / Course</span>
                  <span className="text-xs font-black text-slate-850 mt-1 block">{profile?.internshipDomain || 'Not Registered'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* EDIT PROFILE PANEL (SLIDE-OVER / INLINE RIGHT PANEL) (Col 2) */}
        {isEditing && (
          <div className="w-full lg:w-[42%] bg-white rounded-3xl border border-gray-200/50 shadow-sm p-6 space-y-6 animate-scale-up select-none">

            {/* Panel Title Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Edit Profile</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Modify database values below</p>
                </div>
              </div>

              <div className="text-blue-500 animate-pulse">
                <Sparkles size={16} />
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">

              {/* SECTION: Personal Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} />
                  Personal Information
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Full Legal Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                      required
                    />
                  </div>

                  {/* Gender select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner bg-white cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Parent */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Contact Number</label>
                    <input
                      type="text"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: Academic Information */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={12} />
                  Academic Information
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* University */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">University</label>
                    <input
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* College */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">College</label>
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Degree */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Degree</label>
                    <select
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Select Degree</option>
                      {DEGREES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {degrees.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Session */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Session</label>
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Select Session</option>
                      {SESSIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Registration Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">University Registration Number</label>
                    <input
                      type="text"
                      value={formData.universityRoll}
                      onChange={(e) => setFormData({ ...formData, universityRoll: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* University Roll No */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">University Roll No</label>
                    <input
                      type="text"
                      value={formData.universityRollNo}
                      onChange={(e) => setFormData({ ...formData, universityRollNo: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Semester */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer"
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: Internship Program */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} />
                  Internship Program
                </h4>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Internship Domain</label>
                  <select
                    value={formData.internshipDomain}
                    onChange={(e) => setFormData({ ...formData, internshipDomain: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer"
                    required
                  >
                    <option value="">Select Domain</option>
                    {formData.internshipDomain && !selectedDomainExists && (
                      <option value={formData.internshipDomain}>{formData.internshipDomain}</option>
                    )}
                    {domainOptions.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/10 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save size={13} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        )}

      </div>

    </div>
  );
}
