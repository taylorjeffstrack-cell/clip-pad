const { getUser, saveUser, createSession } = require('../lib/db');
const { hashPassword } = require('../lib/password');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,40}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-40 characters: letters, numbers, - or _ only.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await getUser(username);
  if (existing) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    username,
    salt,
    hash,
    pads: [],
    files: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await saveUser(user);

  const token = await createSession(user.username);
  res.status(200).json({ token, username: user.username });
};
