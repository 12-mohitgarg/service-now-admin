export interface Category {
  id: string;
  name: string;
  iconUrl: string;
  createdAt: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  iconUrl: string;
  createdAt: number;
}

export interface Pricing {
  id: string; // categoryId, or `${categoryId}_${subcategoryId}`
  categoryId: string;
  subcategoryId: string | null;
  listingFee: number; // paid once by a provider to become visible
  revealFee: number; // paid by a customer to unlock a provider's contact info
  updatedAt: number;
}

export interface CustomerUser {
  id: string;
  role: 'customer';
  name: string;
  email: string;
  createdAt: number;
}

export interface Provider {
  id: string;
  role: 'provider';
  name: string;
  email: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  categoryId: string;
  subcategoryIds: string[];
  profileImageUrl: string;
  isPaid: boolean;
  lastPaymentId: string | null;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface Payment {
  id: string;
  userId: string;
  type: 'listing' | 'reveal';
  categoryId: string;
  subcategoryId: string | null;
  providerId: string | null; // set for reveal payments
  amount: number;
  razorpayPaymentId: string;
  createdAt: number;
}
