import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Pricing } from '../types';

export function pricingId(categoryId: string, subcategoryId: string | null) {
  return subcategoryId ? `${categoryId}_${subcategoryId}` : categoryId;
}

export function usePricing() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'pricing'), (snap) => {
      setPricing(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Pricing));
      setLoading(false);
    });
  }, []);

  async function setPricingFor(
    categoryId: string,
    subcategoryId: string | null,
    listingFee: number,
    revealFee: number,
  ) {
    const id = pricingId(categoryId, subcategoryId);
    await setDoc(doc(db, 'pricing', id), {
      categoryId,
      subcategoryId,
      listingFee,
      revealFee,
      updatedAt: Date.now(),
    });
  }

  return { pricing, loading, setPricingFor };
}
