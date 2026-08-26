const { getAdminApp, json, requireAdmin } = require('./utils/firebase-admin');

function getUid(event) {
  const path = event.path || '';
  const match = path.match(/\/api\/admin\/sub-users\/([^/?#]+)|\/\.netlify\/functions\/admin-sub-user\/([^/?#]+)/);
  return decodeURIComponent(match?.[1] || match?.[2] || event.queryStringParameters?.uid || '');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireAdmin(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const uid = getUid(event).trim();
    if (!uid) {
      return json(400, { error: 'Sub user id is required' });
    }

    if (uid === authResult.decodedToken.uid) {
      return json(400, { error: 'You cannot delete your own admin account' });
    }

    const firebaseAdmin = getAdminApp();
    const db = firebaseAdmin.firestore();
    const subUserDoc = await db.collection('admins').doc(uid).get();

    if (!subUserDoc.exists || !['sub_user', 'district_user'].includes(String(subUserDoc.data()?.role || ''))) {
      return json(404, { error: 'Sub user not found' });
    }

    await Promise.all([
      db.collection('admins').doc(uid).delete(),
      firebaseAdmin.auth().deleteUser(uid).catch((error) => {
        if (error?.code !== 'auth/user-not-found') {
          throw error;
        }
      }),
    ]);

    return json(200, { status: 'success' });
  } catch (error) {
    console.error('Sub user delete error:', error);
    return json(500, {
      error: 'Error deleting sub user',
      details: error?.message || 'Unknown error',
    });
  }
};
