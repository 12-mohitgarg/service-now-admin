// Add admin directly to Firestore
// Run with: npx tsx scripts/addAdmin.ts

import { db } from '../src/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function addAdmin() {
  try {
    const adminId = 'admin_001'; // This will be the document ID
    const adminData = {
      email: 'admin@internmitra.com',
      password: 'Mohit@123', // Note: In production, use Firebase Auth and hash passwords
      role: 'super_admin',
      fullName: 'System Administrator',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    console.log('Adding admin to Firestore...');
    await setDoc(doc(db, 'admins', adminId), adminData);
    
    console.log('✅ Admin added successfully!');
    console.log('Document ID:', adminId);
    console.log('Admin data:', adminData);
  } catch (error) {
    console.error('❌ Error adding admin:', error);
  }
}

addAdmin();
