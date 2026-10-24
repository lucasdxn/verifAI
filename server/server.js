/*
 * verifAI local server
 * - Serves the website on http://localhost:4173 (localhost only)
 * - Stores each user's AI provider API keys encrypted on disk (AES-256-GCM)
 * - Tests keys against the provider and runs assistant requests through the "AI gate"
 *
 * No dependencies. Needs Node.js 18 or newer (for built-in fetch).
 * API keys are never sent back to the browser and never written to logs.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 4173;
const HOST = '127.0.0.1';
const SITE_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'keys.json');
const MASTER_FILE = path.join(DATA_DIR, 'master.key');
const USERS = ['alex', 'maria'];
const MAX_BODY = 64 * 1024;

// ---------------------------------------------------------------- providers
const PROVIDERS = {
  anthropic: {
    name: 'Anthropic (Claude)',
    keyRequired: true,
    async listModels(key) {
      const r = await call('https://api.anthropic.com/v1/models?limit=100', {
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
      });
      return (r.data || []).map((m) => m.id);
    },
    async chat(key, model, system, user) {
      const r = await call('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: { model, max_tokens: 800, system, messages: [{ role: 'user', content: user }] }
      });
      return (r.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    }
  },
  openai: {
    name: 'OpenAI',
    keyRequired: true,
    listModels: (key) => openAICompatList('https://api.openai.com/v1', key),
    chat: (key, model, system, user) => openAICompatChat('https://api.openai.com/v1', key, model, system, user)
  },
  google: {
    name: 'Google (Gemini)',
    keyRequired: true,
    async listModels(key) {
      const r = await call('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
        headers: { 'x-goog-api-key': key }
      });
      return (r.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''));
    },
    async chat(key, model, system, user) {
      const r = await call('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }] }
      });
      const parts = (((r.candidates || [])[0] || {}).content || {}).parts || [];
      return parts.map((p) => p.text || '').join('');
    }
  },
  mistral: {
    name: 'Mistral',
    keyRequired: true,
    listModels: (key) => openAICompatList('https://api.mistral.ai/v1', key),
    chat: (key, model, system, user) => openAICompatChat('https://api.mistral.ai/v1', key, model, system, user)
  },
  custom: {
    name: 'Custom (OpenAI-compatible)',
    keyRequired: false, // local servers such as Ollama often need no key
    needsBaseUrl: true,
    listModels: (key, baseUrl) => openAICompatList(baseUrl, key),
    chat: (key, model, system, user, baseUrl) => openAICompatChat(baseUrl, key, model, system, user)
  }
};

async function openAICompatList(base, key) {
  const r = await call(base.replace(/\/+$/, '') + '/models', { headers: key ? { authorization: 'Bearer ' + key } : {} });
  return (r.data || []).map((m) => m.id);
}
async function openAICompatChat(base, key, model, system, user) {
  const headers = { 'content-type': 'application/json' };
  if (key) headers.authorization = 'Bearer ' + key;
  const r = await call(base.replace(/\/+$/, '') + '/chat/completions', {
    method: 'POST',
    headers,
    body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
  });
  return ((((r.choices || [])[0] || {}).message) || {}).content || '';
}

async function call(url, opts) {
  let res;
  try {
    res = await fetch(url, {
      method: opts.method || 'GET',
      headers: opts.headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(30000)
    });
  } catch (e) {
    throw new ProviderError('Could not reach the provider (' + (e.name === 'TimeoutError' ? 'timed out' : 'network error') + ').');
  }
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { /* not JSON */ }
  if (!res.ok) {
    const msg = (data.error && (data.error.message || data.error.type)) || data.message || ('HTTP ' + res.status);
    throw new ProviderError('Provider said: ' + String(msg).slice(0, 300) + ' (HTTP ' + res.status + ')');
  }
  return data;
}
class ProviderError extends Error {}

