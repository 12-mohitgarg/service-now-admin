// Update admin document with Firebase Auth UID
// Run with: npx tsx scripts/updateAdminUid.ts

import { db } from '../src/lib/firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

async function updateAdminUid() {
  try {
    const adminId = 'admin_001';
    const firebaseAuthUid = 'rlkX7qUhEudIz1B8BEYx5hHTDZA';

    console.log('Updating admin document with Firebase Auth UID...');
    
    // Check if admin document exists
    const adminDoc = await getDoc(doc(db, 'admins', adminId));
    
    if (adminDoc.exists()) {
      await updateDoc(doc(db, 'admins', adminId), {
        uid: firebaseAuthUid
      });
      console.log('✅ Updated existing admin document with UID');
    } else {
      // Create admin document
      await setDoc(doc(db, 'admins', firebaseAuthUid), {
        email: 'admin@internmitra.com',
        password: 'Mohit@123',
        role: 'super_admin',
        fullName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isActive: true,
        uid: firebaseAuthUid
      });
      console.log('✅ Created new admin document with Firebase Auth UID as document ID');
    }

    console.log('Firebase Auth UID:', firebaseAuthUid);
    console.log('You can now login with: admin@internmitra.com / Mohit@123');
    
  } catch (error) {
    console.error('❌ Error updating admin document:', error);
  }
}

updateAdminUid();
