import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { shuffle } from '../lib/shuffle';
import type { Subcategory } from '../types';

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'subcategories'), (snap) => {
      setSubcategories(shuffle(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subcategory)));
      setLoading(false);
    });
  }, []);

  async function createSubcategory(data: Omit<Subcategory, 'id' | 'createdAt'>) {
    await addDoc(collection(db, 'subcategories'), { ...data, createdAt: Date.now() });
  }

  async function updateSubcategory(id: string, data: Partial<Omit<Subcategory, 'id'>>) {
    await updateDoc(doc(db, 'subcategories', id), data);
  }

  async function deleteSubcategory(id: string) {
    await deleteDoc(doc(db, 'subcategories', id));
  }

  return { subcategories, loading, createSubcategory, updateSubcategory, deleteSubcategory };
}
