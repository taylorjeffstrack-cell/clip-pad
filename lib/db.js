const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

const redis = Redis.fromEnv();

function userKey(username) {
  return 'user:' + username.toLowerCase();
}
function sessionKey(token) {
  return 'session:' + token;
}

async function getUser(username) {
  if (!username) return null;
  return redis.get(userKey(username));
}

async function saveUser(user) {
  await redis.set(userKey(user.username), user);
}

async function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 day session
  await redis.set(sessionKey(token), username, { ex: 60 * 60 * 24 * 30 });
  return token;
}

async function getSessionUsername(token) {
  if (!token) return null;
  return redis.get(sessionKey(token));
}

async function deleteSession(token) {
  if (!token) return;
  await redis.del(sessionKey(token));
}

module.exports = { redis, getUser, saveUser, createSession, getSessionUsername, deleteSession };
