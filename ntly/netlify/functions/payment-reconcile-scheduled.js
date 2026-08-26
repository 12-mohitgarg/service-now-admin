const { reconcilePayments } = require('./utils/payment-reconcile-core');
const { getAdminApp } = require('./utils/firebase-admin');

async function writeRunStatus(data) {
  const firebaseAdmin = getAdminApp();
  await firebaseAdmin
    .firestore()
    .collection('systemStatus')
    .doc('paymentReconcileScheduled')
    .set(data, { merge: true });
}

exports.handler = async () => {
  const startedAt = new Date().toISOString();

  try {
    await writeRunStatus({
      status: 'running',
      lastStartedAt: startedAt,
    });

    const result = await reconcilePayments({
      limit: 25,
      verifiedBy: 'scheduled_reconcile',
    });

    console.log('Scheduled Razorpay reconcile complete:', result);

    await writeRunStatus({
      status: 'success',
      lastStartedAt: startedAt,
      lastFinishedAt: new Date().toISOString(),
      lastResult: result,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', ...result }),
    };
  } catch (error) {
    console.error('Scheduled Razorpay reconcile failed:', error);

    await writeRunStatus({
      status: 'error',
      lastStartedAt: startedAt,
      lastFinishedAt: new Date().toISOString(),
      lastError: error?.message || 'Scheduled reconcile failed',
    }).catch((statusError) => {
      console.error('Unable to write scheduled reconcile status:', statusError);
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error?.message || 'Scheduled reconcile failed',
      }),
    };
  }
};
