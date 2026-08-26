const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getAdminApp, json } = require('./utils/firebase-admin');
const { getRazorpayConfig } = require('./utils/payment-config');
const { sendPaymentSuccessEmail } = require('./utils/payment-success-email');
const { getSuccessfulPaymentForOrder, markPaymentSuccess } = require('./utils/payment-reconcile-core');

function verifyWebhookSignature(body, signature, webhookSecret) {
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return expected === signature;
}

async function markWebhookPaymentSuccess(firebaseAdmin, payment, verifiedBy) {
  const orderId = payment?.order_id;
  const paymentId = payment?.id;

  if (!orderId || !paymentId) {
    throw Object.assign(new Error('Webhook payment missing order or payment id'), { statusCode: 400 });
  }

  const orderRef = firebaseAdmin.firestore().collection('paymentOrders').doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw Object.assign(new Error(`Payment order ${orderId} not found`), { statusCode: 404 });
  }

  const orderData = orderSnap.data();
  const amountMatches = Number(payment.amount) === Number(orderData.amountPaise);

  if (!amountMatches || payment.status !== 'captured') {
    throw Object.assign(new Error('Webhook payment is not a captured matching order'), { statusCode: 400 });
  }

  const verifiedAt = new Date().toISOString();
  const userRef = firebaseAdmin.firestore().collection('users').doc(orderData.userId);
  const paymentRef = firebaseAdmin.firestore().collection('payments').doc(paymentId);

  const batch = firebaseAdmin.firestore().batch();
  batch.update(userRef, {
    isPaid: true,
    hasPaid: true,
    paymentStatus: 'success',
    paymentVerifiedAt: verifiedAt,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
  });

  batch.set(paymentRef, {
    userId: orderData.userId,
    createdByEmitraId: orderData.createdByEmitraId || null,
    createdByEmitraName: orderData.createdByEmitraName || null,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    amount: orderData.amount,
    amountPaise: orderData.amountPaise,
    currency: orderData.currency || payment.currency || 'INR',
    status: 'success',
    verifiedBy,
    timestamp: verifiedAt,
  }, { merge: true });

  batch.update(orderRef, {
    status: 'success',
    razorpayPaymentId: paymentId,
    verifiedAt,
    verifiedBy,
  });

  await batch.commit();

  return {
    userId: orderData.userId,
    paymentId,
    orderId,
  };
}

function getRawBody(event) {
  const body = event.body || '';
  return event.isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;
}

async function recordWebhookEvent(firebaseAdmin, payload, status, details = {}) {
  await firebaseAdmin.firestore().collection('paymentWebhookEvents').add({
    event: payload?.event || 'unknown',
    paymentId: payload?.payload?.payment?.entity?.id || null,
    orderId: payload?.payload?.payment?.entity?.order_id || null,
    status,
    details,
    receivedAt: new Date().toISOString(),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const rawBody = getRawBody(event);
    const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'] || '';
    const firebaseAdmin = getAdminApp();
    const { keyId, keySecret, webhookSecret } = await getRazorpayConfig();

    if (!webhookSecret) {
      return json(500, { error: 'Razorpay webhook secret is not configured' });
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return json(400, { error: 'Invalid Razorpay webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload?.event;

    if (!['payment.captured', 'payment.authorized', 'order.paid'].includes(eventName)) {
      await recordWebhookEvent(firebaseAdmin, payload, 'ignored');
      return json(200, { status: 'ignored', event: eventName });
    }

    let payment = payload?.payload?.payment?.entity;
    let result = null;

    if (eventName === 'order.paid') {
      const order = payload?.payload?.order?.entity;
      const orderSnap = await firebaseAdmin.firestore().collection('paymentOrders').doc(order.id).get();

      if (!orderSnap.exists) {
        throw Object.assign(new Error(`Payment order ${order.id} not found`), { statusCode: 404 });
      }

      const orderData = orderSnap.data();
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      payment = await getSuccessfulPaymentForOrder(razorpay, orderData);

      if (!payment) {
        throw Object.assign(new Error(`No successful payment found for order ${order.id}`), { statusCode: 404 });
      }

      await markPaymentSuccess(firebaseAdmin, orderData, payment, 'razorpay_webhook');
      result = {
        userId: orderData.userId,
        paymentId: payment.id,
        orderId: order.id,
      };
    }

    if (!result && eventName === 'payment.authorized') {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const orderSnap = await firebaseAdmin.firestore().collection('paymentOrders').doc(payment.order_id).get();

      if (!orderSnap.exists) {
        throw Object.assign(new Error(`Payment order ${payment.order_id} not found`), { statusCode: 404 });
      }

      const orderData = orderSnap.data();
      payment = await razorpay.payments.capture(payment.id, Number(orderData.amountPaise), orderData.currency || 'INR');
    }

    if (!result) {
      result = await markWebhookPaymentSuccess(firebaseAdmin, payment, 'razorpay_webhook');
    }
    let emailResult = null;
    try {
      emailResult = await sendPaymentSuccessEmail(firebaseAdmin, result.userId, result.paymentId);
    } catch (emailError) {
      console.error('Webhook payment success email failed:', emailError);
    }

    await recordWebhookEvent(firebaseAdmin, payload, 'success', result);

    return json(200, {
      status: 'success',
      ...result,
      email: emailResult,
    });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return json(error?.statusCode || 500, {
      status: 'error',
      message: error?.message || 'Unable to process Razorpay webhook',
    });
  }
};
