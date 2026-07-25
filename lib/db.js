const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Different versions of the Vercel/Upstash integration have named these
// differently over time (UPSTASH_REDIS_REST_* vs KV_REST_API_*). Check both
// rather than relying on Redis.fromEnv()'s auto-detection, which doesn't
// always catch every naming variant.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('Redis env vars not found. Checked UPSTASH_REDIS_REST_URL/TOKEN and KV_REST_API_URL/TOKEN.');
}

const redis = new Redis({ url: redisUrl, token: redisToken });

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
