import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CustomerUser } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomerUser));
      setLoading(false);
    });
  }, []);

  return { customers, loading };
}
