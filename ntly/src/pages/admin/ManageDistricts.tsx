import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface District {
  id: string;
  name: string;
}

export default function ManageDistricts() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const districtsRef = collection(db, 'districts');
      const q = query(districtsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const districtsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as District));
      setDistricts(districtsData);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim()) return;

    try {
      await addDoc(collection(db, 'districts'), {
        name: newDistrictName.trim(),
        createdAt: new Date().toISOString()
      });
      setNewDistrictName('');
      fetchDistricts();
    } catch (error) {
      console.error('Error adding district:', error);
    }
  };

  const handleEdit = (district: District) => {
    setEditingId(district.id);
    setEditName(district.name);
  };

  const handleSave = async (id: string) => {
    try {
      await updateDoc(doc(db, 'districts', id), {
        name: editName.trim()
      });
      setEditingId(null);
      setEditName('');
      fetchDistricts();
    } catch (error) {
      console.error('Error updating district:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this district?')) return;

    try {
      await deleteDoc(doc(db, 'districts', id));
      fetchDistricts();
    } catch (error) {
      console.error('Error deleting district:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-bold">Loading districts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New District Form */}
      <div className="student-card p-6 bg-white/80">
        <h2 className="text-xl font-black text-slate-900 mb-4 gradient-text">Add New District</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label className="student-label block mb-2">District Name</Label>
            <Input
              type="text"
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              className="student-input border-slate-200/80 rounded-xl"
              placeholder="Enter district name"
            />
          </div>
          <Button type="submit" className="student-button-primary w-full sm:w-auto h-14 shadow-blue-500/10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus size={20} />
            Add District
          </Button>
        </form>
      </div>

      {/* Districts List */}
      <div className="student-card bg-white/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100/50">
          <h2 className="text-xl font-black text-slate-900 gradient-text">All Districts ({districts.length})</h2>
        </div>

        {districts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-bold">No districts found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {districts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((district) => (
              <div key={district.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-blue-50/10 transition-colors">
                {editingId === district.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="student-input h-10 px-4 rounded-xl border-slate-200/80"
                    />
                    <Button onClick={() => handleSave(district.id)} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                      <Save size={16} />
                    </Button>
                    <Button onClick={handleCancel} className="h-10 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-slate-950 text-base">{district.name}</span>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleEdit(district)} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer">
                        <Edit2 size={16} />
                      </Button>
                      <Button onClick={() => handleDelete(district.id)} className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {(() => {
              const totalPages = Math.ceil(districts.length / itemsPerPage);
              if (totalPages <= 1 && districts.length <= 10) return null;
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
                      Showing {districts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, districts.length)} of {districts.length} districts
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
