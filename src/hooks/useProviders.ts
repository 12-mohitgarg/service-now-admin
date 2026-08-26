import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Provider } from '../types';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'providers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setProviders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Provider));
      setLoading(false);
    });
  }, []);

  async function setProviderStatus(id: string, status: Provider['status']) {
    await updateDoc(doc(db, 'providers', id), { status });
  }

  return { providers, loading, setProviderStatus };
}
