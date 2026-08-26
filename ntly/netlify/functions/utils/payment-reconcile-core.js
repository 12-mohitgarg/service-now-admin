const Razorpay = require('razorpay');
const { getAdminApp } = require('./firebase-admin');
const { getRazorpayConfig } = require('./payment-config');
const { sendPaymentSuccessEmail } = require('./payment-success-email');

async function markPaymentSuccess(firebaseAdmin, orderData, payment, verifiedBy) {
  const verifiedAt = new Date().toISOString();
  const userRef = firebaseAdmin.firestore().collection('users').doc(orderData.userId);
  const paymentRef = firebaseAdmin.firestore().collection('payments').doc(payment.id);
  const orderRef = firebaseAdmin.firestore().collection('paymentOrders').doc(orderData.razorpayOrderId);

  const batch = firebaseAdmin.firestore().batch();
  batch.update(userRef, {
    isPaid: true,
    hasPaid: true,
    paymentStatus: 'success',
    paymentVerifiedAt: verifiedAt,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: payment.id,
  });
  batch.set(paymentRef, {
    userId: orderData.userId,
    createdByEmitraId: orderData.createdByEmitraId || null,
    createdByEmitraName: orderData.createdByEmitraName || null,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: payment.id,
    amount: orderData.amount,
    amountPaise: orderData.amountPaise,
    currency: orderData.currency || payment.currency || 'INR',
    status: 'success',
    verifiedBy,
    timestamp: verifiedAt,
  }, { merge: true });
  batch.update(orderRef, {
    status: 'success',
    razorpayPaymentId: payment.id,
    verifiedAt,
    verifiedBy,
  });

  await batch.commit();

  let emailResult = null;
  let emailErrorMessage = null;
  try {
    emailResult = await sendPaymentSuccessEmail(firebaseAdmin, orderData.userId, payment.id);
  } catch (emailError) {
    emailErrorMessage = emailError?.message || 'Unknown email error';
    console.error('Reconcile success email failed:', emailError);
    await userRef.set({
      paymentSuccessEmailFailedAt: new Date().toISOString(),
      paymentSuccessEmailError: emailErrorMessage,
      paymentSuccessEmailForPaymentId: payment.id,
    }, { merge: true });
  }

  return { emailResult, emailError: emailErrorMessage };
}

async function getSuccessfulPaymentForOrder(razorpay, orderData) {
  if (!orderData.razorpayOrderId) {
    throw new Error('Payment order is missing Razorpay order id');
  }

  const payments = await razorpay.orders.fetchPayments(orderData.razorpayOrderId);
  const items = payments?.items || [];

  const captured = items.find((payment) =>
    payment.status === 'captured' &&
    Number(payment.amount) === Number(orderData.amountPaise)
  );

  if (captured) return captured;

  const authorized = items.find((payment) =>
    payment.status === 'authorized' &&
    Number(payment.amount) === Number(orderData.amountPaise)
  );

  if (!authorized) return null;

  return razorpay.payments.capture(
    authorized.id,
    Number(orderData.amountPaise),
    orderData.currency || authorized.currency || 'INR'
  );
}

async function reconcilePayments({ limit = 100, verifiedBy = 'razorpay_reconcile' } = {}) {
  const firebaseAdmin = getAdminApp();
  const { keyId, keySecret } = await getRazorpayConfig();
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const snapshot = await firebaseAdmin
    .firestore()
    .collection('paymentOrders')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  let checked = 0;
  let updated = 0;
  let emailsSent = 0;
  let emailsSkipped = 0;
  let emailsFailed = 0;
  const failures = [];

  for (const orderDoc of snapshot.docs) {
    checked += 1;
    const orderData = orderDoc.data();
    const orderStatus = String(orderData.status || 'created');

    if (orderStatus === 'success') {
      continue;
    }

    try {
      const payment = await getSuccessfulPaymentForOrder(razorpay, orderData);

      if (payment) {
        const result = await markPaymentSuccess(firebaseAdmin, orderData, payment, verifiedBy);
        updated += 1;
        if (result?.emailResult?.sent) emailsSent += 1;
        if (result?.emailResult?.skipped) emailsSkipped += 1;
        if (result?.emailError) emailsFailed += 1;
      }
    } catch (error) {
      failures.push({
        orderId: orderData.razorpayOrderId || orderDoc.id,
        message:
          error?.error?.description ||
          error?.error?.reason ||
          error?.description ||
          error?.message ||
          'Unknown reconciliation error',
      });
    }
  }

  return { checked, updated, emailsSent, emailsSkipped, emailsFailed, failures };
}

module.exports = {
  getSuccessfulPaymentForOrder,
  markPaymentSuccess,
  reconcilePayments,
};
