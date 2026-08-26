import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Payment } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment));
      setLoading(false);
    });
  }, []);

  return { payments, loading };
}
