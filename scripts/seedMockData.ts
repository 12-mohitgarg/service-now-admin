import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          process.env[key] = value.trim();
        }
      });
    }
  } catch (err) {
    console.error('Failed to load env in seed script:', err);
  }
}
loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  try {
    console.log('Fetching active categories...');
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      console.log('❌ No categories found. Please add a category on the admin panel first.');
      return;
    }
    const category = catSnap.docs[0].data();
    const categoryId = catSnap.docs[0].id;
    console.log(`Using category: ${category.name} (${categoryId})`);

    console.log('Fetching subcategories...');
    const subSnap = await getDocs(collection(db, 'subcategories'));
    let subcategoryId = '';
    if (!subSnap.empty) {
      subcategoryId = subSnap.docs[0].id;
      console.log(`Using subcategory: ${subSnap.docs[0].data().name} (${subcategoryId})`);
    }

    const mockCustomerId = 'mock_cust_101';
    const mockProviderId = 'mock_prov_101';

    console.log('Adding mock customer...');
    await setDoc(doc(db, 'users', mockCustomerId), {
      name: 'Amit Sharma',
      email: 'amit.sharma@example.com',
      role: 'customer',
      createdAt: Date.now() - 86400000 * 2 // 2 days ago
    });

    console.log('Adding mock provider...');
    await setDoc(doc(db, 'providers', mockProviderId), {
      name: 'Rohan Woodworks',
      email: 'rohan.wood@example.com',
      phone: '9876543210',
      address: 'Mansarovar Link Rd, Jaipur, Rajasthan',
      categoryId: categoryId,
      subcategoryIds: subcategoryId ? [subcategoryId] : [],
      profileImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150',
      isPaid: true,
      lastPaymentId: 'pay_listing_001',
      status: 'active',
      role: 'provider',
      createdAt: Date.now() - 86400000 * 5 // 5 days ago
    });

    console.log('Adding mock payments...');
    // Payment 1: Listing fee from Provider
    await setDoc(doc(db, 'payments', 'pay_listing_001'), {
      userId: mockProviderId,
      type: 'listing',
      categoryId: categoryId,
      subcategoryId: null,
      providerId: null,
      amount: 500,
      razorpayPaymentId: 'pay_RpListing101',
      createdAt: Date.now() - 86400000 * 5
    });

    // Payment 2: Reveal fee from Customer to unlock Provider
    await setDoc(doc(db, 'payments', 'pay_reveal_001'), {
      userId: mockCustomerId,
      type: 'reveal',
      categoryId: categoryId,
      subcategoryId: subcategoryId || null,
      providerId: mockProviderId,
      amount: 49,
      razorpayPaymentId: 'pay_RpReveal202',
      createdAt: Date.now() - 86400000 * 1 // 1 day ago
    });

    console.log('✅ Mock data successfully seeded!');
  } catch (err) {
    console.error('❌ Error seeding data:', err);
  }
}

seed();