// ---------------------------------------------------------------- encrypted store
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}
function masterKey() {
  if (process.env.VERIFAI_SECRET) {
    return crypto.createHash('sha256').update(process.env.VERIFAI_SECRET).digest();
  }
  ensureDataDir();
  if (!fs.existsSync(MASTER_FILE)) {
    fs.writeFileSync(MASTER_FILE, crypto.randomBytes(32).toString('base64'), { mode: 0o600 });
  }
  return Buffer.from(fs.readFileSync(MASTER_FILE, 'utf8').trim(), 'base64');
}
const MASTER = masterKey();

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', MASTER, iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64') };
}
function decrypt(box) {
  const d = crypto.createDecipheriv('aes-256-gcm', MASTER, Buffer.from(box.iv, 'base64'));
  d.setAuthTag(Buffer.from(box.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(box.data, 'base64')), d.final()]).toString('utf8');
}

function loadStore() {
  try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); } catch (e) { return { users: {} }; }
}
function saveStore(store) {
  ensureDataDir();
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, STORE_FILE);
}
function userRecord(store, user) {
  store.users[user] = store.users[user] || { defaultProvider: null, keys: {} };
  return store.users[user];
}
function publicView(rec) {
  return {
    defaultProvider: rec.defaultProvider,
    keys: Object.keys(rec.keys).map((p) => {
      const k = rec.keys[p];
      return { provider: p, name: PROVIDERS[p].name, last4: k.last4, model: k.model || '', baseUrl: k.baseUrl || '', addedAt: k.addedAt, lastTest: k.lastTest || null, models: k.models || [] };
    })
  };
}
function getKey(rec, provider) {
  const k = rec.keys[provider];
  if (!k) return null;
  return { key: k.box ? decrypt(k.box) : '', model: k.model, baseUrl: k.baseUrl };
}

// ---------------------------------------------------------------- AI gate
function gatePrompt(mode, ctx) {
  const verified = (ctx.verified || []).slice(0, 80).map((v) => '- ' + v).join('\n') || '- (none yet)';
  const rules = [
    'You are the assistant inside verifAI, a learning platform for responsible AI use at work.',
    'The learner has proven (verified) ONLY these concepts:',
    verified,
    '',
    'Hard rules:',
    '1. Only write code that uses verified concepts. Never write code that relies on an unverified concept.',
    '2. When something needs an unverified concept, explain the idea in plain words, give a tiny general example that is NOT their code, and ask a guiding question so they can write it themselves.',
    '3. If the request leaves details open (inputs, edge cases, error behaviour, limits), ask a short clarifying question before acting.',
    '4. Keep answers under 150 words. Be warm and direct.'
  ];
  if (mode === 'review') {
    rules.push('', 'You are REVIEWING a learner\'s code for one step of a guided task.',
      'Task: ' + String(ctx.task || '').slice(0, 200),
      'Step: ' + String(ctx.step || '').slice(0, 200),
      'Concept being practised: ' + String(ctx.teaching || '').slice(0, 100),
      'Start your reply with exactly "PASS" if the code correctly applies that concept for this step, otherwise "NOT YET".',
      'Then give at most 3 short sentences pointing at specific lines. Never rewrite their code.');
  }
  if (mode === 'chat') {
    rules.push('', 'You are the learner\'s everyday coding assistant.',
      'Only answer questions about the verified concepts above. If a good answer would need anything else, say which concept is missing and suggest learning it first in verifAI, instead of answering.',
      'If the learner asks you to write, fix or change their code, put the COMPLETE updated file in ONE code block that starts with ```proposal and explain the change in one or two sentences outside it.',
      'You never apply changes yourself: the learner reviews every proposal line by line and must confirm it. Use only verified concepts in proposed code.');
  }
  if (mode === 'tutor') {
    rules.push('', 'You are in TEACHING MODE for a guided task.',
      'Task: ' + String(ctx.task || '').slice(0, 200),
      'Current step: ' + String(ctx.step || '').slice(0, 200),
      'Concept being taught: ' + String(ctx.teaching || '').slice(0, 100) + ' (NOT verified: never write this part for them).',
      'Review their code by pointing at specific lines and asking questions; do not rewrite it.');
  }
  return rules.join('\n');
}

// ---------------------------------------------------------------- http helpers
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin GETs and curl
  try { return new URL(origin).host === req.headers.host; } catch (e) { return false; }
}
function pickUser(q, body) {
  const u = (body && body.user) || q.get('user') || 'alex';
  if (!USERS.includes(u)) throw new Error('Unknown user');
  return u;
}
function validKey(k) { return typeof k === 'string' && k.length >= 8 && k.length <= 500 && !/\s/.test(k); }
function validUrl(u) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch (e) { return false; }
}
function scrub(msg, secret) { return secret ? String(msg).split(secret).join('[key]') : String(msg); }

