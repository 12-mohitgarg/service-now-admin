const { getAdminApp, json, requireAdmin } = require('./utils/firebase-admin');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function makeCollegeEmail(collegeId, collegeName) {
  const base = String(collegeName || collegeId || 'college')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 34) || 'college';
  const suffix = String(collegeId || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8);
  return `college-${base}${suffix ? `-${suffix}` : ''}@internmitra.com`;
}

function makePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = 'IM';
  for (let i = 0; i < 10; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireAdmin(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const collegeId = String(parsedBody.collegeId || '').trim();
    let collegeName = String(parsedBody.collegeName || '').trim();
    let districtId = String(parsedBody.districtId || '').trim();
    const contactPerson = String(parsedBody.contactPerson || '').trim();
    let email = normalizeEmail(parsedBody.email);
    const password = String(parsedBody.password || makePassword());

    if (!collegeId) {
      return json(400, { error: 'College is required' });
    }

    if (password.length < 6) {
      return json(400, { error: 'Password must be at least 6 characters' });
    }

    const firebaseAdmin = getAdminApp();
    const db = firebaseAdmin.firestore();
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();

    if (!collegeDoc.exists) {
      return json(404, { error: 'College not found' });
    }

    const collegeData = collegeDoc.data() || {};
    collegeName = collegeName || String(collegeData.name || '').trim();
    districtId = districtId || String(collegeData.districtId || '').trim();

    if (!collegeName || !districtId) {
      return json(400, { error: 'College record is missing name or district' });
    }

    const existingForCollege = await db
      .collection('collegeUsers')
      .where('collegeId', '==', collegeId)
      .limit(1)
      .get();

    let authUser;
    let created = false;

    const hasExistingCollegeLogin = !existingForCollege.empty;

    if (hasExistingCollegeLogin) {
      const existingDoc = existingForCollege.docs[0];
      email = email || makeCollegeEmail(collegeId, collegeName);
      authUser = await firebaseAdmin.auth().updateUser(existingDoc.id, {
        email,
        password,
        displayName: collegeName,
        disabled: false,
      });
    } else {
      email = email || makeCollegeEmail(collegeId, collegeName);
      try {
        authUser = await firebaseAdmin.auth().getUserByEmail(email);
        const [studentDoc, adminDoc, emitraDoc] = await Promise.all([
          db.collection('users').doc(authUser.uid).get(),
          db.collection('admins').doc(authUser.uid).get(),
          db.collection('emitras').doc(authUser.uid).get(),
        ]);

        if (studentDoc.exists || adminDoc.exists || emitraDoc.exists) {
          return json(409, { error: 'This email already belongs to another account type' });
        }

        await firebaseAdmin.auth().updateUser(authUser.uid, {
          password,
          displayName: collegeName,
          disabled: false,
        });
      } catch (error) {
        if (error?.code !== 'auth/user-not-found') {
          throw error;
        }

        authUser = await firebaseAdmin.auth().createUser({
          email,
          password,
          displayName: collegeName,
          disabled: false,
        });
        created = true;
      }
    }

    const now = new Date().toISOString();
    const profilePayload = {
      uid: authUser.uid,
      collegeId,
      collegeName,
      districtId,
      contactPerson,
      email,
      isActive: true,
      role: 'college',
      updatedAt: now,
      createdBy: authResult.decodedToken.uid,
    };

    await db.collection('collegeUsers').doc(authUser.uid).set(
      hasExistingCollegeLogin
        ? profilePayload
        : { ...profilePayload, createdAt: now },
      { merge: true }
    );

    return json(200, {
      status: 'success',
      created,
      uid: authUser.uid,
      email,
      password,
      collegeName,
    });
  } catch (error) {
    console.error('College user create/update error:', error);
    return json(500, {
      error: 'Error saving college login',
      details: error?.message || 'Unknown error',
    });
  }
};
