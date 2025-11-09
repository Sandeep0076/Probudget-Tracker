import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', 'probudget.sqlite');
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';
const GOOGLE_API_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
];
const ENC_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

tableInit();
seedDefaults();

function tableInit() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      date TEXT,
      type TEXT,
      category TEXT,
      quantity INTEGER DEFAULT 1,
      recurring_transaction_id TEXT
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT,
      amount REAL,
      month INTEGER,
      year INTEGER,
      UNIQUE(category, month, year)
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      UNIQUE(name, type)
    );
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS transaction_labels (
      transaction_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (transaction_id, label_id)
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      type TEXT,
      category TEXT,
      start_date TEXT,
      frequency TEXT,
      day_of_month INTEGER
    );
    CREATE TABLE IF NOT EXISTS recurring_transaction_labels (
      recurring_transaction_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (recurring_transaction_id, label_id)
    );
    CREATE TABLE IF NOT EXISTS savings (
      id TEXT PRIMARY KEY,
      amount REAL,
      month INTEGER,
      year INTEGER,
      UNIQUE(month, year)
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      all_day INTEGER DEFAULT 0,
      start TEXT,
      end TEXT,
      due TEXT,
      repeat_json TEXT,
      color TEXT,
      gcal_event_id TEXT,
      gtask_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id)
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0
    );
  `);
}

function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (count > 0) return;
  const insert = db.prepare(
    'INSERT INTO categories (id, name, type, isDefault) VALUES (?, ?, ?, ?)' 
  );
  const expense = [
    'Groceries','Utilities','Transport','Entertainment','Health',
    'Dining Out','Shopping','Other'
  ];
  const income = ['Salary','Stocks','Gifts','Other'];
  const tx = db.transaction(() => {
    for (const n of expense) insert.run(randomUUID(), n, 'EXPENSE', 1);
    for (const n of income) insert.run(randomUUID(), n, 'INCOME', 1);
  });
  tx();
}

function addActivity(action, description) {
  const stmt = db.prepare(
    'INSERT INTO activity_log (id, timestamp, action, description) VALUES (?, ?, ?, ?)'
  );
  stmt.run(randomUUID(), new Date().toISOString(), action, description);
}

function upsertLabelIdByName(name) {
  const sel = db.prepare('SELECT id FROM labels WHERE name = ?').get(name);
  if (sel) return sel.id;
  const id = randomUUID();
  db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(id, name);
  return id;
}

function getSetting(key) {
  return db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
}

function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, value);
}

function encryptJSON(obj) {
  if (!ENC_KEY) return JSON.stringify(obj);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString('base64');
}

function decryptJSON(payload) {
  if (!ENC_KEY) return JSON.parse(payload);
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY), iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(json);
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getOAuthClientWithTokens() {
  const oauth = getOAuth2Client();
  if (!oauth) return null;
  const enc = getSetting('gcal_tokens');
  if (!enc) return null;
  oauth.setCredentials(decryptJSON(enc));
  return oauth;
}

function withOAuth2(callback) {
  return async (req, res) => {
    const oauth = getOAuth2Client();
    if (!oauth) return res.status(400).json({ error: 'Google OAuth not configured' });
    const enc = getSetting('gcal_tokens');
    if (!enc) return res.status(400).json({ error: 'Google Calendar not connected' });
    oauth.setCredentials(decryptJSON(enc));
    try {
      await callback(req, res, oauth);
    } catch (e) {
      console.error('Google API error', e);
      res.status(500).json({ error: String(e) });
    }
  };
}

async function ensureEventForTask(task, oauth) {
  if (!oauth) return null;
  if (!task.start || !task.end) return null;
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  const event = {
    summary: task.title,
    description: task.notes || '',
    start: { dateTime: new Date(task.start).toISOString() },
    end: { dateTime: new Date(task.end).toISOString() },
    colorId: undefined,
  };
  if (task.repeat && task.repeat.type && task.repeat.type !== 'none') {
    const rrule = buildRRule(task.repeat);
    if (rrule) event.recurrence = [rrule];
  }
  if (task.gcalEventId) {
    await calendar.events.update({ calendarId: 'primary', eventId: task.gcalEventId, requestBody: event });
    return task.gcalEventId;
  } else {
    const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return created.data.id || null;
  }
}

function buildRRule(repeat) {
  if (!repeat || repeat.type === 'none') return null;
  if (repeat.type === 'daily') return `RRULE:FREQ=DAILY;INTERVAL=${repeat.interval || 1}`;
  if (repeat.type === 'weekly') return `RRULE:FREQ=WEEKLY;INTERVAL=${repeat.interval || 1}`;
  if (repeat.type === 'monthly') {
    if (repeat.monthlyMode === 'last_day') return 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-1';
    const dom = repeat.dayOfMonth || 1;
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${dom};INTERVAL=${repeat.interval || 1}`;
  }
  return null;
}

