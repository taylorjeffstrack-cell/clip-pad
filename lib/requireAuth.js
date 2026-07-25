const { getSessionUsername, getUser } = require('./db');

// Verifies the Bearer token on a request and returns the full user record,
// or sends a 401 response and returns null.
async function requireAuth(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  const username = token ? await getSessionUsername(token) : null;
  if (!username) {
    res.status(401).json({ error: 'Not logged in, or your session expired. Please log in again.' });
    return null;
  }

  const user = await getUser(username);
  if (!user) {
    res.status(401).json({ error: 'Account no longer exists.' });
    return null;
  }

  return user;
}

module.exports = { requireAuth };
