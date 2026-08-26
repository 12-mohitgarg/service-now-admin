// Update all existing colleges to have price = 1000
// Run with: npx tsx scripts/updateCollegePrices.ts

import { db, auth } from '../src/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function updateCollegePrices() {
  try {
    // Authenticate as admin first
    console.log('🔐 Authenticating as admin...');
    const email = 'admin@internmitra.com';
    const password = 'Mohit@123';
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Admin authenticated successfully');

    console.log('\n🔄 Updating college prices...');

    // Fetch all colleges
    const collegesRef = collection(db, 'colleges');
    const collegesSnapshot = await getDocs(collegesRef);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const collegeDoc of collegesSnapshot.docs) {
      const collegeData = collegeDoc.data();
      
      if (collegeData.price !== undefined) {
        console.log(`⏭️  Skipping ${collegeData.name} - already has price: ₹${collegeData.price}`);
        skippedCount++;
      } else {
        await updateDoc(doc(db, 'colleges', collegeDoc.id), {
          price: 1000
        });
        console.log(`✅ Updated ${collegeData.name} to ₹1000`);
        updatedCount++;
      }
    }

    console.log('\n✅ College price update completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Updated: ${updatedCount} colleges`);
    console.log(`   - Skipped: ${skippedCount} colleges (already had price)`);
    console.log(`   - Total: ${collegesSnapshot.docs.length} colleges`);
    
  } catch (error) {
    console.error('❌ Error updating college prices:', error);
    process.exit(1);
  }
}

updateCollegePrices();
