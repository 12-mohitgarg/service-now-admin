import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Custom zero-dependency parser for .env
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        // Match key=value ignoring spaces
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      });
    } else {
      console.warn('⚠️ No .env file found at:', envPath);
    }
  } catch (err) {
    console.error('❌ Failed to load .env file:', err);
  }
}

// Load env variables
loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Log config keys to verify loading (omitting sensitive api key value)
console.log('Firebase Configuration Loaded:');
console.log(`- Project ID: ${firebaseConfig.projectId}`);
console.log(`- Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`- API Key Loaded: ${firebaseConfig.apiKey ? 'Yes' : 'No'}`);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = 'admin@internmitra.com';
  const password = 'Mohit@123';

  console.log('\n--- Admin Creation Process ---');
  let user;

  try {
    console.log(`Attempting to register user: ${email} in Firebase Auth...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    console.log(`✅ User registered in Firebase Auth with UID: ${user.uid}`);
  } catch (authError: any) {
    if (authError.code === 'auth/email-already-in-use') {
      console.log('⚠️ Email already exists in Firebase Auth. Logging in to retrieve UID...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log(`✅ Logged in successfully. UID: ${user.uid}`);
      } catch (signInError: any) {
        console.error(`❌ Failed to log in with existing user: ${signInError.message}`);
        console.log('Ensure you are using the correct credentials or delete the user from Firebase console.');
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to register user: ${authError.message}`);
      process.exit(1);
    }
  }

  if (user) {
    try {
      console.log(`Writing admin document for UID: ${user.uid} in Firestore 'admins' collection...`);
      await setDoc(doc(db, 'admins', user.uid), {
        email: email,
        role: 'admin',
        isActive: true,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Admin document successfully created/updated in Firestore!');
      console.log('\n======================================================');
      console.log('Admin Account Details for Login:');
      console.log(`Email:    ${email}`);
      console.log(`Password: ${password}`);
      console.log('======================================================');
    } catch (firestoreError: any) {
      console.error(`❌ Failed to write to Firestore: ${firestoreError.message}`);
      console.log('\nThis usually happens if your Firestore rules restrict write access.');
      console.log(`Please add the document manually in your Firebase console under the 'admins' collection:`);
      console.log(`- Document ID: ${user.uid}`);
      console.log(`- Fields:\n  email: "${email}"\n  role: "admin"\n  isActive: true\n  uid: "${user.uid}"`);
      process.exit(1);
    }
  }
}

createAdmin();
