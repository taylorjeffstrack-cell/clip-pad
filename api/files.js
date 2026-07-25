const { requireAuth } = require('../lib/requireAuth');
const { saveUser } = require('../lib/db');
const { put, del } = require('@vercel/blob');
const crypto = require('crypto');

// Vercel Serverless Functions cap request bodies at ~4.5MB. Since the client
// sends the file base64-encoded (about 33% larger than the raw bytes) plus
// JSON overhead, keep a safety margin below that hard limit.
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

module.exports = async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    const { id, name, mimeType, dataBase64 } = req.body || {};
    if (!name || !dataBase64) {
      return res.status(400).json({ error: 'name and dataBase64 are required' });
    }

    let buffer;
    try {
      buffer = Buffer.from(dataBase64, 'base64');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    if (buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(413).json({
        error: 'That file is too large to save (please keep clips under about 3MB).'
      });
    }

    const fileId = id || crypto.randomBytes(8).toString('hex');
    const pathname = `users/${user.username.toLowerCase()}/${fileId}-${name}`;

    let blob;
    try {
      blob = await put(pathname, buffer, {
        access: 'public',
        contentType: mimeType || 'application/octet-stream'
      });
    } catch (e) {
      return res.status(500).json({ error: 'Upload failed: ' + e.message });
    }

    const fileEntry = { id: fileId, name, url: blob.url, pathname: blob.pathname, size: buffer.length };
    user.files = user.files || [];
    user.files.push(fileEntry);
    user.updatedAt = Date.now();
    await saveUser(user);

    return res.status(200).json({ id: fileId, name, url: blob.url, size: buffer.length });
  }

  if (req.method === 'DELETE') {
    const { fileId } = req.body || {};
    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    const files = user.files || [];
    const idx = files.findIndex((f) => f.id === fileId);
    if (idx === -1) return res.status(404).json({ error: 'File not found' });

    const [removed] = files.splice(idx, 1);
    try {
      await del(removed.url);
    } catch (e) {
      // best effort — continue even if the blob delete itself fails
    }

    const pads = (user.pads || []).map((p) =>
      p.fileId === fileId ? { ...p, fileId: null, start: 0, end: 0 } : p
    );

    user.files = files;
    user.pads = pads;
    user.updatedAt = Date.now();
    await saveUser(user);

    return res.status(200).json({ ok: true, pads });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
