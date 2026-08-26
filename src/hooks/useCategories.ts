import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { shuffle } from '../lib/shuffle';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(shuffle(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)));
      setLoading(false);
    });
  }, []);

  async function createCategory(data: Omit<Category, 'id' | 'createdAt'>) {
    const ref = await addDoc(collection(db, 'categories'), { ...data, createdAt: Date.now() });
    return ref.id;
  }

  async function updateCategory(id: string, data: Partial<Omit<Category, 'id'>>) {
    await updateDoc(doc(db, 'categories', id), data);
  }

  async function deleteCategory(id: string) {
    await deleteDoc(doc(db, 'categories', id));
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory };
}
