// Create Firebase Auth user for admin
// Run with: npx tsx scripts/createAdminAuth.ts

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function createAdminAuth() {
  try {
    const email = 'admin@internmitra.com';
    const password = 'Mohit@123';

    console.log('Creating Firebase Auth user for admin...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Firebase Auth user created successfully!');
    console.log('User UID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    
    // IMPORTANT: Update the admin document in Firestore with this UID
    console.log('\n⚠️  IMPORTANT: Update Firestore admin document:');
    console.log('1. Go to Firebase Console → Firestore Database');
    console.log('2. Find the admin document (admin_001)');
    console.log('3. Add/update a field: uid with value:', userCredential.user.uid);
    
  } catch (error) {
    console.error('❌ Error creating Firebase Auth user:', error);
    if (error instanceof Error) {
      if (error.message.includes('email-already-in-use')) {
        console.log('Admin user already exists in Firebase Auth. You can login now.');
      }
    }
  }
}

createAdminAuth();
