import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';
const GOOGLE_API_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks'
];
const ENC_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);

const app = express();
const allowedOrigins = [
  'https://probudget-frontend.onrender.com',
  'http://localhost:3000', // Vite dev server (configured port)
  'http://localhost:5173', // Vite dev server (default port)
  'http://localhost:4173', // Vite preview server
];

const corsOptions = {
  origin: (origin, callback) => {
    // `origin` is undefined for same-origin requests or server-to-server requests.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
console.log('CORS middleware configured to allow origins:', allowedOrigins);
app.use(express.json({ limit: '5mb' }));


// Helper functions for amount conversion
function toEuros(cents) {
  return cents / 100;
}

function toCents(euros) {
  return Math.round(euros * 100);
}

async function addActivity(action, description) {
  await supabase.from('activity_log').insert({ action, description });
}

async function upsertLabelIdByName(name) {
  let { data: label, error } = await supabase.from('labels').select('id').eq('name', name).single();
  if (label) return label.id;

  const { data: newLabel, error: insertError } = await supabase.from('labels').insert({ name }).select('id').single();
  if (insertError) throw insertError;
  return newLabel.id;
}

async function getSetting(key) {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
    if (error) return null;
    return data.value;
}

async function setSetting(key, value) {
    const { data, error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
    if (error) throw error;
    return data;
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

async function getOAuthClientWithTokens() {
  const oauth = getOAuth2Client();
  if (!oauth) return null;
  const enc = await getSetting('gcal_tokens');
  if (!enc) return null;
  oauth.setCredentials(decryptJSON(enc));
  return oauth;
}

function withOAuth2(callback) {
  return async (req, res) => {
    const oauth = getOAuth2Client();
    if (!oauth) return res.status(400).json({ error: 'Google OAuth not configured' });
    const enc = await getSetting('gcal_tokens');
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

app.get('/api/transactions', async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      description,
      amount,
      date,
      type,
      category,
      quantity,
      recurring_transaction_id,
      labels:transaction_labels (
        label:labels (name)
      )
    `)
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }

  const out = data.map(t => ({
    ...t,
    amount: toEuros(t.amount),
    labels: t.labels.map(l => l.label.name)
  }));

  res.json(out);
});

app.post('/api/transactions', async (req, res) => {
  const {
    description, amount, date, type, category, quantity = 1, labels = [],
    recurringTransactionId = null
  } = req.body || {};

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({ description, amount: toCents(amount), date, type, category, quantity, recurring_transaction_id: recurringTransactionId })
    .select('id')
    .single();

  if (txError) {
    console.error('Error creating transaction:', txError);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }

  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const transactionLabels = labelIds.map(label_id => ({
      transaction_id: transaction.id,
      label_id
    }));
    const { error: labelError } = await supabase.from('transaction_labels').insert(transactionLabels);
    if (labelError) {
      console.error('Error adding labels to transaction:', labelError);
    }
  }

  await addActivity('CREATE', `Added transaction: "${description}".`);
  res.json({ id: transaction.id, description, amount, date, type, category, quantity, labels, recurringTransactionId });
});

app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, date, type, category, quantity = 1, labels = [] } = req.body || {};

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ description, amount: toCents(amount), date, type, category, quantity })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating transaction:', updateError);
    return res.status(500).json({ error: 'Failed to update transaction' });
  }

  const { error: deleteLabelsError } = await supabase.from('transaction_labels').delete().eq('transaction_id', id);
  if (deleteLabelsError) {
    console.error('Error clearing transaction labels:', deleteLabelsError);
  }

  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const transactionLabels = labelIds.map(label_id => ({
      transaction_id: id,
      label_id
    }));
    const { error: labelError } = await supabase.from('transaction_labels').insert(transactionLabels);
    if (labelError) {
      console.error('Error adding labels to transaction:', labelError);
    }
  }

  await addActivity('UPDATE', `Updated transaction: "${description}".`);
  res.json({ ok: true });
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('description')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching transaction for deletion:', fetchError);
  }

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting transaction:', deleteError);
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }

  await addActivity('DELETE', `Deleted transaction: "${transaction?.description || 'Unknown'}".`);
  res.json({ ok: true });
});

app.post('/api/transactions/bulk', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  if (items.length === 0) return res.json({ ok: true });

  const transactions = items.map(item => ({
    description: item.description,
    amount: toCents(item.amount),
    date: item.date,
    type: item.type,
    category: item.category,
    quantity: Math.round(item.quantity ?? 1),
    recurring_transaction_id: item.recurringTransactionId ?? null
  }));

  const { data: insertedTxs, error: txError } = await supabase.from('transactions').insert(transactions).select('id');
  if (txError) {
    console.error('Bulk insert error:', txError);
    return res.status(500).json({ error: 'Failed to bulk insert transactions' });
  }

  const labelPromises = items.flatMap((item, i) => {
    const labels = item.labels || [];
    if (labels.length === 0) return [];
    const transactionId = insertedTxs[i].id;
    return labels.map(async (name) => {
      const labelId = await upsertLabelIdByName(name);
      return { transaction_id: transactionId, label_id: labelId };
    });
  });

  if (labelPromises.length > 0) {
    const transactionLabels = await Promise.all(labelPromises);
    await supabase.from('transaction_labels').insert(transactionLabels);
  }

  res.json({ ok: true });
});

// ===== Planner: Tasks & Subtasks =====
app.get('/api/tasks', async (req, res) => {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels ( label:labels (name) ),
      subtasks (*)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }

  const out = tasks.map(t => ({
    ...t,
    labels: t.labels.map(l => l.label.name),
    allDay: t.all_day,
    repeat: t.repeat_json,
    gcalEventId: t.gcal_event_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    completedAt: t.completed_at,
    progress: t.progress !== null && t.progress !== undefined ? t.progress : 0,
  }));

  console.log('[GET /api/tasks] Fetched', tasks.length, 'tasks');
  // Log tasks with in_progress status for debugging
  const inProgressTasks = out.filter(t => t.status === 'in_progress');
  if (inProgressTasks.length > 0) {
    console.log('[GET /api/tasks] In-progress tasks:', inProgressTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      progress: t.progress,
      start: t.start,
      due: t.due
    })));
  }
  res.json(out);
});

app.post('/api/tasks', async (req, res) => {
  const {
    title, notes = '', status = 'new', priority = 'medium', allDay = false,
    start = null, end = null, due = null, repeat = null, color = null, labels = [],
    subtasks = []
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  console.log('[POST /api/tasks] Creating task:', { title, status, priority });

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title, notes, status, priority, all_day: allDay, start, end, due,
      repeat_json: repeat, color
    })
    .select('id, created_at')
    .single();

  if (taskError) {
    console.error('[POST /api/tasks] Error creating task:', taskError);
    return res.status(500).json({ error: 'Failed to create task' });
  }

  console.log('[POST /api/tasks] Task created successfully:', { id: task.id, created_at: task.created_at });

  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const taskLabels = labelIds.map(label_id => ({ task_id: task.id, label_id }));
    await supabase.from('task_labels').insert(taskLabels);
  }

  if (subtasks.length > 0) {
    const subtaskData = subtasks.map(st => ({ task_id: task.id, title: st.title, done: st.done }));
    await supabase.from('subtasks').insert(subtaskData);
  }

  const oauth = await getOAuthClientWithTokens();
  let gcalId = null;
  let gtaskId = null;
  if (oauth) {
    if (start && end) {
      try { gcalId = await ensureEventForTask({ id: task.id, title, notes, start, end, repeat, gcalEventId: null }, oauth); } catch {}
    }
    try { gtaskId = await ensureTaskOnGoogle({ id: task.id, title, notes, due, status, gtaskId: null }, oauth); } catch {}
  }

  if (gcalId || gtaskId) {
    await supabase.from('tasks').update({ gcal_event_id: gcalId, gtask_id: gtaskId }).eq('id', task.id);
  }

  res.json({ id: task.id });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { data: existing } = await supabase.from('tasks').select().eq('id', id).single();
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    title = existing.title, notes = existing.notes, status = existing.status,
    priority = existing.priority, allDay = existing.all_day,
    start = existing.start, end = existing.end, due = existing.due,
    repeat = existing.repeat_json, color = existing.color, labels = [], subtasks = [],
    progress = existing.progress
  } = req.body || {};

  console.log('[PUT /api/tasks/:id] Updating task:', { id, oldStatus: existing.status, newStatus: status, progress });

  // Initialize progress to 0 when moving to in_progress if not already set
  let finalProgress = progress;
  if (status === 'in_progress' && existing.status !== 'in_progress') {
    // Task is being moved to in_progress for the first time
    if (finalProgress === undefined || finalProgress === null) {
      finalProgress = 0;
      console.log('[PUT /api/tasks/:id] Initializing progress to 0 for new in_progress task');
    }
  }

  // Prepare update data
  const updateData = {
    title, notes, status, priority, all_day: allDay, start, end, due,
    repeat_json: repeat, color, updated_at: new Date().toISOString(), progress: finalProgress
  };

  // Set completed_at when task is marked as completed
  if (status === 'completed' && existing.status !== 'completed') {
    updateData.completed_at = new Date().toISOString();
    console.log('[PUT /api/tasks/:id] Task marked as completed, setting completed_at:', updateData.completed_at);
  }
  // Clear completed_at if task is unmarked from completed
  else if (status !== 'completed' && existing.status === 'completed') {
    updateData.completed_at = null;
    console.log('[PUT /api/tasks/:id] Task unmarked from completed, clearing completed_at');
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('[PUT /api/tasks/:id] Error updating task:', updateError);
    return res.status(500).json({ error: 'Failed to update task' });
  }

  console.log('[PUT /api/tasks/:id] Task updated successfully with data:', {
    id,
    status: updateData.status,
    progress: updateData.progress,
    start: updateData.start,
    due: updateData.due
  });

  await supabase.from('task_labels').delete().eq('task_id', id);
  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const taskLabels = labelIds.map(label_id => ({ task_id: id, label_id }));
    await supabase.from('task_labels').insert(taskLabels);
  }

  await supabase.from('subtasks').delete().eq('task_id', id);
  if (subtasks.length > 0) {
    const subtaskData = subtasks.map(st => ({ task_id: id, title: st.title, done: st.done }));
    await supabase.from('subtasks').insert(subtaskData);
  }

  const oauth = await getOAuthClientWithTokens();
  let gcalId = existing.gcal_event_id || null;
  let gtaskId = existing.gtask_id || null;
  if (oauth) {
    if (start && end) {
      try { gcalId = await ensureEventForTask({ id, title, notes, start, end, repeat, gcalEventId: gcalId }, oauth); } catch {}
    }
    try { gtaskId = await ensureTaskOnGoogle({ id, title, notes, due, status, gtaskId }, oauth); } catch {}
    
    // Sync task completion status with Google Calendar event
    if (gcalId && status !== existing.status) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth });
        const eventStatus = status === 'completed' ? 'cancelled' : 'confirmed';
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: gcalId,
          requestBody: { status: eventStatus }
        });
      } catch (err) {
        console.error('Failed to sync task status to calendar:', err.message);
      }
    }
  }

  if ((gcalId && gcalId !== existing.gcal_event_id) || (gtaskId && gtaskId !== existing.gtask_id)) {
    await supabase.from('tasks').update({ gcal_event_id: gcalId, gtask_id: gtaskId }).eq('id', id);
  }

  res.json({ ok: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { data: existing } = await supabase.from('tasks').select('gcal_event_id').eq('id', id).single();

  await supabase.from('subtasks').delete().eq('task_id', id);
  await supabase.from('task_labels').delete().eq('task_id', id);
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }

  const oauth = await getOAuthClientWithTokens();
  if (oauth && existing?.gcal_event_id) {
    try { await google.calendar({ version: 'v3', auth: oauth }).events.delete({ calendarId: 'primary', eventId: existing.gcal_event_id }); } catch {}
  }
  res.json({ ok: true });
});

app.get('/api/tasks/board', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('status');
  if (error) {
    console.error('Error fetching task board data:', error);
    return res.status(500).json({ error: 'Failed to fetch task board data' });
  }
  const counts = data.reduce((acc, { status }) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(counts).map(([status, c]) => ({ status, c }));
  res.json(rows);
});

app.get('/api/tasks/agenda', async (req, res) => {
  const range = String(req.query.range || 'today');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  if (range === 'week') end.setDate(start.getDate() + 7);

  let query = supabase.from('tasks');
  if (range === 'overdue') {
    query = query.select('*').not('due', 'is', null).lt('due', today.toISOString()).order('due', { ascending: true });
  } else {
    query = query.select('*').or(`and(start.gte.${start.toISOString()},start.lte.${end.toISOString()}),and(due.gte.${start.toISOString()},due.lte.${end.toISOString()})`).order('start', { nullsFirst: true }).order('due', { nullsFirst: true });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching agenda items:', error);
    return res.status(500).json({ error: 'Failed to fetch agenda items' });
  }
  res.json(data);
});

// Shopping Items APIs
app.get('/api/shopping-items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching shopping items:', error);
      return res.status(500).json({ error: 'Failed to fetch shopping items' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error in shopping items route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/shopping-items', async (req, res) => {
  try {
    const { title, category, notes, priority, completed, completedAt } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const itemData = {
      id: randomUUID(),
      title: title.trim(),
      category: category?.trim() || null,
      notes: notes?.trim() || null,
      priority: priority || 'medium',
      completed: completed || false,
      completedAt: completedAt || null,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shopping_items')
      .insert(itemData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating shopping item:', error);
      return res.status(500).json({ error: 'Failed to create shopping item' });
    }

    await addActivity('add_shopping_item', `Added shopping item: ${title}`);
    res.json({ id: data.id });
  } catch (err) {
    console.error('Error in create shopping item route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/shopping-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;

    const { error } = await supabase
      .from('shopping_items')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating shopping item:', error);
      return res.status(500).json({ error: 'Failed to update shopping item' });
    }

    await addActivity('update_shopping_item', `Updated shopping item: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in update shopping item route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/shopping-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shopping item:', error);
      return res.status(500).json({ error: 'Failed to delete shopping item' });
    }

    await addActivity('delete_shopping_item', `Deleted shopping item: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error in delete shopping item route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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

app.put('/api/calendar/events/:id/toggle', withOAuth2(async (req, res, oauth) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  const { currentStatus } = req.body;
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'completed';
  
  // Toggle: if currently cancelled/completed, restore to confirmed; otherwise mark as cancelled
  const newStatus = isCancelled ? 'confirmed' : 'cancelled';
  
  const updated = await calendar.events.patch({
    calendarId: 'primary',
    eventId: req.params.id,
    requestBody: { status: newStatus }
  });
  
  res.json(updated.data);
}));

app.get('/api/calendar/disconnect', async (req, res) => {
  await supabase.from('settings').delete().eq('key', 'gcal_tokens');
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

app.put('/api/google-tasks/:id/toggle', withOAuth2(async (req, res, oauth) => {
  const tasksApi = google.tasks({ version: 'v1', auth: oauth });
  const { currentStatus } = req.body;
  
  // Google Tasks status: 'needsAction' or 'completed'
  const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
  
  const updated = await tasksApi.tasks.patch({
    tasklist: '@default',
    task: req.params.id,
    requestBody: { status: newStatus, id: req.params.id }
  });
  
  res.json(updated.data);
}));

app.get('/api/budgets', async (req, res) => {
  const { data, error } = await supabase.from('budgets').select('*').order('category');
  if (error) return res.status(500).json({ error: 'Failed to fetch budgets' });
  const out = data.map(b => ({ ...b, amount: toEuros(b.amount) }));
  res.json(out);
});

app.post('/api/budgets/category', async (req, res) => {
  const { category, amount, month, year } = req.body || {};
  const { data, error } = await supabase.from('budgets').insert({ category, amount: toCents(amount), month, year }).select().single();
  if (error) {
    console.error('Error creating budget:', error);
    return res.status(400).json({ error: 'Failed to create budget' });
  }
  await addActivity('CREATE', `Set budget for ${category} to $${Number(amount).toFixed(2)}.`);
  res.json({ ...data, amount: toEuros(data.amount) });
});

app.put('/api/budgets/:id', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body || {};
  
  const { data: budget, error: fetchError } = await supabase.from('budgets').select('category').eq('id', id).single();
  if (fetchError) return res.status(404).json({ error: 'Budget not found' });

  const { error } = await supabase.from('budgets').update({ amount: toCents(amount) }).eq('id', id);
  if (error) {
    console.error('Error updating budget:', error);
    return res.status(500).json({ error: 'Failed to update budget' });
  }

  await addActivity('UPDATE', `Updated budget for ${budget.category} to $${Number(amount).toFixed(2)}.`);
  res.json({ ok: true });
});

app.post('/api/budgets/overall', async (req, res) => {
  const { amount, month, year } = req.body || {};
  const { data, error } = await supabase.from('budgets').upsert({ category: OVERALL_BUDGET_CATEGORY, amount: toCents(amount), month, year }, { onConflict: 'category,month,year' }).select().single();

  if (error) {
    console.error('Error upserting overall budget:', error);
    return res.status(500).json({ error: 'Failed to set overall budget' });
  }

  await addActivity('UPDATE', `Updated overall budget for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  res.json({ ...data, amount: toEuros(data.amount) });
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(500).json({ error: 'Failed to fetch categories' });
  res.json(data);
});

app.get('/api/labels', async (req, res) => {
  const { data, error } = await supabase.from('labels').select('name').order('name');
  if (error) return res.status(500).json({ error: 'Failed to fetch labels' });
  res.json(data.map(label => label.name));
});

app.post('/api/categories', async (req, res) => {
  const { name, type } = req.body || {};
  const { data, error } = await supabase.from('categories').insert({ name, type }).select().single();
  if (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
  await addActivity('CREATE', `Created new ${String(type).toLowerCase()} category: "${name}".`);
  res.json(data);
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { newName, oldName } = req.body || {};

  const { error: catErr } = await supabase.from('categories').update({ name: newName }).eq('id', id);
  if (catErr) return res.status(500).json({ error: 'Failed to update category name' });

  const { error: txErr } = await supabase.from('transactions').update({ category: newName }).eq('category', oldName);
  if (txErr) console.error('Failed to update transactions category');

  const { error: budErr } = await supabase.from('budgets').update({ category: newName }).eq('category', oldName);
  if (budErr) console.error('Failed to update budgets category');

  await addActivity('UPDATE', `Updated category "${oldName}" to "${newName}".`);
  res.json({ ok: true });
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { data: category, error: fetchError } = await supabase.from('categories').select('name').eq('id', id).single();
  if (fetchError) console.error('Could not fetch category for activity log');

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
  await addActivity('DELETE', `Deleted category "${category?.name || 'Unknown'}".`);
  res.json({ ok: true });
});

app.get('/api/recurring', async (req, res) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(`
      id, description, amount, type, category, start_date, frequency, day_of_month,
      labels:recurring_transaction_labels ( label:labels (name) )
    `)
    .order('start_date', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch recurring transactions' });

  const out = data.map(r => ({
    id: r.id,
    description: r.description,
    amount: toEuros(r.amount),
    type: r.type,
    category: r.category,
    startDate: r.start_date,
    frequency: r.frequency,
    dayOfMonth: r.day_of_month,
    labels: r.labels.map(l => l.label.name)
  }));
  res.json(out);
});

app.post('/api/recurring', async (req, res) => {
  const { description, amount, type, category, startDate, frequency = 'monthly', dayOfMonth, labels = [] } = req.body || {};
  const { data: recurring, error } = await supabase
    .from('recurring_transactions')
    .insert({ description, amount: toCents(amount), type, category, start_date: startDate, frequency, day_of_month: dayOfMonth })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating recurring tx:', error);
    return res.status(500).json({ error: 'Failed to create recurring transaction' });
  }

  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const recurringLabels = labelIds.map(label_id => ({ recurring_transaction_id: recurring.id, label_id }));
    await supabase.from('recurring_transaction_labels').insert(recurringLabels);
  }

  await addActivity('CREATE', `Created recurring transaction: "${description}".`);
  res.json({ id: recurring.id, description, amount, type, category, startDate, frequency, dayOfMonth, labels });
});

app.delete('/api/recurring/:id', async (req, res) => {
  const { id } = req.params;
  const { data: recurring, error: fetchError } = await supabase.from('recurring_transactions').select('description').eq('id', id).single();
  if (fetchError) console.error('Could not fetch recurring tx for activity log');

  await supabase.from('recurring_transaction_labels').delete().eq('recurring_transaction_id', id);
  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);

  if (error) {
    console.error('Error deleting recurring tx:', error);
    return res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
  await addActivity('DELETE', `Deleted recurring transaction: "${recurring?.description || 'Unknown'}".`);
  res.json({ ok: true });
});

app.post('/api/recurring/generate-due', async (req, res) => {
  const { data: recurring, error: fetchErr } = await supabase
    .from('recurring_transactions')
    .select('*, labels:recurring_transaction_labels(label:labels(id))');

  if (fetchErr) {
    console.error('Error fetching recurring txs for generation:', fetchErr);
    return res.status(500).json({ error: 'Could not fetch recurring transactions' });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let generatedCount = 0;
  const newTransactions = [];
  const newTransactionLabels = [];

  for (const r of recurring) {
    const { data: lastTx } = await supabase
      .from('transactions')
      .select('date')
      .eq('recurring_transaction_id', r.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    let cursor = new Date((lastTx?.date) || r.start_date);
    if (lastTx) cursor.setUTCMonth(cursor.getUTCMonth() + 1);

    while (cursor <= today) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const day = Math.min(r.day_of_month, dim);
      const genDate = new Date(Date.UTC(year, month, day));

      if (genDate <= today && (!lastTx || genDate > new Date(lastTx.date))) {
        const newTxId = randomUUID();
        newTransactions.push({
          id: newTxId,
          description: r.description,
          amount: r.amount, // Already in cents in DB
          date: genDate.toISOString().split('T')[0],
          type: r.type,
          category: r.category,
          quantity: 1,
          recurring_transaction_id: r.id,
        });
        if (r.labels.length > 0) {
          r.labels.forEach(l => {
            newTransactionLabels.push({ transaction_id: newTxId, label_id: l.label.id });
          });
        }
        generatedCount++;
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  if (newTransactions.length > 0) {
    const { error: txErr } = await supabase.from('transactions').insert(newTransactions);
    if (txErr) console.error('Error generating transactions:', txErr);
  }
  if (newTransactionLabels.length > 0) {
    const { error: labelErr } = await supabase.from('transaction_labels').insert(newTransactionLabels);
    if (labelErr) console.error('Error generating transaction labels:', labelErr);
  }

  res.json({ generated: generatedCount });
});

app.get('/api/savings', async (req, res) => {
  const { data, error } = await supabase.from('savings').select('*').order('year').order('month');
  if (error) return res.status(500).json({ error: 'Failed to fetch savings' });
  const out = data.map(s => ({ ...s, amount: toEuros(s.amount) }));
  res.json(out);
});

app.post('/api/savings/upsert', async (req, res) => {
  const { amount, month, year } = req.body || {};
  const { data, error } = await supabase.from('savings').upsert({ amount: toCents(amount), month, year }, { onConflict: 'month,year' }).select().single();

  if (error) {
    console.error('Error upserting savings:', error);
    return res.status(500).json({ error: 'Failed to upsert savings' });
  }

  await addActivity('UPDATE', `Updated savings for ${new Date(year, month).toLocaleString('default',{month:'long',year:'numeric'})} to $${Number(amount).toFixed(2)}.`);
  res.json({ ...data, amount: toEuros(data.amount) });
});

app.get('/api/activity', async (req, res) => {
  const { data, error } = await supabase.from('activity_log').select('id, timestamp, action, description').order('timestamp', { ascending: false });
  if (error) return res.status(500).json({ error: 'Failed to fetch activity' });
  res.json(data);
});

// ===== Authentication =====
app.post('/api/auth/login', async (req, res) => {
  const startTs = Date.now();
  try {
    const { username, password } = req.body || {};
    console.log('[LOGIN] Attempt for username:', username, 'Body keys:', Object.keys(req.body || {}));

    if (!username || !password) {
      console.log('[LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query user
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', username)
      .single();

    if (dbError) {
      // Distinguish not found vs actual DB failure
      if (dbError.code === 'PGRST116') { // No rows found
        console.log('[LOGIN] User not found for username:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      console.error('[LOGIN] Supabase query error:', dbError);
      return res.status(500).json({ error: 'Internal auth error' });
    }
    if (!user) {
      console.log('[LOGIN] No user record returned');
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password (TODO: replace with hashed comparison e.g. bcrypt.compare())
    if (user.password !== password) {
      console.log('[LOGIN] Password mismatch for username:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    console.log('[LOGIN] Success for user:', username, 'Elapsed ms:', Date.now() - startTs);
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

app.post('/api/auth/verify-security-question', async (req, res) => {
  try {
    const { username, answer } = req.body || {};
    console.log('Security question verification for username:', username);
    
    if (!username || !answer) {
      console.log('Verification failed: Missing data');
      return res.status(400).json({ error: 'Username and answer are required' });
    }
    
    // Get user with security question/answer
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, security_question, security_answer')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      console.log('Verification failed: User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check answer (case-insensitive)
    if (user.security_answer.toLowerCase() !== answer.toLowerCase()) {
      console.log('Verification failed: Incorrect answer');
      return res.status(401).json({ error: 'Incorrect answer' });
    }
    
    console.log('Security question verified for user:', username);
    res.json({ success: true, securityQuestion: user.security_question });
  } catch (error) {
    console.error('Security verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body || {};
    console.log('Password reset attempt for username:', username);
    
    if (!username || !newPassword) {
      console.log('Reset failed: Missing data');
      return res.status(400).json({ error: 'Username and new password are required' });
    }
    
    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('username', username);
    
    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: 'Failed to reset password' });
    }
    
    console.log('Password reset successful for user:', username);
    res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

app.get('/api/settings', async (req, res) => {
  const theme = await getSetting('theme') || 'dark-blue';
  const color = await getSetting('customThemeColor') || '#5e258a';
  
  // Get user data from users table
  const { data: user, error } = await supabase
    .from('users')
    .select('username, password')
    .limit(1)
    .single();
  
  const username = user?.username || 'Mr and Mrs Pathania';
  const password = user?.password || '';
  
  res.json({ theme, customThemeColor: color, username, password });
});

app.post('/api/settings', async (req, res) => {
  try {
    const { theme, customThemeColor, username, password } = req.body || {};
    
    console.log('[POST /api/settings] Received settings update:', {
      theme,
      customThemeColor,
      username,
      hasPassword: password !== undefined,
      passwordLength: password ? password.length : 0
    });
    
    // Update theme settings
    if (theme !== undefined) {
      await setSetting('theme', theme);
      console.log('[POST /api/settings] Theme updated to:', theme);
    }
    if (customThemeColor !== undefined) {
      await setSetting('customThemeColor', customThemeColor);
      console.log('[POST /api/settings] Custom theme color updated to:', customThemeColor);
    }
    
    // Update user data in users table
    if (username !== undefined || password !== undefined) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();
      
      if (existingUser) {
        // Update existing user
        const updateData = {};
        if (username !== undefined) {
          updateData.username = username;
          console.log('[POST /api/settings] Updating username to:', username);
        }
        // CRITICAL: Only update password if it's explicitly provided and not empty
        if (password !== undefined && password !== null && password !== '') {
          updateData.password = password;
          console.log('[POST /api/settings] Updating password (length):', password.length);
        } else if (password === '') {
          console.warn('[POST /api/settings] WARNING: Attempted to set empty password - IGNORING');
        }
        
        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', existingUser.id);
          
          if (error) throw error;
          console.log('[POST /api/settings] User data updated successfully');
        } else {
          console.log('[POST /api/settings] No user data to update');
        }
      } else {
        // Insert new user
        console.log('[POST /api/settings] Creating new user');
        const { error } = await supabase
          .from('users')
          .insert({
            username: username || 'Mr and Mrs Pathania',
            password: password || ''
          });
        
        if (error) throw error;
        console.log('[POST /api/settings] New user created');
      }
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('[POST /api/settings] Error saving settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
