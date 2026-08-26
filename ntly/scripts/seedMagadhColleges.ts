// Seed Firestore with Magadh University colleges
// Run with: npx tsx scripts/seedMagadhColleges.ts

import { db, auth } from '../src/lib/firebase';
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

const COLLEGES_DATA: Record<string, string[]> = {
  "Gaya": [
    "A.M. College, Gaya",
    "Gaya College, Gaya",
    "G.B.M. College, Gaya",
    "J.J. College, Gaya",
    "Mirza Ghalib College, Gaya",
    "B.N.S. College, Sobh, Barachatti, Gaya",
    "S.P.Y. College, Gaya",
    "M.S.Y. College, Gaya",
    "Mahabodhi College, Belaganj, Gaya",
    "Mahavir College, Gaya",
    "R. L. S. Y. College, Gaya",
    "S. D. College, Paraiya, Gaya",
    "S. M. College, Bodhgaya",
    "Wazirganj College, Wazirganj, Gaya",
    "S.N.S. College, Tekari",
    "S.M.S.G. College, Sherghati",
    "Mahila College Tekari, Gaya",
    "Laloo Mandal College, Gaya",
    "Maa Bageshwari College, Gaya",
    "Sanjay Singh Yadav College, Gaya",
    "Kamta Prasad Singh College, Gaya",
    "Laldhari Memorial College, Gaya",
    "Prof. Vijay Shankar Rai Mahila College, Sherghati, Gaya",
    "Dr. Zakir Hussain Evening College, Sherghati, Gaya",
    "C.S. Janta College, Chakand, Gaya",
    "Lila Mandal College of A.H. Education, Tankuppa, Gaya",
    "Sanjay Gandhi Mahila College, Bairagi, Gaya",
    "Bhuneshwar Prasad Yadav College, Gaya",
    "Gautam Buddha College, Belaganj, Gaya",
    "Laxmi Narayan College, Tankuppa, Gaya",
    "S.M.P. College, Fatehpur, Gaya",
    "Kesho Mahto Memorial College, Pathra, Imamganj, Gaya"
  ],
  "Aurangabad": [
    "A.N.S. College, Nabinagar",
    "K.S.M. College, Aurangabad",
    "R.L.S.Y. College, Aurangabad",
    "S. Sinha College, Aurangabad",
    "Kishori Sinha Mahila College, Aurangabad",
    "K.S.Y. College, Barun, Aurangabad",
    "Maharana Pratap College, Dev, Aurangabad",
    "Mahila College, Daudnagar, Aurangabad",
    "Thakur B. D. Sinha Jangta College, Goh",
    "Dr. Vijay Kumar Singh College, Rafiganj",
    "Janta College, Labhari, Aurangabad",
    "Jang Bahadur Singh Memorial College",
    "Ramrati Sundarshila College, Aurangabad",
    "Adhikari College, Silar, Aurangabad",
    "Sanjay Singh Yadav College, Rafiganj, Aurangabad",
    "Rajdeo Ramchandra College, Banahi Fhesar, Aurangabad",
    "Ramsharan Yadav College, Deokund, Aurangabad",
    "Anugraha Narayan Sinha Memorial, Aurangabad"
  ],
  "Nawada": [
    "K.L.S. College, Nawada",
    "R.M.W. College, Nawada",
    "S.N. Sinha College, Warsaliganj",
    "T.S. College, Hisua",
    "Krishak College, Dewdha, Pakribarwan",
    "Mahila College, Warisaliganj, Nawada",
    "S. K. M. College, Nawada",
    "S.R.S. College, Nawada",
    "Ravi Kant Poonam College, Nawada",
    "Saptrishi College, Nawada",
    "Nadariganj College, Nadariganj",
    "S.A. College, Nawada",
    "Guro Binda College, Nawada",
    "Suresh Radhika College, Maya Bigha, Kadirganj, Nawada"
  ],
  "Jehanabad": [
    "S.N. Sinha College, Jehanabad",
    "S.S. College, Jehanabad",
    "B. B. M. College, Okri, Jehanabad",
    "Sri Krishna Mahila College, Jehanabad",
    "Anugrah Smarak College, Jehanabad",
    "Jehanabad College, Jehanabad",
    "Ram Lakhan Singh Yadav College, Jehanabad",
    "Maa Kamla Chandrika Jee Vidyapeeth, Hulasganj, Jehanabad",
    "Kamta Prasad Sharma College, Hulasganj",
    "Maa Kamla Chandrika Babu Mahila Mahavidyalaya, Jehanabad"
  ],
  "Arwal": [
    "S.B.A.N. College, Darheta Lari",
    "S.D. College, Kaler",
    "Fatehpur Sanda College, Arwal",
    "R.C.S. College, Kurtha, Arwal",
    "Shaheed Jagdev Smarak College, Kurtha",
    "Dr. Ram Narayan Prasad College, Arwal"
  ]
};

