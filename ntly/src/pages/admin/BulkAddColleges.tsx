import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Building2, MapPin, Plus, Save, Sparkles, HelpCircle } from 'lucide-react';

interface University {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

export default function BulkAddColleges() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [price, setPrice] = useState('1000');
  const [collegesInput, setCollegesInput] = useState('');

  // Status states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch universities
      const universitiesRef = collection(db, 'universities');
      const universitiesQuery = query(universitiesRef, orderBy('name'));
      const universitiesSnapshot = await getDocs(universitiesQuery);
      const universitiesData = universitiesSnapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as University)
      );
      setUniversities(universitiesData);

      // Fetch districts
      const districtsRef = collection(db, 'districts');
      const districtsQuery = query(districtsRef, orderBy('name'));
      const districtsSnapshot = await getDocs(districtsQuery);
      const districtsData = districtsSnapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as District)
      );
      setDistricts(districtsData);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setErrorMsg('Failed to load universities or districts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUniversityId) {
      alert('Please select a University.');
      return;
    }
    if (!selectedDistrictId) {
      alert('Please select a District.');
      return;
    }
    if (!collegesInput.trim()) {
      alert('Please enter at least one college name.');
      return;
    }

    // Split input by newlines or commas
    const lines = collegesInput.split(/[\n,]+/);
    const collegeNames = lines
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (collegeNames.length === 0) {
      alert('Please enter valid college names.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let addedCount = 0;
      const CHUNK_SIZE = 400; // safe chunk size for write batches (Firestore limit is 500)

      for (let i = 0; i < collegeNames.length; i += CHUNK_SIZE) {
        const chunk = collegeNames.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach(name => {
          const newDocRef = doc(collection(db, 'colleges'));
          batch.set(newDocRef, {
            name,
            districtId: selectedDistrictId,
            universityId: selectedUniversityId,
            price: parseInt(price) || 1000,
            createdAt: new Date().toISOString(),
          });
        });

        await batch.commit();
        addedCount += chunk.length;
      }

      setSuccessMsg(`Successfully added ${addedCount} colleges in bulk!`);
      setCollegesInput('');
    } catch (error: any) {
      console.error('Error bulk adding colleges:', error);
      setErrorMsg(error.message || 'Error occurred while saving colleges.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-bold">Loading setup data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin/colleges')}
            variant="outline"
            className="rounded-xl h-10 px-3 flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to Colleges
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-indigo-600 size-6 animate-pulse" />
              Bulk Add Colleges
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Add multiple colleges to a university and district simultaneously.
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="student-card p-6 bg-white/80 backdrop-blur-md border border-slate-100/50 shadow-xl rounded-3xl">
        <form onSubmit={handleSaveBulk} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Select University */}
            <div className="space-y-2">
              <Label className="student-label block mb-1 text-slate-700 font-bold flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-500" />
                Select University <span className="text-rose-500">*</span>
              </Label>
              <select
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
                className="student-input h-12 w-full px-4 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-semibold text-sm appearance-none bg-white cursor-pointer"
                required
              >
                <option value="">Choose University</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select District */}
            <div className="space-y-2">
              <Label className="student-label block mb-1 text-slate-700 font-bold flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-500" />
                Select District <span className="text-rose-500">*</span>
              </Label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="student-input h-12 w-full px-4 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-semibold text-sm appearance-none bg-white cursor-pointer"
                required
              >
                <option value="">Choose District</option>
                {districts.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price input */}
            <div className="space-y-2">
              <Label className="student-label block mb-1 text-slate-700 font-bold">
                Default Price (₹)
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="student-input h-12 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-semibold text-sm"
                placeholder="1000"
              />
            </div>
          </div>

          {/* Colleges Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="student-label block text-slate-700 font-bold">
                Colleges List <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <HelpCircle size={10} />
                Separate by comma or new lines
              </span>
            </div>
            <textarea
              value={collegesInput}
              onChange={(e) => setCollegesInput(e.target.value)}
              placeholder="Example:&#10;Government College of Technology&#10;Indira Gandhi Science College, Mahatma Gandhi Institute of Technology&#10;State Engineering College"
              className="w-full min-h-[220px] p-4 rounded-2xl bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed"
              required
            />
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-bold animate-fade-in shadow-sm">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-bold animate-fade-in shadow-sm">
              {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="student-button-primary h-12 w-full md:w-auto px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving colleges...' : 'Save All Colleges'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
