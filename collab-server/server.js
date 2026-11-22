'use strict';
/**
 * まいつーる「リアルタイム共有メモ」コラボサーバ
 * - REST: /collab-api/rooms ...
 * - WebSocket: /collab-ws/:id （Yjs sync + awareness、y-protocols 自前実装）
 * - 永続化: 部屋メタは JSON ファイル、Yjsドキュメントは y-leveldb
 * - 帰属モデル: アカウント無し。ID=編集権限、readToken=閲覧、manageToken=管理（サーバはハッシュのみ保持）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const map = require('lib0/map');
const { LeveldbPersistence } = require('y-leveldb');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ROOMS_DIR = path.join(DATA_DIR, 'rooms');
const INACTIVE_DELETE_MS = 180 * 24 * 60 * 60 * 1000; // 180日
const MAX_CONN_PER_ROOM = 20;
const MAX_TEXT_LENGTH = 200000;

fs.mkdirSync(ROOMS_DIR, { recursive: true });
const persistence = new LeveldbPersistence(path.join(DATA_DIR, 'ydocs'));

const RETENTION_MS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  'forever': null,
};

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');
const newId = () => crypto.randomBytes(8).toString('hex');
const validId = (id) => /^[a-f0-9]{16}$/.test(id || '');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}
function verifyPassword(password, stored) {
  try {
    const [saltHex, hashHex] = stored.split(':');
    const hash = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    return crypto.timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
  } catch { return false; }
}

// ---------------- 部屋メタ ----------------
const metaCache = new Map();
function metaPath(id) { return path.join(ROOMS_DIR, id + '.json'); }
function loadMeta(id) {
  if (!validId(id)) return null;
  if (metaCache.has(id)) return metaCache.get(id);
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath(id), 'utf8'));
    metaCache.set(id, meta);
    return meta;
  } catch { return null; }
}
function saveMeta(meta) {
  metaCache.set(meta.id, meta);
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta), { mode: 0o600 });
}
function isExpired(meta) {
  if (meta.expiresAt && Date.parse(meta.expiresAt) < Date.now()) return true;
  if (meta.lastAccessAt && Date.parse(meta.lastAccessAt) < Date.now() - INACTIVE_DELETE_MS) return true;
  return false;
}
function touchAccess(meta) {
  const now = Date.now();
  if (!meta.lastAccessAt || now - Date.parse(meta.lastAccessAt) > 60 * 60 * 1000) {
    meta.lastAccessAt = new Date(now).toISOString();
    saveMeta(meta);
  }
}
async function deleteRoom(id) {
  metaCache.delete(id);
  try { fs.unlinkSync(metaPath(id)); } catch {}
  const entry = docs.get(id);
  if (entry) {
    for (const conn of entry.conns) { try { conn.close(4404); } catch {} }
    entry.doc.destroy();
    docs.delete(id);
  }
  try { await persistence.clearDocument(id); } catch {}
}

// ---------------- Yjs ドキュメント管理 ----------------
const docs = new Map(); // id -> { doc, awareness, conns:Set }
const messageSync = 0;
const messageAwareness = 1;

async function getOrCreateDoc(id) {
  let entry = docs.get(id);
  if (entry) return entry;
  const doc = new Y.Doc();
  doc.gc = true;
  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);
  entry = { doc, awareness, conns: new Set() };
  docs.set(id, entry);
  const persisted = await persistence.getYDoc(id);
  const state = Y.encodeStateAsUpdate(persisted);
  if (state.length > 2) Y.applyUpdate(doc, state);
  doc.on('update', (update, origin) => {
    persistence.storeUpdate(id, update);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const msg = encoding.toUint8Array(encoder);
    entry.conns.forEach((conn) => { if (conn !== origin) send(conn, msg); });
  });
  awareness.on('update', ({ added, updated, removed }, origin) => {
    const changed = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changed));
    const msg = encoding.toUint8Array(encoder);
    entry.conns.forEach((conn) => { if (conn !== origin) send(conn, msg); });
  });
  return entry;
}
function send(conn, msg) {
  if (conn.readyState !== 1) return; // OPEN
  try { conn.send(msg, (err) => { if (err) closeConn(conn); }); } catch { closeConn(conn); }
}
function closeConn(conn) {
  const entry = conn._entry;
  if (entry) {
    entry.conns.delete(conn);
    if (conn._controlledIds && conn._controlledIds.size) {
      awarenessProtocol.removeAwarenessStates(entry.awareness, Array.from(conn._controlledIds), null);
    }
    // 誰もいなくなったらドキュメントをフラッシュして解放（次回は永続化から復元）
    if (entry.conns.size === 0) {
      const id = conn._roomId;
      setTimeout(async () => {
        const e = docs.get(id);
        if (e && e.conns.size === 0) {
          try { await persistence.flushDocument(id); } catch {}
          e.doc.destroy();
          docs.delete(id);
        }
      }, 1000);
    }
  }
  try { conn.close(); } catch {}
}

async function handleWsMessage(conn, entry, msg) {
  try {
    const decoder = decoding.createDecoder(msg);
    const messageType = decoding.readVarUint(decoder);
    if (messageType === messageSync) {
      // 読取専用接続からの update は適用しない（種別を覗いて判定）
      const peek = decoding.createDecoder(msg);
      decoding.readVarUint(peek);
      const syncType = decoding.readVarUint(peek);
      if (conn._readOnly && syncType === syncProtocol.messageYjsUpdate) return;
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, entry.doc, conn);
      if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
        const text = entry.doc.getText('content').toString();
        if (text.length > MAX_TEXT_LENGTH && !conn._readOnly) {
          // 上限超過は接続を閉じる（簡易ガード）
        }
      }
      if (encoding.length(encoder) > 1) send(conn, encoding.toUint8Array(encoder));
    } else if (messageType === messageAwareness) {
      const update = decoding.readVarUint8Array(decoder);
      // controlled clientIDs を記録（切断時クリーンアップ用）
      const dec = decoding.createDecoder(update);
      const len = decoding.readVarUint(dec);
      for (let i = 0; i < len; i++) {
        const clientId = decoding.readVarUint(dec);
        decoding.readVarUint(dec); // clock
        decoding.readVarString(dec); // state json
        conn._controlledIds.add(clientId);
      }
      awarenessProtocol.applyAwarenessUpdate(entry.awareness, update, conn);
    }
  } catch (e) {
    console.error('ws message error', e);
  }
}

// ---------------- 認証トークン（パスワード参加用） ----------------
const joinTokens = new Map(); // token -> { roomId, expires }
function issueJoinToken(roomId) {
  const token = newToken();
  joinTokens.set(token, { roomId, expires: Date.now() + 12 * 60 * 60 * 1000 });
  return token;
}
function validJoinToken(token, roomId) {
  const rec = token && joinTokens.get(token);
  return !!rec && rec.roomId === roomId && rec.expires > Date.now();
}

// ---------------- HTTP ----------------
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 1024 * 1024) reject(new Error('too large')); else chunks.push(c); });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    if (p === '/healthz') return json(res, 200, { ok: true });

    if (req.method === 'POST' && p === '/collab-api/rooms') {
      const body = await readBody(req);
      const retention = RETENTION_MS.hasOwnProperty(body.retention) ? body.retention : '7d';
      const id = newId();
      const manageToken = newToken();
      const readToken = newToken();
      const now = Date.now();
      const span = RETENTION_MS[retention];
      const meta = {
        id, retention,
        createdAt: new Date(now).toISOString(),
        lastAccessAt: new Date(now).toISOString(),
        expiresAt: span ? new Date(now + span).toISOString() : null,
        manageHash: sha256(manageToken),
        readHash: sha256(readToken),
        passHash: body.password ? hashPassword(String(body.password)) : null,
      };
      saveMeta(meta);
      return json(res, 201, { id, manageToken, readToken, retention, expiresAt: meta.expiresAt });
    }

    const m = p.match(/^\/collab-api\/rooms\/([a-f0-9]{16})(?:\/(join|meta))?$/);
    if (m) {
      const id = m[1];
      const meta = loadMeta(id);
      if (!meta || isExpired(meta)) {
        if (meta && isExpired(meta)) deleteRoom(id);
        return json(res, 404, { error: 'not_found' });
      }
      if (req.method === 'GET' && (!m[2] || m[2] === 'meta')) {
        touchAccess(meta);
        return json(res, 200, {
          exists: true, hasPassword: !!meta.passHash, retention: meta.retention,
          expiresAt: meta.expiresAt, createdAt: meta.createdAt, lastAccessAt: meta.lastAccessAt,
        });
      }
      if (req.method === 'POST' && m[2] === 'join') {
        const body = await readBody(req);
        if (!meta.passHash) return json(res, 200, { joinToken: null });
        if (body.password && verifyPassword(String(body.password), meta.passHash)) {
          return json(res, 200, { joinToken: issueJoinToken(id) });
        }
        return json(res, 401, { error: 'wrong_password' });
      }
      const manageOk = req.headers['x-manage-token'] && sha256(req.headers['x-manage-token']) === meta.manageHash;
      if (req.method === 'DELETE' && !m[2]) {
        if (!manageOk) return json(res, 403, { error: 'forbidden' });
        await deleteRoom(id);
        return json(res, 200, { status: 'deleted' });
      }
      if (req.method === 'PATCH' && !m[2]) {
        if (!manageOk) return json(res, 403, { error: 'forbidden' });
        const body = await readBody(req);
        if (RETENTION_MS.hasOwnProperty(body.retention)) {
          meta.retention = body.retention;
          const span = RETENTION_MS[body.retention];
          meta.expiresAt = span ? new Date(Date.now() + span).toISOString() : null;
          saveMeta(meta);
        }
        return json(res, 200, { retention: meta.retention, expiresAt: meta.expiresAt });
      }
    }
    return json(res, 404, { error: 'not_found' });
  } catch (e) {
    return json(res, 400, { error: 'bad_request' });
  }
});

// ---------------- WebSocket ----------------
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', async (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost');
  const m = url.pathname.match(/^\/collab-ws\/([a-f0-9]{16})$/);
  if (!m) { socket.destroy(); return; }
  const id = m[1];
  const meta = loadMeta(id);
  if (!meta || isExpired(meta)) { socket.write('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  const mode = url.searchParams.get('mode') || 'edit';
  const token = url.searchParams.get('token') || '';
  let readOnly = false;
  if (mode === 'read') {
    if (sha256(token) !== meta.readHash) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
    readOnly = true;
  } else if (mode === 'manage') {
    if (sha256(token) !== meta.manageHash) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
  } else if (mode !== 'edit') { socket.destroy(); return; }
  if (meta.passHash && !validJoinToken(url.searchParams.get('joinToken') || '', id)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return;
  }
  const entry = await getOrCreateDoc(id);
  if (entry.conns.size >= MAX_CONN_PER_ROOM) { socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n'); socket.destroy(); return; }
  touchAccess(meta);
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws._entry = entry;
    ws._roomId = id;
    ws._readOnly = readOnly;
    ws._controlledIds = new Set();
    entry.conns.add(ws);
    ws.on('message', (data) => handleWsMessage(ws, entry, new Uint8Array(data)));
    ws.on('close', () => closeConn(ws));
    ws.on('error', () => closeConn(ws));
    // 初期同期: SyncStep1 を送る + 現在の awareness を送る
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, entry.doc);
    send(ws, encoding.toUint8Array(encoder));
    const states = entry.awareness.getStates();
    if (states.size > 0) {
      const enc2 = encoding.createEncoder();
      encoding.writeVarUint(enc2, messageAwareness);
      encoding.writeVarUint8Array(enc2, awarenessProtocol.encodeAwarenessUpdate(entry.awareness, Array.from(states.keys())));
      send(ws, encoding.toUint8Array(enc2));
    }
  });
});

// ---------------- 掃除 ----------------
async function cleanup() {
  let files = [];
  try { files = fs.readdirSync(ROOMS_DIR).filter((f) => f.endsWith('.json')); } catch {}
  for (const f of files) {
    const id = f.replace(/\.json$/, '');
    const meta = loadMeta(id);
    if (meta && isExpired(meta)) await deleteRoom(id);
  }
  for (const [token, rec] of joinTokens) if (rec.expires < Date.now()) joinTokens.delete(token);
}
setInterval(() => cleanup().catch(() => {}), 60 * 60 * 1000);
cleanup().catch(() => {});

server.listen(PORT, () => console.log(`collab-server listening on ${PORT}`));