async function ensureTaskOnGoogle(task, oauth) {
  if (!oauth) return null;
  const tasksApi = google.tasks({ version: 'v1', auth: oauth });
  const taskBody = {
    title: task.title,
    notes: task.notes || '',
    status: task.status === 'completed' ? 'completed' : 'needsAction',
  };
  if (task.due) {
    taskBody.due = new Date(task.due).toISOString();
  }

  try {
    if (task.gtaskId) {
      const updated = await tasksApi.tasks.update({
        tasklist: '@default',
        task: task.gtaskId,
        requestBody: taskBody,
      });
      return updated.data.id || null;
    } else {
      const created = await tasksApi.tasks.insert({
        tasklist: '@default',
        requestBody: taskBody,
      });
      return created.data.id || null;
    }
  } catch (e) {
    console.error('Failed to sync Google Task:', e.message);
    return null;
  }
}

function mapRows(rows) {
  return rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    quantity: Number(r.quantity),
  }));
}

app.get('/api/transactions', (req, res) => {
  const rows = db.prepare(`
    SELECT t.id, t.description, t.amount, t.date, t.type, t.category, t.quantity,
           t.recurring_transaction_id as recurringTransactionId,
           GROUP_CONCAT(l.name) as labels
    FROM transactions t
    LEFT JOIN transaction_labels tl ON t.id = tl.transaction_id
    LEFT JOIN labels l ON tl.label_id = l.id
    GROUP BY t.id
    ORDER BY t.date DESC, t.id DESC
  `).all();
  const out = mapRows(rows).map(r => ({
    ...r,
    labels: r.labels ? r.labels.split(',') : []
  }));
  res.json(out);
});

app.post('/api/transactions', (req, res) => {
  const {
    description, amount, date, type, category, quantity = 1, labels = [],
    recurringTransactionId = null
  } = req.body || {};
  const id = randomUUID();
  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO transactions (id, description, amount, date, type, category, quantity, recurring_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, description, amount, date, type, category, quantity, recurringTransactionId);
    for (const name of labels) {
      const lid = upsertLabelIdByName(name);
      db.prepare('INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)')
        .run(id, lid);
    }
  });
  tx();
  addActivity('CREATE', `Added transaction: "${description}".`);
  res.json({ id, description, amount, date, type, category, quantity, labels, recurringTransactionId });
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { description, amount, date, type, category, quantity = 1, labels = [] } = req.body || {};
  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE transactions SET description=?, amount=?, date=?, type=?, category=?, quantity=? WHERE id=?'
    ).run(description, amount, date, type, category, quantity, id);
    db.prepare('DELETE FROM transaction_labels WHERE transaction_id=?').run(id);
    for (const name of labels) {
      const lid = upsertLabelIdByName(name);
      db.prepare('INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)')
        .run(id, lid);
    }
  });
  tx();
  addActivity('UPDATE', `Updated transaction: "${description}".`);
  res.json({ ok: true });
});

