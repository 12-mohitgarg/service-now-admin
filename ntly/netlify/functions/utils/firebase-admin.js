const admin = require('firebase-admin');

function cleanEnvValue(value) {
  return value
    ?.trim()
    .replace(/,$/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/,$/, '')
    .trim();
}

function getFirebasePrivateKey() {
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  }

  return process.env.FIREBASE_PRIVATE_KEY
    ?.trim()
    .replace(/,$/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/,$/, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function getFirebaseProjectId() {
  return cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || 'intermitra-backup';
}

function getFirebaseAdminCredential() {
  try {
    const fs = require('fs');
    const path = require('path');
    const saPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(saPath)) {
      return admin.credential.cert(saPath);
    }
  } catch (err) {
    // Ignore fallback
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }

  const projectId = getFirebaseProjectId();
  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = getFirebasePrivateKey();

  if (clientEmail && privateKey) {
    return admin.credential.cert({ projectId, clientEmail, privateKey });
  }

  return admin.credential.applicationDefault();
}

function getAdminApp() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: getFirebaseAdminCredential(),
      projectId: getFirebaseProjectId(),
    });
  }

  return admin;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function requireSignedIn(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { allowed: false, response: json(401, { error: 'Missing authorization token' }) };
  }

  const firebaseAdmin = getAdminApp();
  const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
  return { allowed: true, decodedToken };
}

async function isAdminUser(decodedToken) {
  const email = String(decodedToken.email || '').toLowerCase();

  if (email === 'gargmohit8306@gmail.com' || email === 'admin@internmitra.com') {
    return true;
  }

  const firebaseAdmin = getAdminApp();
  const adminDoc = await firebaseAdmin.firestore().collection('admins').doc(decodedToken.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : null;

  return (
    adminData?.isActive === true &&
    ['admin', 'super_admin'].includes(String(adminData?.role || ''))
  );
}

async function isDashboardOperator(decodedToken) {
  if (await isAdminUser(decodedToken)) {
    return true;
  }

  const firebaseAdmin = getAdminApp();
  const adminDoc = await firebaseAdmin.firestore().collection('admins').doc(decodedToken.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : null;

  return (
    adminData?.isActive === true &&
    String(adminData?.role || '') === 'sub_user'
  );
}

async function isEmitraUser(decodedToken) {
  const firebaseAdmin = getAdminApp();
  const emitraDoc = await firebaseAdmin.firestore().collection('emitras').doc(decodedToken.uid).get();
  return emitraDoc.exists && emitraDoc.data()?.isActive === true;
}

async function requireDashboardOperator(event) {
  const authResult = await requireSignedIn(event);
  if (!authResult.allowed) {
    return authResult;
  }

  if (!(await isDashboardOperator(authResult.decodedToken))) {
    return { allowed: false, response: json(403, { error: 'Only dashboard operators can perform this action' }) };
  }

  return authResult;
}

async function requireAdmin(event) {
  const authResult = await requireSignedIn(event);
  if (!authResult.allowed) {
    return authResult;
  }

  if (!(await isAdminUser(authResult.decodedToken))) {
    return { allowed: false, response: json(403, { error: 'Only admins can perform this action' }) };
  }

  return authResult;
}

module.exports = {
  getAdminApp,
  isAdminUser,
  isDashboardOperator,
  isEmitraUser,
  json,
  requireAdmin,
  requireDashboardOperator,
  requireSignedIn,
};