// ---------------------------------------------------------------- API
async function api(req, res, url) {
  if (req.method !== 'GET' && !sameOrigin(req)) return send(res, 403, { error: 'Cross-origin request blocked' });
  if (req.method !== 'GET' && req.method !== 'DELETE' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Use JSON' });

  const q = url.searchParams;
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'keys', ':provider', 'test']
  const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req);
  const user = pickUser(q, body);
  const store = loadStore();
  const rec = userRecord(store, user);

  if (parts[1] === 'health') return send(res, 200, { ok: true });

  if (parts[1] === 'providers' && req.method === 'GET') {
    return send(res, 200, { providers: Object.keys(PROVIDERS).map((id) => ({ id, name: PROVIDERS[id].name, keyRequired: PROVIDERS[id].keyRequired, needsBaseUrl: !!PROVIDERS[id].needsBaseUrl })) });
  }

  if (parts[1] === 'keys') {
    const provider = parts[2];
    if (!provider && req.method === 'GET') return send(res, 200, publicView(rec));
    if (!PROVIDERS[provider]) return send(res, 404, { error: 'Unknown provider' });
    const P = PROVIDERS[provider];

    if (parts[3] === 'test' && req.method === 'POST') {
      const k = getKey(rec, provider);
      if (!k) return send(res, 404, { error: 'No key saved for this provider' });
      try {
        const models = (await P.listModels(k.key, k.baseUrl)).sort();
        rec.keys[provider].lastTest = { ok: true, at: new Date().toISOString(), msg: 'Connected · ' + models.length + ' models available' };
        rec.keys[provider].models = models.slice(0, 300);
        if (!rec.keys[provider].model && models.length) rec.keys[provider].model = models[0];
      } catch (e) {
        rec.keys[provider].lastTest = { ok: false, at: new Date().toISOString(), msg: scrub(e instanceof ProviderError ? e.message : 'Test failed', k.key) };
      }
      saveStore(store);
      return send(res, 200, publicView(rec));
    }

    if (req.method === 'PUT') {
      const existing = rec.keys[provider];
      const next = Object.assign({}, existing || {});
      if (body.apiKey != null && body.apiKey !== '') {
        if (!validKey(body.apiKey)) return send(res, 400, { error: 'That doesn’t look like an API key (no spaces, 8+ characters).' });
        next.box = encrypt(body.apiKey);
        next.last4 = body.apiKey.slice(-4);
        next.addedAt = new Date().toISOString();
        next.lastTest = null; next.models = [];
      } else if (!existing && P.keyRequired) {
        return send(res, 400, { error: 'Enter an API key.' });
      }
      if (P.needsBaseUrl) {
        const b = body.baseUrl != null ? String(body.baseUrl).trim() : next.baseUrl;
        if (!validUrl(b)) return send(res, 400, { error: 'Enter a valid base URL, e.g. http://localhost:11434/v1' });
        next.baseUrl = b;
        if (!next.box) { next.last4 = ''; next.addedAt = next.addedAt || new Date().toISOString(); }
      }
      if (body.model != null) next.model = String(body.model).slice(0, 200);
      rec.keys[provider] = next;
      if (!rec.defaultProvider) rec.defaultProvider = provider;
      saveStore(store);
      return send(res, 200, publicView(rec));
    }

    if (req.method === 'DELETE') {
      delete rec.keys[provider];
      if (rec.defaultProvider === provider) rec.defaultProvider = Object.keys(rec.keys)[0] || null;
      saveStore(store);
      return send(res, 200, publicView(rec));
    }
  }

  if (parts[1] === 'default' && req.method === 'PUT') {
    if (!rec.keys[body.provider]) return send(res, 400, { error: 'Add a key for that provider first' });
    rec.defaultProvider = body.provider;
    saveStore(store);
    return send(res, 200, publicView(rec));
  }

  // Which provider, key and model a request uses: the one picked in the request, else the user's default.
  function pickModel() {
    const provider = body.provider || rec.defaultProvider;
    if (!provider || !rec.keys[provider]) { send(res, 400, { error: 'No AI provider set up yet. Add an API key in Settings.' }); return null; }
    const k = getKey(rec, provider);
    if (body.model) k.model = String(body.model).slice(0, 200);
    if (!k.model) { send(res, 400, { error: 'Pick a model for ' + PROVIDERS[provider].name + ' in Settings (press "Test connection" first).' }); return null; }
    return { provider, k, P: PROVIDERS[provider] };
  }
  function parseJSON(text) {
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a === -1 || b <= a) return null;
    try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { return null; }
  }
  // The catalog comes from the learner's tree (the demo has no server-side skill ledger).
  function readCatalog() {
    return (Array.isArray(body.catalog) ? body.catalog : []).slice(0, 200).map((c) => ({
      id: String(c.id || '').slice(0, 40), name: String(c.name || '').slice(0, 80), lang: String(c.lang || '').slice(0, 20), verified: !!c.verified
    })).filter((c) => /^[a-z]+-[a-z]+$/.test(c.id));
  }

  // Assistant chat: step 1 asks the model which concepts the question needs; step 2 answers only if all are verified.
  if (parts[1] === 'chat' && req.method === 'POST') {
    const m = pickModel(); if (!m) return;
    const message = String(body.message || '').slice(0, 4000);
    if (!message) return send(res, 400, { error: 'Empty message' });
    const cat = readCatalog();
    const byId = Object.fromEntries(cat.map((c) => [c.id, c]));
    try {
      const classify = 'You classify programming questions for a learning platform. Concept catalog (id: language / name):\n' +
        cat.map((c) => c.id + ': ' + c.lang + ' / ' + c.name).join('\n') +
        '\n\nReply with ONLY JSON: {"concepts": [ids from the catalog that a good answer to the question needs], "offTopic": true if the question is not about programming in these languages}';
      const raw = await m.P.chat(m.k.key, m.k.model, classify, 'Question: ' + message, m.k.baseUrl);
      const j = parseJSON(raw) || { concepts: [], offTopic: false };
      const fromModel = (Array.isArray(j.concepts) ? j.concepts : []).filter((id) => byId[id]);
      const fromClient = (Array.isArray(body.detected) ? body.detected : []).filter((id) => byId[id]);
      const all = [...new Set(fromModel.concat(fromClient))];
      const needed = all.filter((id) => !byId[id].verified);
      if (needed.length) return send(res, 200, { blocked: true, needed, concepts: all });
      if (j.offTopic === true || !all.length) return send(res, 200, { blocked: true, offTopic: true, needed: [], concepts: [] });

      const verified = cat.filter((c) => c.verified).map((c) => c.lang + ': ' + c.name);
      const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
        .map((h) => (h.role === 'me' ? 'Learner: ' : 'Assistant: ') + String(h.text || '').slice(0, 1500)).join('\n');
      const system = gatePrompt('chat', { verified });
      const ws = body.workspace && typeof body.workspace.code === 'string'
        ? '\n\nThe learner\'s current file (' + String(body.workspace.lang || '').slice(0, 20) + '):\n```\n' + body.workspace.code.slice(0, 8000) + '\n```' : '';
      const reply = await m.P.chat(m.k.key, m.k.model, system, (history ? 'Conversation so far:\n' + history + '\n\n' : '') + 'Learner: ' + message + ws, m.k.baseUrl);
      return send(res, 200, { reply: reply || '(empty reply)', concepts: all, provider: m.P.name, model: m.k.model });
    } catch (e) {
      return send(res, 502, { error: scrub(e instanceof ProviderError ? e.message : 'The assistant request failed.', m.k.key) });
    }
  }

  // Plan a guided task from the learner's own description.
  if (parts[1] === 'plan' && req.method === 'POST') {
    const m = pickModel(); if (!m) return;
    const description = String(body.description || '').slice(0, 1500);
    const lane = String(body.lang || '').slice(0, 20);
    const cat = readCatalog().filter((c) => c.lang === lane);
    if (!description || !cat.length) return send(res, 400, { error: 'Describe the task and pick a language.' });
    const open = cat.filter((c) => !c.verified);
    const prompt = 'You plan a guided learning task on a platform where learners write the code themselves and the AI only teaches.\n' +
      'Language: ' + lane + '\nConcepts the learner has verified: ' + (cat.filter((c) => c.verified).map((c) => c.name).join(', ') || 'none') +
      '\nConcepts they have NOT verified (id: name):\n' + open.map((c) => c.id + ': ' + c.name).join('\n') +
      '\n\nReply with ONLY JSON:\n{"title": "short task title, max 60 characters", "brief": "one sentence restating the task", ' +
      '"teaches": [1 to 3 ids of NOT verified concepts the task really needs], ' +
      '"steps": [3 to 5 steps, each {"title": "...", "teach": "an id from teaches, or null for a planning step", "intro": "2 sentences explaining the idea in plain words", ' +
      '"example": "a tiny general code example of the idea, NOT the solution", "question": "one clarifying question about the task", "options": ["short answer", "short answer"]}]}';
    try {
      const raw = await m.P.chat(m.k.key, m.k.model, prompt, 'Task: ' + description, m.k.baseUrl);
      const j = parseJSON(raw);
      if (!j || !Array.isArray(j.steps)) return send(res, 502, { error: 'The model didn’t return a usable plan. Try again or pick the concepts yourself.' });
      const openIds = new Set(open.map((c) => c.id));
      const teaches = (Array.isArray(j.teaches) ? j.teaches : []).filter((id) => openIds.has(id)).slice(0, 3);
      const clip = (v, n) => String(v == null ? '' : v).slice(0, n);
      const steps = j.steps.slice(0, 5).map((s) => ({
        title: clip(s.title, 80) || 'Step',
        teach: teaches.includes(s.teach) ? s.teach : null,
        intro: clip(s.intro, 400), example: clip(s.example, 400),
        question: clip(s.question, 200), options: (Array.isArray(s.options) ? s.options : []).slice(0, 2).map((o) => clip(o, 60))
      }));
      return send(res, 200, { title: clip(j.title, 60) || 'My task', brief: clip(j.brief, 300) || description.slice(0, 300), teaches, steps });
    } catch (e) {
      return send(res, 502, { error: scrub(e instanceof ProviderError ? e.message : 'Planning failed.', m.k.key) });
    }
  }

  if (parts[1] === 'assistant' && req.method === 'POST') {
    const m = pickModel(); if (!m) return;
    const provider = m.provider, k = m.k;
    const message = String(body.message || '').slice(0, 4000);
    if (!message) return send(res, 400, { error: 'Empty message' });
    const ctx = body.context || {};
    const system = gatePrompt(body.mode === 'tutor' ? 'tutor' : body.mode === 'review' ? 'review' : 'assistant', ctx);
    const userText = message + (ctx.code ? '\n\nTheir current code:\n```\n' + String(ctx.code).slice(0, 8000) + '\n```' : '');
    try {
      const reply = await PROVIDERS[provider].chat(k.key, k.model, system, userText, k.baseUrl);
      return send(res, 200, { reply: reply || '(empty reply)', provider: PROVIDERS[provider].name, model: k.model });
    } catch (e) {
      return send(res, 502, { error: scrub(e instanceof ProviderError ? e.message : 'The assistant request failed.', k.key) });
    }
  }

  return send(res, 404, { error: 'Not found' });
}

// ---------------------------------------------------------------- static files
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  // Only the site's pages and assets are public; never the server folder or stored keys.
  if (!/^\/[\w-]+\.html$/.test(p) && !/^\/assets\/[\w./-]+$/.test(p)) { res.writeHead(404); return res.end('Not found'); }
  const file = path.resolve(SITE_ROOT, '.' + p);
  if (!file.startsWith(SITE_ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    res.end(data);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    return send(res, 400, { error: e.message || 'Bad request' });
  }
}).listen(PORT, HOST, () => {
  console.log('verifAI is running at http://localhost:' + PORT);
  console.log('Keys are stored encrypted in ' + path.relative(process.cwd(), STORE_FILE) + (process.env.VERIFAI_SECRET ? ' (master key from VERIFAI_SECRET)' : ' (master key in server/data/master.key)'));
});