// ===== Planner: Tasks & Subtasks =====
app.get('/api/tasks', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, GROUP_CONCAT(l.name) as labels
    FROM tasks t
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    GROUP BY t.id
    ORDER BY t.updated_at DESC
  `).all();
  const tasks = rows.map(r => ({
    id: r.id,
    title: r.title,
    notes: r.notes || '',
    status: r.status,
    priority: r.priority,
    allDay: !!r.all_day,
    start: r.start || null,
    end: r.end || null,
    due: r.due || null,
    repeat: r.repeat_json ? JSON.parse(r.repeat_json) : null,
    color: r.color || null,
    labels: r.labels ? r.labels.split(',') : [],
    gcalEventId: r.gcal_event_id || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  for (const t of tasks) {
    t.subtasks = db.prepare('SELECT id, task_id as taskId, title, done FROM subtasks WHERE task_id = ?').all(t.id)
      .map(s => ({ ...s, done: !!s.done }));
  }
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  const {
    title, notes = '', status = 'new', priority = 'medium', allDay = false,
    start = null, end = null, due = null, repeat = null, color = null, labels = [],
    subtasks = []
  } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO tasks (id, title, notes, status, priority, all_day, start, end, due, repeat_json, color, gcal_event_id, gtask_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, title, notes, status, priority, allDay ? 1 : 0, start, end, due, repeat ? JSON.stringify(repeat) : null, color, null, null, now, now);
    for (const name of labels) {
      const lid = upsertLabelIdByName(name);
      db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(id, lid);
    }
    for (const st of subtasks) {
      db.prepare('INSERT INTO subtasks (id, task_id, title, done) VALUES (?, ?, ?, ?)')
        .run(randomUUID(), id, st.title, st.done ? 1 : 0);
    }
  });
  tx();
  const oauth = getOAuthClientWithTokens();
  let gcalId = null;
  let gtaskId = null;
  if (oauth) {
    if (start && end) {
      try { gcalId = await ensureEventForTask({ id, title, notes, start, end, repeat, gcalEventId: null }, oauth); } catch {}
    }
    try { gtaskId = await ensureTaskOnGoogle({ id, title, notes, due, status, gtaskId: null }, oauth); } catch {}
  }
  if (gcalId || gtaskId) {
    db.prepare('UPDATE tasks SET gcal_event_id=COALESCE(?, gcal_event_id), gtask_id=COALESCE(?, gtask_id) WHERE id=?')
      .run(gcalId, gtaskId, id);
  }
  res.json({ id });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const now = new Date().toISOString();
  const {
    title = existing.title, notes = existing.notes, status = existing.status,
    priority = existing.priority, allDay = !!existing.all_day,
    start = existing.start, end = existing.end, due = existing.due,
    repeat = existing.repeat_json ? JSON.parse(existing.repeat_json) : null,
    color = existing.color, labels = [], subtasks = []
  } = req.body || {};
  const tx = db.transaction(() => {
    db.prepare(`UPDATE tasks SET title=?, notes=?, status=?, priority=?, all_day=?, start=?, end=?, due=?, repeat_json=?, color=?, updated_at=? WHERE id=?`)
      .run(title, notes, status, priority, allDay ? 1 : 0, start, end, due, repeat ? JSON.stringify(repeat) : null, color, now, id);
    db.prepare('DELETE FROM task_labels WHERE task_id=?').run(id);
    for (const name of labels) {
      const lid = upsertLabelIdByName(name);
      db.prepare('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)').run(id, lid);
    }
    db.prepare('DELETE FROM subtasks WHERE task_id=?').run(id);
    for (const st of subtasks) {
      db.prepare('INSERT INTO subtasks (id, task_id, title, done) VALUES (?, ?, ?, ?)')
        .run(st.id || randomUUID(), id, st.title, st.done ? 1 : 0);
    }
  });
  tx();
  const oauth = getOAuthClientWithTokens();
  let gcalId = existing.gcal_event_id || null;
  let gtaskId = existing.gtask_id || null;
  if (oauth) {
    if (start && end) {
      try { gcalId = await ensureEventForTask({ id, title, notes, start, end, repeat, gcalEventId: gcalId }, oauth); } catch {}
    }
    try { gtaskId = await ensureTaskOnGoogle({ id, title, notes, due, status, gtaskId }, oauth); } catch {}
  }
  if ((gcalId && gcalId !== existing.gcal_event_id) || (gtaskId && gtaskId !== existing.gtask_id)) {
    db.prepare('UPDATE tasks SET gcal_event_id=COALESCE(?, gcal_event_id), gtask_id=COALESCE(?, gtask_id) WHERE id=?')
      .run(gcalId, gtaskId, id);
  }
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT gcal_event_id FROM tasks WHERE id = ?').get(id);
  db.prepare('DELETE FROM subtasks WHERE task_id=?').run(id);
  db.prepare('DELETE FROM task_labels WHERE task_id=?').run(id);
  db.prepare('DELETE FROM tasks WHERE id=?').run(id);
  const oauth = getOAuthClientWithTokens();
  if (oauth && existing?.gcal_event_id) {
    try { await google.calendar({ version: 'v3', auth: oauth }).events.delete({ calendarId: 'primary', eventId: existing.gcal_event_id }); } catch {}
  }
  res.json({ ok: true });
});

app.get('/api/tasks/board', (req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) as c FROM tasks GROUP BY status').all();
  res.json(rows);
});

app.get('/api/tasks/agenda', (req, res) => {
  const range = String(req.query.range || 'today');
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = new Date(today);
  const end = new Date(today);
  if (range === 'week') end.setDate(start.getDate() + 7);
  if (range === 'overdue') {
    const items = db.prepare('SELECT * FROM tasks WHERE due IS NOT NULL AND due < ? ORDER BY due ASC').all(today.toISOString());
    return res.json(items);
  }
  const items = db.prepare('SELECT * FROM tasks WHERE (start BETWEEN ? AND ?) OR (due BETWEEN ? AND ?) ORDER BY COALESCE(start, due) ASC')
    .all(start.toISOString(), end.toISOString(), start.toISOString(), end.toISOString());
  res.json(items);
});

// ===== Google Calendar OAuth & Events =====
app.get('/api/calendar/auth-url', (req, res) => {
  const oauth = getOAuth2Client();
  if (!oauth) return res.status(400).json({ error: 'Missing GOOGLE_* env' });
  const url = oauth.generateAuthUrl({ access_type: 'offline', scope: GOOGLE_API_SCOPES, prompt: 'consent' });
  res.json({ url });
});

app.get('/api/calendar/callback', async (req, res) => {
  const oauth = getOAuth2Client();
  if (!oauth) return res.status(400).send('Missing GOOGLE_* env');
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  const { tokens } = await oauth.getToken(String(code));
  setSetting('gcal_tokens', encryptJSON(tokens));
  res.send('<html><body><p>Google Calendar connected. You can close this window.</p></body></html>');
});

app.get('/api/calendar/events', withOAuth2(async (req, res, oauth) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  const { timeMin, timeMax } = req.query;
  const r = await calendar.events.list({ calendarId: 'primary', timeMin: String(timeMin), timeMax: String(timeMax), singleEvents: true, orderBy: 'startTime' });
  res.json(r.data.items || []);
}));

app.post('/api/calendar/events', withOAuth2(async (req, res, oauth) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  const created = await calendar.events.insert({ calendarId: 'primary', requestBody: req.body });
  res.json(created.data);
}));

app.put('/api/calendar/events/:id', withOAuth2(async (req, res, oauth) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  const updated = await calendar.events.update({ calendarId: 'primary', eventId: req.params.id, requestBody: req.body });
  res.json(updated.data);
}));

app.delete('/api/calendar/events/:id', withOAuth2(async (req, res, oauth) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  await calendar.events.delete({ calendarId: 'primary', eventId: req.params.id });
  res.json({ ok: true });
}));

app.get('/api/calendar/disconnect', (req, res) => {
  db.prepare('DELETE FROM settings WHERE key = ?').run('gcal_tokens');
  res.json({ ok: true });
});

app.get('/api/google-tasks', withOAuth2(async (req, res, oauth) => {
  const tasksApi = google.tasks({ version: 'v1', auth: oauth });
  const r = await tasksApi.tasks.list({
    tasklist: '@default',
    showCompleted: false,
    showHidden: false,
  });
  res.json(r.data.items || []);
}));

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT description FROM transactions WHERE id=?').get(id);
  db.prepare('DELETE FROM transactions WHERE id=?').run(id);
  addActivity('DELETE', `Deleted transaction: "${row?.description || 'Unknown'}".`);
  res.json({ ok: true });
});

app.post('/api/transactions/bulk', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const insertTx = db.prepare(
    'INSERT INTO transactions (id, description, amount, date, type, category, quantity, recurring_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertJunction = db.prepare(
    'INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)'
  );
  const tx = db.transaction(() => {
    for (const item of items) {
      const id = randomUUID();
      insertTx.run(id, item.description, item.amount, item.date, item.type, item.category, item.quantity ?? 1, item.recurringTransactionId ?? null);
      const labels = item.labels || [];
      for (const name of labels) {
        const lid = upsertLabelIdByName(name);
        insertJunction.run(id, lid);
      }
    }
  });
  tx();
  res.json({ ok: true });
});

app.get('/api/budgets', (req, res) => {
  const rows = db.prepare('SELECT * FROM budgets ORDER BY category').all();
  res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
});

app.post('/api/budgets/category', (req, res) => {
  const { category, amount, month, year } = req.body || {};
  const id = randomUUID();
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO budgets (id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)')
      .run(id, category, amount, month, year);
  });
  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: String(e) });
  }
  addActivity('CREATE', `Set budget for ${category} to $${Number(amount).toFixed(2)}.`);
  res.json({ id, category, amount, month, year });
});

app.post('/api/budgets/overall', (req, res) => {
  const { amount, month, year } = req.body || {};
  const sel = db.prepare('SELECT id FROM budgets WHERE category=? AND month=? AND year=?')
    .get(OVERALL_BUDGET_CATEGORY, month, year);
  if (sel) {
    db.prepare('UPDATE budgets SET amount=? WHERE id=?').run(amount, sel.id);
    addActivity('UPDATE', `Updated overall budget for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  } else {
    const id = randomUUID();
    db.prepare('INSERT INTO budgets (id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)')
      .run(id, OVERALL_BUDGET_CATEGORY, amount, month, year);
    addActivity('CREATE', `Set overall budget for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  }
  const out = db.prepare('SELECT * FROM budgets WHERE category=? AND month=? AND year=?')
    .get(OVERALL_BUDGET_CATEGORY, month, year);
  res.json(out);
});

app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows.map(r => ({ ...r, isDefault: !!r.isDefault })));
});

app.post('/api/categories', (req, res) => {
  const { name, type } = req.body || {};
  const id = randomUUID();
  db.prepare('INSERT INTO categories (id, name, type, isDefault) VALUES (?, ?, ?, 0)')
    .run(id, name, type);
  addActivity('CREATE', `Created new ${String(type).toLowerCase()} category: "${name}".`);
  res.json({ id, name, type, isDefault: false });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { newName, oldName } = req.body || {};
  const tx = db.transaction(() => {
    db.prepare('UPDATE categories SET name=? WHERE id=?').run(newName, id);
    db.prepare('UPDATE transactions SET category=? WHERE category=?').run(newName, oldName);
    db.prepare('UPDATE budgets SET category=? WHERE category=?').run(newName, oldName);
  });
  tx();
  addActivity('UPDATE', `Updated category "${oldName}" to "${newName}".`);
  res.json({ ok: true });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT name FROM categories WHERE id=?').get(id);
  db.prepare('DELETE FROM categories WHERE id=?').run(id);
  addActivity('DELETE', `Deleted category "${row?.name || 'Unknown'}".`);
  res.json({ ok: true });
});

app.get('/api/recurring', (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.description, r.amount, r.type, r.category, r.start_date as startDate, r.frequency, r.day_of_month as dayOfMonth,
           GROUP_CONCAT(l.name) as labels
    FROM recurring_transactions r
    LEFT JOIN recurring_transaction_labels rtl ON r.id = rtl.recurring_transaction_id
    LEFT JOIN labels l ON rtl.label_id = l.id
    GROUP BY r.id
    ORDER BY r.start_date DESC
  `).all();
  const out = rows.map(r => ({ ...r, amount: Number(r.amount), labels: r.labels ? r.labels.split(',') : [] }));
  res.json(out);
});

