const admin = require('firebase-admin');

// Initialize Admin SDK with service account JSON stored in SERVICE_ACCOUNT_KEY env var
if (!admin.apps.length) {
  if (process.env.SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
      admin.initializeApp({ credential: admin.credential.cert(key) });
    } catch (err) {
      console.error('Failed to parse SERVICE_ACCOUNT_KEY:', err);
      admin.initializeApp();
    }
  } else {
    // No service account provided — admin may use default credentials in some envs
    admin.initializeApp();
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!idToken) return res.status(401).json({ error: 'No token provided' });

  try {
    await admin.auth().verifyIdToken(idToken);

    const { referrerId } = req.body || {};
    if (!referrerId) return res.status(400).json({ error: 'Missing referrerId' });

    const db = admin.firestore();
    const referrerRef = db.doc(`users/${referrerId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(referrerRef);
      if (snap.exists) {
        const current = snap.data().referrals || 0;
        tx.update(referrerRef, { referrals: current + 1, updated_at: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        tx.set(referrerRef, { referrals: 1, created_at: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Referral API error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
