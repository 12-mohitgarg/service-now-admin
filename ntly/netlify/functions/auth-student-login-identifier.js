const { getAdminApp, json } = require('./utils/firebase-admin');

function normalizeLoginIdentifier(value) {
  return String(value || '').trim();
}

function uniqueIdentifierValues(value) {
  return Array.from(new Set([
    value,
    value.toUpperCase(),
    value.toLowerCase(),
  ].filter(Boolean)));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const parsedBody = JSON.parse(event.body || '{}');
    const identifier = normalizeLoginIdentifier(parsedBody.identifier);

    if (!identifier) {
      return json(400, { error: 'Login ID is required' });
    }

    if (identifier.includes('@')) {
      return json(200, { email: identifier.toLowerCase() });
    }

    const firebaseAdmin = getAdminApp();
    const db = firebaseAdmin.firestore();
    const usersRef = db.collection('users');
    const phone = identifier.replace(/\D/g, '').slice(-10);
    const lookups = [];

    if (phone.length === 10) {
      lookups.push(usersRef.where('contactNumber', '==', phone).limit(1).get());
    }

    for (const value of uniqueIdentifierValues(identifier)) {
      lookups.push(usersRef.where('universityRoll', '==', value).limit(1).get());
      lookups.push(usersRef.where('universityRollNo', '==', value).limit(1).get());
    }

    const snapshots = await Promise.all(lookups);
    const matchedDoc = snapshots.find((snapshot) => !snapshot.empty)?.docs[0];
    const email = String(matchedDoc?.data()?.email || '').trim().toLowerCase();

    if (!matchedDoc || !email) {
      return json(404, { error: 'No student account found for this login ID' });
    }

    return json(200, { email });
  } catch (error) {
    console.error('Student login identifier lookup error:', error);
    return json(500, {
      error: 'Unable to verify login ID',
      details: error?.message || 'Unknown error',
    });
  }
};
