const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getAdminApp, isEmitraUser, json, requireSignedIn } = require('./utils/firebase-admin');
const { getRazorpayConfig } = require('./utils/payment-config');
const { sendPaymentSuccessEmail } = require('./utils/payment-success-email');

function verifySignature(orderId, paymentId, signature, keySecret) {
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest('hex') === signature;
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body || '{}');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(400, { status: 'failure', message: 'Missing required verification parameters' });
    }

    const firebaseAdmin = getAdminApp();
    const { keyId, keySecret } = await getRazorpayConfig();

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      return json(400, { status: 'failure', message: 'Invalid signature' });
    }

    const orderSnap = await firebaseAdmin.firestore().collection('paymentOrders').doc(razorpay_order_id).get();
    if (!orderSnap.exists) {
      return json(404, { status: 'failure', message: 'Payment order not found' });
    }

    const orderData = orderSnap.data();
    const studentSnap = await firebaseAdmin.firestore().collection('users').doc(orderData.userId).get();
    const studentData = studentSnap.exists ? studentSnap.data() : null;

    const isOwnPayment = orderData.userId === authResult.decodedToken.uid;
    const isAllowedEmitraPayment =
      studentData?.createdByEmitraId === authResult.decodedToken.uid &&
      (await isEmitraUser(authResult.decodedToken));

    if (!isOwnPayment && !isAllowedEmitraPayment) {
      return json(403, { status: 'failure', message: 'You are not allowed to verify this payment' });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id === razorpay_order_id &&
      Number(payment.amount) === Number(orderData.amountPaise) &&
      payment.status === 'authorized'
    ) {
      payment = await razorpay.payments.capture(
        razorpay_payment_id,
        Number(orderData.amountPaise),
        orderData.currency || payment.currency || 'INR'
      );
    }

    if (
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !== Number(orderData.amountPaise) ||
      payment.status !== 'captured'
    ) {
      return json(400, { status: 'failure', message: 'Payment details did not match the order' });
    }

    const verifiedAt = new Date().toISOString();
    const batch = firebaseAdmin.firestore().batch();
    const userRef = firebaseAdmin.firestore().collection('users').doc(orderData.userId);
    const paymentRef = firebaseAdmin.firestore().collection('payments').doc(razorpay_payment_id);
    const orderRef = firebaseAdmin.firestore().collection('paymentOrders').doc(razorpay_order_id);

    batch.update(userRef, {
      isPaid: true,
      hasPaid: true,
      paymentStatus: 'success',
      paymentVerifiedAt: verifiedAt,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    batch.set(paymentRef, {
      userId: orderData.userId,
      createdByEmitraId: orderData.createdByEmitraId || null,
      createdByEmitraName: orderData.createdByEmitraName || null,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: orderData.amount,
      amountPaise: orderData.amountPaise,
      currency: orderData.currency || 'INR',
      status: 'success',
      verifiedBy: authResult.decodedToken.uid,
      timestamp: verifiedAt,
    }, { merge: true });

    batch.update(orderRef, {
      status: 'success',
      razorpayPaymentId: razorpay_payment_id,
      verifiedAt,
      verifiedBy: authResult.decodedToken.uid,
    });

    await batch.commit();

    if (studentData?.universityRoll) {
      try {
        const importedSnap = await firebaseAdmin.firestore()
          .collection("importedStudents")
          .where("universityRoll", "==", studentData.universityRoll)
          .limit(1)
          .get();
        if (!importedSnap.empty) {
          await importedSnap.docs[0].ref.update({
            paymentStatus: "success",
            paymentVerifiedAt: verifiedAt,
            razorpayPaymentId: razorpay_payment_id
          });
        }
      } catch (importUpdateErr) {
        console.error("Error updating imported student payment status in functions:", importUpdateErr);
      }
    }

    let emailResult = null;
    try {
      emailResult = await sendPaymentSuccessEmail(firebaseAdmin, orderData.userId, razorpay_payment_id);
    } catch (emailError) {
      console.error('Payment success email failed:', emailError);
    }

    return json(200, {
      status: 'success',
      userId: orderData.userId,
      paymentId: razorpay_payment_id,
      amount: orderData.amount,
      email: emailResult,
    });
  } catch (error) {
    console.error('Verification Error:', error);
    return json(500, {
      status: 'error',
      message: 'Internal server error during verification',
      details: error?.message || 'Unknown error',
    });
  }
};
