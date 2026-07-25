const { getUser, createSession } = require('../lib/db');
const { verifyPassword } = require('../lib/password');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await getUser(username);
  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }

  const token = await createSession(user.username);
  res.status(200).json({ token, username: user.username });
};