async function seedMagadhColleges() {
  try {
    // 1. Authenticate as Admin
    console.log('🔐 Authenticating as admin...');
    const email = 'admin@internmitra.com';
    const password = 'Mohit@123';
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Admin authenticated successfully');

    // 2. Fetch or Create "Magadh University"
    console.log('\n🏫 Checking Magadh University...');
    const universitiesRef = collection(db, 'universities');
    const uniSnapshot = await getDocs(query(universitiesRef, where('name', '==', 'Magadh University')));
    let universityId = '';

    if (!uniSnapshot.empty) {
      universityId = uniSnapshot.docs[0].id;
      console.log(`⏭️ Magadh University already exists (ID: ${universityId})`);
    } else {
      const docRef = await addDoc(universitiesRef, {
        name: 'Magadh University',
        createdAt: new Date().toISOString()
      });
      universityId = docRef.id;
      console.log(`✅ Created Magadh University (ID: ${universityId})`);
    }

    // 3. Fetch or Create Districts & Build Map
    console.log('\n📍 Checking Districts...');
    const districtsRef = collection(db, 'districts');
    const districtMap = new Map<string, string>();
    
    // Fetch all existing districts
    const distSnapshot = await getDocs(districtsRef);
    distSnapshot.forEach(doc => {
      districtMap.set(doc.data().name, doc.id);
    });

    const targetDistricts = Object.keys(COLLEGES_DATA);
    for (const distName of targetDistricts) {
      if (!districtMap.has(distName)) {
        const docRef = await addDoc(districtsRef, {
          name: distName,
          createdAt: new Date().toISOString()
        });
        districtMap.set(distName, docRef.id);
        console.log(`✅ Created district: ${distName} (ID: ${docRef.id})`);
      } else {
        console.log(`⏭️ District already exists: ${distName} (ID: ${districtMap.get(distName)})`);
      }
    }

    // 4. Fetch Existing Colleges to prevent duplicates
    console.log('\n🎓 Fetching existing colleges...');
    const collegesRef = collection(db, 'colleges');
    const collegesSnapshot = await getDocs(collegesRef);
    const existingColleges = new Set<string>();
    collegesSnapshot.forEach(doc => {
      const data = doc.data();
      // create a unique string representation: name-districtId-universityId
      const key = `${data.name.trim()}-${data.districtId}-${data.universityId || ''}`.toLowerCase();
      existingColleges.add(key);
    });

    // 5. Batch Insert Colleges
    console.log('\n🚀 Starting batch insertion of colleges...');
    let totalAdded = 0;
    let totalSkipped = 0;
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const [distName, colleges] of Object.entries(COLLEGES_DATA)) {
      const districtId = districtMap.get(distName)!;

      for (const colName of colleges) {
        const nameClean = colName.trim();
        const key = `${nameClean}-${districtId}-${universityId}`.toLowerCase();

        if (!existingColleges.has(key)) {
          const newDocRef = doc(collection(db, 'colleges'));
          batch.set(newDocRef, {
            name: nameClean,
            districtId: districtId,
            universityId: universityId,
            price: 1000,
            createdAt: new Date().toISOString()
          });
          existingColleges.add(key); // prevent duplicate in the same seed run
          batchCount++;
          totalAdded++;

          if (batchCount === 400) {
            console.log(`Writing batch of ${batchCount} colleges...`);
            await batch.commit();
            batchCount = 0;
          }
        } else {
          totalSkipped++;
        }
      }
    }

    // Commit any remaining writes in batch
    if (batchCount > 0) {
      console.log(`Writing final batch of ${batchCount} colleges...`);
      await batch.commit();
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`➕ Total colleges added: ${totalAdded}`);
    console.log(`⏭️ Total colleges skipped (duplicates): ${totalSkipped}`);

  } catch (error) {
    console.error('❌ Error seeding Magadh University colleges:', error);
  }
}

seedMagadhColleges();
