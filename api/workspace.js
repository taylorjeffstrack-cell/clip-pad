const { requireAuth } = require('../lib/requireAuth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  res.status(200).json({
    pads: user.pads || [],
    files: (user.files || []).map((f) => ({ id: f.id, name: f.name, url: f.url, size: f.size }))
  });
};