app.post('/api/recurring', (req, res) => {
  const { description, amount, type, category, startDate, frequency = 'monthly', dayOfMonth, labels = [] } = req.body || {};
  const id = randomUUID();
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO recurring_transactions (id, description, amount, type, category, start_date, frequency, day_of_month) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, description, amount, type, category, startDate, frequency, dayOfMonth);
    for (const name of labels) {
      const lid = upsertLabelIdByName(name);
      db.prepare('INSERT INTO recurring_transaction_labels (recurring_transaction_id, label_id) VALUES (?, ?)')
        .run(id, lid);
    }
  });
  tx();
  addActivity('CREATE', `Created recurring transaction: "${description}".`);
  res.json({ id, description, amount, type, category, startDate, frequency, dayOfMonth, labels });
});

app.delete('/api/recurring/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT description FROM recurring_transactions WHERE id=?').get(id);
  db.prepare('DELETE FROM recurring_transactions WHERE id=?').run(id);
  addActivity('DELETE', `Deleted recurring transaction: "${row?.description || 'Unknown'}".`);
  res.json({ ok: true });
});

app.post('/api/recurring/generate-due', (req, res) => {
  const recurring = db.prepare(`
    SELECT r.id, r.description, r.amount, r.type, r.category, r.start_date as startDate, r.day_of_month as dayOfMonth
    FROM recurring_transactions r
  `).all();
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  let generated = 0;
  const tx = db.transaction(() => {
    for (const r of recurring) {
      const last = db.prepare('SELECT MAX(date) as d FROM transactions WHERE recurring_transaction_id=?').get(r.id)?.d || null;
      const rLabelRows = db.prepare('SELECT l.id as labelId FROM recurring_transaction_labels rtl JOIN labels l ON rtl.label_id = l.id WHERE rtl.recurring_transaction_id = ?').all(r.id);
      let cursor = new Date(last || r.startDate);
      if (last) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      while (cursor <= today) {
        const year = cursor.getUTCFullYear();
        const month = cursor.getUTCMonth();
        const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const day = Math.min(r.dayOfMonth, dim);
        const genDate = new Date(Date.UTC(year, month, day));
        if (genDate <= today && (!last || genDate > new Date(last))) {
          const id = randomUUID();
          db.prepare('INSERT INTO transactions (id, description, amount, date, type, category, quantity, recurring_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(id, r.description, r.amount, genDate.toISOString().split('T')[0], r.type, r.category, 1, r.id);
          for (const row of rLabelRows) {
            db.prepare('INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)')
              .run(id, row.labelId);
          }
          generated++;
        }
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    }
  });
  tx();
  res.json({ generated });
});

app.get('/api/savings', (req, res) => {
  const rows = db.prepare('SELECT * FROM savings ORDER BY year, month').all();
  res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
});

app.post('/api/savings/upsert', (req, res) => {
  const { amount, month, year } = req.body || {};
  const sel = db.prepare('SELECT id FROM savings WHERE month=? AND year=?').get(month, year);
  if (sel) {
    db.prepare('UPDATE savings SET amount=? WHERE id=?').run(amount, sel.id);
    addActivity('UPDATE', `Updated savings for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  } else {
    const id = randomUUID();
    db.prepare('INSERT INTO savings (id, amount, month, year) VALUES (?, ?, ?, ?)')
      .run(id, amount, month, year);
    addActivity('CREATE', `Set savings for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  }
  const out = db.prepare('SELECT * FROM savings WHERE month=? AND year=?').get(month, year);
  res.json(out);
});

app.get('/api/activity', (req, res) => {
  const rows = db.prepare('SELECT id, timestamp, action, description FROM activity_log ORDER BY timestamp DESC').all();
  res.json(rows);
});

app.get('/api/settings', (req, res) => {
  const theme = db.prepare('SELECT value FROM settings WHERE key = ?').get('theme')?.value || 'dark-blue';
  const color = db.prepare('SELECT value FROM settings WHERE key = ?').get('customColor')?.value || '#5e258a';
  res.json({ theme, customThemeColor: color });
});

app.post('/api/settings', (req, res) => {
  const { theme, customThemeColor } = req.body || {};
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
      .run('theme', theme);
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
      .run('customColor', customThemeColor);
  });
  tx();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
