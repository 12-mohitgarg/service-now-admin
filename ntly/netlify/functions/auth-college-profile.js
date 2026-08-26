const { getAdminApp, json, requireSignedIn } = require('./utils/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireSignedIn(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const firebaseAdmin = getAdminApp();
    const db = firebaseAdmin.firestore();
    const directDoc = await db.collection('collegeUsers').doc(authResult.decodedToken.uid).get();

    if (directDoc.exists) {
      return json(200, { profile: { uid: directDoc.id, ...directDoc.data() } });
    }

    const email = String(authResult.decodedToken.email || '').trim().toLowerCase();
    if (!email) {
      return json(404, { error: 'College profile not found' });
    }

    const byEmail = await db
      .collection('collegeUsers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (byEmail.empty) {
      return json(404, { error: 'College profile not found' });
    }

    const profileDoc = byEmail.docs[0];
    if (profileDoc.id !== authResult.decodedToken.uid) {
      await db.collection('collegeUsers').doc(authResult.decodedToken.uid).set(
        { uid: authResult.decodedToken.uid, ...profileDoc.data(), updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }

    return json(200, { profile: { uid: authResult.decodedToken.uid, ...profileDoc.data() } });
  } catch (error) {
    console.error('College profile lookup error:', error);
    return json(500, {
      error: 'Unable to load college profile',
      details: error?.message || 'Unknown error',
    });
  }
};
