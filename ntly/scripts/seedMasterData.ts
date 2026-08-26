// Seed Firestore with master data from constants.ts
// Run with: npx tsx scripts/seedMasterData.ts

import { db, auth } from '../src/lib/firebase';
import { collection, addDoc, getDocs, query, where, writeBatch, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { DISTRICTS, COLLEGES, UNIVERSITIES, INTERNSHIP_DOMAINS } from '../src/lib/constants';

async function seedMasterData() {
  try {
    // Authenticate as admin first
    console.log('🔐 Authenticating as admin...');
    const email = 'admin@internmitra.com';
    const password = 'Mohit@123';
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Admin authenticated successfully');

    console.log('\n🌱 Starting master data seeding...');

    // Seed Districts
    console.log('Seeding districts...');
    const districtsRef = collection(db, 'districts');
    const districtsSnapshot = await getDocs(districtsRef);
    const existingDistricts = new Set(districtsSnapshot.docs.map(doc => doc.data().name));
    
    for (const districtName of DISTRICTS) {
      if (!existingDistricts.has(districtName)) {
        await addDoc(districtsRef, {
          name: districtName,
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added district: ${districtName}`);
      } else {
        console.log(`⏭️  District already exists: ${districtName}`);
      }
    }

    // Seed Colleges (need to get district IDs first)
    console.log('\nSeeding colleges...');
    const districtsQuerySnapshot = await getDocs(districtsRef);
    const districtMap = new Map<string, string>();
    districtsQuerySnapshot.forEach(doc => {
      districtMap.set(doc.data().name, doc.id);
    });

    const collegesRef = collection(db, 'colleges');
    const collegesSnapshot = await getDocs(collegesRef);
    const existingColleges = new Set(collegesSnapshot.docs.map(doc => doc.data().name));

    for (const [districtName, colleges] of Object.entries(COLLEGES)) {
      const districtId = districtMap.get(districtName);
      if (!districtId) {
        console.log(`⚠️  District ID not found for: ${districtName}`);
        continue;
      }

      for (const collegeName of colleges) {
        if (!existingColleges.has(collegeName)) {
          await addDoc(collegesRef, {
            name: collegeName,
            districtId: districtId,
            createdAt: new Date().toISOString()
          });
          console.log(`✅ Added college: ${collegeName} (${districtName})`);
        } else {
          console.log(`⏭️  College already exists: ${collegeName}`);
        }
      }
    }

    // Seed Universities
    console.log('\nSeeding universities...');
    const universitiesRef = collection(db, 'universities');
    const universitiesSnapshot = await getDocs(universitiesRef);
    const existingUniversities = new Set(universitiesSnapshot.docs.map(doc => doc.data().name));

    for (const universityName of UNIVERSITIES) {
      if (!existingUniversities.has(universityName)) {
        await addDoc(universitiesRef, {
          name: universityName,
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added university: ${universityName}`);
      } else {
        console.log(`⏭️  University already exists: ${universityName}`);
      }
    }

    // Seed Courses (Internship Domains)
    console.log('\nSeeding courses...');
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);
    const existingCourses = new Set(coursesSnapshot.docs.map(doc => doc.data().name));

    for (const courseName of INTERNSHIP_DOMAINS) {
      if (!existingCourses.has(courseName)) {
        await addDoc(coursesRef, {
          name: courseName,
          price: 1000, // Default price, can be updated via admin dashboard
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added course: ${courseName}`);
      } else {
        console.log(`⏭️  Course already exists: ${courseName}`);
      }
    }

    console.log('\n✅ Master data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Districts: ${DISTRICTS.length}`);
    console.log(`   - Colleges: ${Object.values(COLLEGES).flat().length}`);
    console.log(`   - Universities: ${UNIVERSITIES.length}`);
    console.log(`   - Courses: ${INTERNSHIP_DOMAINS.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding master data:', error);
    process.exit(1);
  }
}

seedMasterData();
