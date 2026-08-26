const Razorpay = require('razorpay');
const { getAdminApp, isEmitraUser, json, requireSignedIn } = require('./utils/firebase-admin');
const { getRazorpayConfig } = require('./utils/payment-config');

async function getStudentForPayment(firebaseAdmin, decodedToken, paymentForUserId) {
  const targetUserId = paymentForUserId || decodedToken.uid;
  const userSnap = await firebaseAdmin.firestore().collection('users').doc(targetUserId).get();

  if (!userSnap.exists) {
    throw Object.assign(new Error('Student record not found'), { statusCode: 404 });
  }

  const student = { uid: userSnap.id, ...userSnap.data() };
  const isRejected = student.paymentStatus === 'rejected' || student.isPaid === false;

  if ((student.isPaid === true || student.hasPaid === true || student.paymentStatus === 'success') && !isRejected) {
    throw Object.assign(new Error('Student payment is already verified'), { statusCode: 409 });
  }

  if (targetUserId === decodedToken.uid) {
    return student;
  }

  const canPayForStudent =
    student.createdByEmitraId === decodedToken.uid &&
    (await isEmitraUser(decodedToken));

  if (!canPayForStudent) {
    throw Object.assign(new Error('You are not allowed to pay for this student'), { statusCode: 403 });
  }

  return student;
}

async function getCollegeAmount(firebaseAdmin, collegeName) {
  if (!collegeName) return 1000;

  const snapshot = await firebaseAdmin
    .firestore()
    .collection('colleges')
    .where('name', '==', collegeName)
    .limit(1)
    .get();

  const price = snapshot.docs[0]?.data()?.price;
  return Number.isFinite(Number(price)) && Number(price) > 0 ? Number(price) : 1000;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireSignedIn(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const { paymentForUserId } = JSON.parse(event.body || '{}');
    const firebaseAdmin = getAdminApp();
    const student = await getStudentForPayment(firebaseAdmin, authResult.decodedToken, paymentForUserId);
    const amount = await getCollegeAmount(firebaseAdmin, student.college);
    const { keyId, keySecret } = await getRazorpayConfig();

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `im_${student.uid.slice(0, 18)}_${Date.now()}`,
      notes: {
        userId: student.uid,
        college: student.college || '',
        createdByEmitraId: student.createdByEmitraId || '',
      },
    });

    await firebaseAdmin.firestore().collection('paymentOrders').doc(order.id).set({
      userId: student.uid,
      createdByEmitraId: student.createdByEmitraId || null,
      createdByEmitraName: student.createdByEmitraName || null,
      amount,
      amountPaise: order.amount,
      currency: order.currency,
      status: 'created',
      razorpayOrderId: order.id,
      requestedBy: authResult.decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    return json(200, {
      id: order.id,
      amount: order.amount,
      amountRupees: amount,
      currency: order.currency,
      key: keyId,
    });
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    return json(error?.statusCode || 500, {
      error: 'Error creating Razorpay order',
      details: error?.description || error?.message || 'Unknown error',
    });
  }
};
