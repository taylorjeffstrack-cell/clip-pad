const { requireAuth } = require('../lib/requireAuth');
const { saveUser } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { pads } = req.body || {};
  if (!Array.isArray(pads)) {
    return res.status(400).json({ error: 'pads must be an array' });
  }

  user.pads = pads;
  user.updatedAt = Date.now();
  await saveUser(user);

  res.status(200).json({ ok: true });
};
