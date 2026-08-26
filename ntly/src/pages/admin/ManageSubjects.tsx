import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { DEPARTMENTS } from '../../lib/constants';

interface Degree {
  id: string;
  name: string;
  subjects: string[];
}

export default function ManageSubjects() {
  const navigate = useNavigate();
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDegreeId, setEditingDegreeId] = useState<string | null>(null);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [selectedDegree, setSelectedDegree] = useState('');
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    fetchDegrees();
  }, []);

  const fetchDegrees = async () => {
    try {
      const degreesRef = collection(db, 'degrees');
      const q = query(degreesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const degreesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Degree));

      // If no degrees exist, initialize with DEGREES constant
      if (degreesData.length === 0) {
        await initializeDegrees();
      } else {
        setDegrees(degreesData);
      }
    } catch (error) {
      console.error('Error fetching degrees:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDegrees = async () => {
    try {
      const initialDegrees = Object.keys(DEPARTMENTS).map(degree => ({
        name: degree,
        subjects: []
      }));

      for (const degree of initialDegrees) {
        await addDoc(collection(db, 'degrees'), degree);
      }
      fetchDegrees();
    } catch (error) {
      console.error('Error initializing degrees:', error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDegree || !newSubject.trim()) return;

    try {
      const degree = degrees.find(d => d.name === selectedDegree);
      if (degree) {
        const updatedSubjects = [...degree.subjects, newSubject.trim()];
        await updateDoc(doc(db, 'degrees', degree.id), {
          subjects: updatedSubjects
        });
        setNewSubject('');
        fetchDegrees();
      } else {
        // Create new degree if it doesn't exist
        const newDegree = {
          name: selectedDegree,
          subjects: [newSubject.trim()]
        };
        const docRef = await addDoc(collection(db, 'degrees'), newDegree);
        setNewSubject('');
        fetchDegrees();
      }
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const handleEdit = (degree: Degree) => {
    setEditingDegreeId(degree.id);
    setEditSubjects([...degree.subjects]);
  };

  const handleSave = async (id: string) => {
    try {
      await updateDoc(doc(db, 'degrees', id), {
        subjects: editSubjects.filter(s => s.trim() !== '')
      });
      setEditingDegreeId(null);
      setEditSubjects([]);
      fetchDegrees();
    } catch (error) {
      console.error('Error updating subjects:', error);
    }
  };

  const handleCancel = () => {
    setEditingDegreeId(null);
    setEditSubjects([]);
  };

  const handleRemoveSubject = (index: number) => {
    const updated = editSubjects.filter((_, i) => i !== index);
    setEditSubjects(updated);
  };

  const handleDeleteSubject = async (degree: Degree, index: number) => {
    const subjectName = degree.subjects[index];
    if (!confirm(`Are you sure you want to delete "${subjectName}" from ${degree.name}?`)) return;

    try {
      const updatedSubjects = degree.subjects.filter((_, subjectIndex) => subjectIndex !== index);
      await updateDoc(doc(db, 'degrees', degree.id), {
        subjects: updatedSubjects
      });
      fetchDegrees();
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const handleDeleteDegree = async (degree: Degree) => {
    if (!confirm(`Are you sure you want to delete "${degree.name}" and all of its subjects?`)) return;

    try {
      await deleteDoc(doc(db, 'degrees', degree.id));
      fetchDegrees();
    } catch (error) {
      console.error('Error deleting degree:', error);
    }
  };

  const handleAddSubjectInline = () => {
    setEditSubjects([...editSubjects, '']);
  };

  const handleSubjectChange = (index: number, value: string) => {
    const updated = [...editSubjects];
    updated[index] = value;
    setEditSubjects(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-bold">Loading subjects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Add New Subject Form */}
        <div className="student-card p-6 bg-white/80">
          <h2 className="text-xl font-black text-slate-900 mb-4 gradient-text">Add New Subject</h2>
          <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-64">
              <Label className="student-label block mb-2">Select Department</Label>
              <select
                value={selectedDegree}
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="student-input h-14 px-4"
                required
              >
                <option value="">Select Department</option>
                {Object.keys(DEPARTMENTS).map(degree => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <Label className="student-label block mb-2">Subject Name</Label>
              <Input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="student-input"
                placeholder="Enter subject name"
              />
            </div>
            <Button type="submit" className="student-button-primary w-full sm:w-auto h-14 shadow-blue-500/10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700">
              <Plus size={20} />
              Add Subject
            </Button>
          </form>
        </div>

        {/* Degrees List */}
        <div className="student-card bg-white/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100/50">
            <h2 className="text-xl font-black text-slate-900 gradient-text">All Degrees ({degrees.length})</h2>
          </div>

          {degrees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-bold">No degrees found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/50">
              {degrees.map((degree) => (
                <div key={degree.id} className="p-6 hover:bg-blue-50/10 transition-colors">
                  {editingDegreeId === degree.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 gradient-text">{degree.name}</h3>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => handleSave(degree.id)} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                            <Save size={16} />
                          </Button>
                          <Button onClick={handleCancel} className="h-10 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {editSubjects.map((subject, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={subject}
                              onChange={(e) => handleSubjectChange(index, e.target.value)}
                              className="student-input h-10 px-4 flex-1 rounded-xl border-slate-200/80"
                              placeholder="Subject name"
                            />
                            <Button onClick={() => handleRemoveSubject(index)} className="h-10 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0">
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                        <Button onClick={handleAddSubjectInline} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/10 text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 mt-2">
                          <Plus size={14} />
                          Add Subject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900 mb-3">{degree.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {degree.subjects.length > 0 ? (
                            degree.subjects.map((subject, index) => (
                              <span key={`${subject}-${index}`} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-black ring-1 ring-blue-100/80">
                                <span>{subject}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(degree, index)}
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                  title={`Delete ${subject}`}
                                  aria-label={`Delete ${subject}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-sm italic">No subjects added</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button onClick={() => handleEdit(degree)} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer">
                          <Edit2 size={16} />
                        </Button>
                        <Button onClick={() => handleDeleteDegree(degree)} className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
