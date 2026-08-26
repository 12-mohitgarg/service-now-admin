// Seed subjects from DEPARTMENTS constant to Firestore
// Run with: npx tsx scripts/seedSubjects.ts

import { db, auth } from '../src/lib/firebase';
import { collection, getDocs, updateDoc, doc, addDoc, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { DEPARTMENTS } from '../src/lib/constants';

async function seedSubjects() {
  try {
    // Authenticate as admin first
    console.log('🔐 Authenticating as admin...');
    const email = 'admin@internmitra.com';
    const password = 'Mohit@123';
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Admin authenticated successfully');

    console.log('\n🔄 Seeding subjects from DEPARTMENTS constant...');

    // Fetch existing degrees
    const degreesRef = collection(db, 'degrees');
    const q = query(degreesRef, orderBy('name'));
    const degreesSnapshot = await getDocs(q);
    const existingDegrees = degreesSnapshot.docs.map(d => ({ 
      id: d.id, 
      name: d.data().name, 
      subjects: d.data().subjects || [] 
    }));

    console.log(`📚 Found ${existingDegrees.length} existing degrees in database`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const [branchName, subjects] of Object.entries(DEPARTMENTS)) {
      const existingDegree = existingDegrees.find(d => d.name === branchName);

      if (existingDegree) {
        // Update existing degree with subjects
        await updateDoc(doc(db, 'degrees', existingDegree.id), {
          subjects: subjects
        });
        console.log(`✅ Updated ${branchName} with ${subjects.length} subjects`);
        updatedCount++;
      } else {
        // Create new degree with subjects
        await addDoc(collection(db, 'degrees'), {
          name: branchName,
          subjects: subjects,
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added ${branchName} with ${subjects.length} subjects`);
        addedCount++;
      }
    }

    console.log('\n✅ Subjects seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Added: ${addedCount} new branches`);
    console.log(`   - Updated: ${updatedCount} existing branches`);
    console.log(`   - Total branches: ${Object.keys(DEPARTMENTS).length}`);
    console.log(`   - Total subjects: ${Object.values(DEPARTMENTS).flat().length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    console.error('\n💡 Make sure:');
    console.error('1. You are logged in as admin (admin@internmitra.com)');
    console.error('2. Firestore rules allow admin write access to degrees collection');
    console.error('3. Your internet connection is stable');
    process.exit(1);
  }
}

seedSubjects();
