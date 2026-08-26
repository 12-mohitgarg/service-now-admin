import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useAuth } from '../../components/AuthContext';
import { Copy, KeyRound, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface District {
  id: string;
  name: string;
}

interface College {
  id: string;
  name: string;
  districtId: string;
  price: number;
}

interface GeneratedLogin {
  collegeName: string;
  email: string;
  password: string;
}

export default function ManageColleges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDistrictId, setEditDistrictId] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newDistrictId, setNewDistrictId] = useState('');
  const [newPrice, setNewPrice] = useState('1000');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [generatingCollegeId, setGeneratingCollegeId] = useState<string | null>(null);
  const [generatedLogin, setGeneratedLogin] = useState<GeneratedLogin | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch districts
      const districtsRef = collection(db, 'districts');
      const districtsQuery = query(districtsRef, orderBy('name'));
      const districtsSnapshot = await getDocs(districtsQuery);
      const districtsData = districtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as District));
      setDistricts(districtsData);

      // Fetch colleges
      const collegesRef = collection(db, 'colleges');
      const collegesSnapshot = await getDocs(collegesRef);
      const collegesData = collegesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
      setColleges(collegesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistrictName = (districtId: string) => {
    const district = districts.find(d => d.id === districtId);
    return district?.name || 'Unknown';
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim() || !newDistrictId) return;

    try {
      await addDoc(collection(db, 'colleges'), {
        name: newCollegeName.trim(),
        districtId: newDistrictId,
        price: parseInt(newPrice) || 1000,
        createdAt: new Date().toISOString()
      });
      setNewCollegeName('');
      setNewDistrictId('');
      setNewPrice('1000');
      fetchData();
    } catch (error) {
      console.error('Error adding college:', error);
    }
  };

  const handleEdit = (college: College) => {
    setEditingId(college.id);
    setEditName(college.name);
    setEditDistrictId(college.districtId);
    setEditPrice(college.price.toString());
  };

  const handleSave = async (id: string) => {
    try {
      await updateDoc(doc(db, 'colleges', id), {
        name: editName.trim(),
        districtId: editDistrictId,
        price: parseInt(editPrice) || 1000
      });
      setEditingId(null);
      setEditName('');
      setEditDistrictId('');
      setEditPrice('');
      fetchData();
    } catch (error) {
      console.error('Error updating college:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditDistrictId('');
    setEditPrice('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this college?')) return;

    try {
      await deleteDoc(doc(db, 'colleges', id));
      fetchData();
    } catch (error) {
      console.error('Error deleting college:', error);
    }
  };

  const handleGenerateLogin = async (college: College) => {
    if (!user) {
      alert('Admin session not found. Please login again.');
      return;
    }

    setGeneratingCollegeId(college.id);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/college-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ collegeId: college.id }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.details || result?.error || 'Unable to generate college login');
      }

      setGeneratedLogin({
        collegeName: result.collegeName || college.name,
        email: result.email,
        password: result.password,
      });
    } catch (error: any) {
      console.error('Error generating college login:', error);
      alert(error?.message || 'Unable to generate college login');
    } finally {
      setGeneratingCollegeId(null);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      alert('Copied');
    } catch {
      alert(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-bold">Loading colleges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Dialog open={Boolean(generatedLogin)} onOpenChange={(open) => !open && setGeneratedLogin(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">College Login Generated</DialogTitle>
              <DialogDescription className="font-semibold">
                Share these credentials with {generatedLogin?.collegeName}. The previous password has been revoked.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Login ID</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="break-all text-sm font-black text-slate-900">{generatedLogin?.email}</span>
                  <Button
                    type="button"
                    onClick={() => generatedLogin?.email && copyText(generatedLogin.email)}
                    className="h-9 rounded-xl bg-white px-3 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-600">Password</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="break-all text-sm font-black text-slate-900">{generatedLogin?.password}</span>
                  <Button
                    type="button"
                    onClick={() => generatedLogin?.password && copyText(generatedLogin.password)}
                    className="h-9 rounded-xl bg-white px-3 text-slate-700 ring-1 ring-blue-100 hover:bg-blue-50"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                onClick={() => generatedLogin && copyText(`Login ID: ${generatedLogin.email}\nPassword: ${generatedLogin.password}`)}
                className="rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
              >
                <Copy size={14} />
                Copy Both
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add New College Form */}
        <div className="student-card p-6 bg-white/80">
          <h2 className="text-xl font-black text-slate-900 mb-4 gradient-text">Add New College</h2>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <Label className="student-label block mb-2">College Name</Label>
              <Input
                type="text"
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                className="student-input"
                placeholder="Enter college name"
              />
            </div>
            <div className="w-full md:w-64">
              <Label className="student-label block mb-2">Select District</Label>
              <select
                value={newDistrictId}
                onChange={(e) => setNewDistrictId(e.target.value)}
                className="student-input h-14 px-4"
                required
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-32">
              <Label className="student-label block mb-2">Price (₹)</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="student-input"
                placeholder="1000"
              />
            </div>
            <Button type="submit" className="student-button-primary w-full md:w-auto h-14 shadow-blue-500/10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700">
              <Plus size={20} />
              Add College
            </Button>
          </form>
        </div>

        {/* Colleges List */}
        <div className="student-card bg-white/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100/50">
            <h2 className="text-xl font-black text-slate-900 gradient-text">All Colleges ({colleges.length})</h2>
          </div>

          {colleges.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-bold">No colleges found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/50">
              {colleges.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((college) => (
                <div key={college.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-blue-50/10 transition-colors">
                  {editingId === college.id ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="student-input h-10 px-4 w-full sm:w-auto rounded-xl border-slate-200/80"
                      />
                      <select
                        value={editDistrictId}
                        onChange={(e) => setEditDistrictId(e.target.value)}
                        className="student-input h-10 px-4 w-full sm:w-48 rounded-xl border-slate-200/80 bg-white"
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map(district => (
                          <option key={district.id} value={district.id}>{district.name}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="student-input h-10 px-4 w-full sm:w-24 rounded-xl border-slate-200/80"
                        placeholder="1000"
                      />
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => handleSave(college.id)} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                          <Save size={16} />
                        </Button>
                        <Button onClick={handleCancel} className="h-10 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-bold text-slate-900 text-base">{college.name}</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ml-2 ring-1 ring-blue-100/50">
                          {getDistrictName(college.districtId)}
                        </span>
                        <span className="text-emerald-600 text-sm ml-2 font-black">₹{college.price}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => handleGenerateLogin(college)}
                          disabled={generatingCollegeId === college.id}
                          className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                          title="Generate college login"
                        >
                          <KeyRound size={16} />
                          <span className="hidden xl:inline text-xs font-black uppercase tracking-wider">
                            {generatingCollegeId === college.id ? 'Generating' : 'Login'}
                          </span>
                        </Button>
                        <Button onClick={() => handleEdit(college)} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer">
                          <Edit2 size={16} />
                        </Button>
                        <Button onClick={() => handleDelete(college.id)} className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {(() => {
                const totalPages = Math.ceil(colleges.length / itemsPerPage);
                if (totalPages <= 1 && colleges.length <= 10) return null;
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                  }
                }
                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100/80 bg-slate-50/30">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-bold">
                      <span className="italic">
                        Showing {colleges.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, colleges.length)} of {colleges.length} colleges
                      </span>
                      <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-4">
                        <span>Show</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="h-8 rounded-lg border border-slate-250 bg-white px-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-250 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        Prev
                      </Button>
                      {pages.map((p, idx) => (
                        p === '...' ? (
                          <span key={idx} className="px-2 text-slate-400 font-bold text-xs">...</span>
                        ) : (
                          <Button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentPage(Number(p))}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition active:scale-[0.98] ${
                              currentPage === p
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                                : 'border border-slate-250 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </Button>
                        )
                      ))}
                      <Button
                        type="button"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-250 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
    </div>
  );
}
