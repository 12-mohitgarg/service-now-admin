import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface University {
  id: string;
  name: string;
}

export default function ManageUniversities() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newUniversityName, setNewUniversityName] = useState('');

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const universitiesRef = collection(db, 'universities');
      const q = query(universitiesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const universitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as University));
      setUniversities(universitiesData);
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniversityName.trim()) return;

    try {
      await addDoc(collection(db, 'universities'), {
        name: newUniversityName.trim(),
        createdAt: new Date().toISOString()
      });
      setNewUniversityName('');
      fetchUniversities();
    } catch (error) {
      console.error('Error adding university:', error);
    }
  };

  const handleEdit = (university: University) => {
    setEditingId(university.id);
    setEditName(university.name);
  };

  const handleSave = async (id: string) => {
    try {
      await updateDoc(doc(db, 'universities', id), {
        name: editName.trim()
      });
      setEditingId(null);
      setEditName('');
      fetchUniversities();
    } catch (error) {
      console.error('Error updating university:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university?')) return;

    try {
      await deleteDoc(doc(db, 'universities', id));
      fetchUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-bold">Loading universities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New University Form */}
      <div className="student-card p-6 bg-white/80">
        <h2 className="text-xl font-black text-slate-900 mb-4 gradient-text">Add New University</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label className="student-label block mb-2">University Name</Label>
            <Input
              type="text"
              value={newUniversityName}
              onChange={(e) => setNewUniversityName(e.target.value)}
              className="student-input border-slate-200/80 rounded-xl"
              placeholder="Enter university name"
            />
          </div>
          <Button type="submit" className="student-button-primary w-full sm:w-auto h-14 shadow-blue-500/10 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700">
            <Plus size={20} />
            Add University
          </Button>
        </form>
      </div>

      {/* Universities List */}
      <div className="student-card bg-white/80 overflow-hidden">
        <div className="p-6 border-b border-slate-100/50">
          <h2 className="text-xl font-black text-slate-900 gradient-text">All Universities ({universities.length})</h2>
        </div>

        {universities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-bold">No universities found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/50">
            {universities.map((university) => (
              <div key={university.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-blue-50/10 transition-colors">
                {editingId === university.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="student-input h-10 px-4 rounded-xl border-slate-200/80"
                    />
                    <Button onClick={() => handleSave(university.id)} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                      <Save size={16} />
                    </Button>
                    <Button onClick={handleCancel} className="h-10 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer">
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-slate-950 text-base">{university.name}</span>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleEdit(university)} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/10 transition-all active:scale-[0.98] cursor-pointer">
                        <Edit2 size={16} />
                      </Button>
                      <Button onClick={() => handleDelete(university.id)} className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/10 transition-all active:scale-[0.98] cursor-pointer">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
