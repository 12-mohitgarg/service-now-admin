const admin = require('firebase-admin');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function getFirebaseAdminCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }

  const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || 'intermitra-backup';
  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = getFirebasePrivateKey();

  if (clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return admin.credential.applicationDefault();
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

function cleanEnvValue(value) {
  return value
    ?.trim()
    .replace(/,$/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/,$/, '')
    .trim();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getFirebaseAdminCredential(),
    projectId: getFirebaseProjectId(),
  });
}

async function requireDashboardOperator(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { allowed: false, response: json(401, { error: 'Missing admin authorization token' }) };
  }

  const decodedToken = await admin.auth().verifyIdToken(token);

  if (decodedToken.email === 'admin@internmitra.com' || decodedToken.email === 'gargmohit8306@gmail.com') {
    return { allowed: true };
  }

  const adminDoc = await admin.firestore().collection('admins').doc(decodedToken.uid).get();
  const adminData = adminDoc.exists ? adminDoc.data() : null;
  const isAllowedAdmin =
    adminData?.isActive === true &&
    ['admin', 'super_admin', 'sub_user'].includes(String(adminData?.role || ''));

  if (!isAllowedAdmin) {
    return { allowed: false, response: json(403, { error: 'Only dashboard operators can update user passwords' }) };
  }

  return { allowed: true };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'PATCH') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireDashboardOperator(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const uid = event.queryStringParameters?.uid || parsedBody.uid;
    const { password } = parsedBody;

    if (!uid) {
      return json(400, { error: 'User id is required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return json(400, { error: 'Password must be at least 6 characters' });
    }

    await admin.auth().updateUser(uid, { password });
    return json(200, { status: 'success' });
  } catch (error) {
    console.error('Password update error:', error);
    return json(500, {
      error: 'Error updating user password',
      details: error?.message || 'Unknown error',
    });
  }
};
