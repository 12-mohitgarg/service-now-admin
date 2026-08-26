const { json, requireDashboardOperator } = require('./utils/firebase-admin');
const { reconcilePayments } = require('./utils/payment-reconcile-core');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireDashboardOperator(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const result = await reconcilePayments({
      limit: 100,
      verifiedBy: authResult.decodedToken.uid,
    });

    return json(200, {
      status: 'success',
      ...result,
    });
  } catch (error) {
    console.error('Payment reconcile error:', error);
    return json(error?.statusCode || 500, {
      status: 'error',
      message: error?.message || error?.description || 'Unable to reconcile payments',
      details:
        error?.error?.description ||
        error?.error?.reason ||
        error?.description ||
        error?.message ||
        'Unknown reconcile error',
      code: error?.error?.code || error?.code || null,
    });
  }
};
