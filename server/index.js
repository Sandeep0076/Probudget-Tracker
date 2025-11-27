import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';
import { randomUUID, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Important for Docker
const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';

const ENC_KEY = (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);

const app = express();
const allowedOrigins = [
  'https://probudget-frontend.onrender.com',
  'http://localhost:3000', // Vite dev server (configured port)
  'http://localhost:5173', // Vite dev server (default port)
  'http://localhost:4173', // Vite preview server
];

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev
    process.env.FRONTEND_URL, // Northflank frontend URL
    /\.northflank\.app$/, // Allow all Northflank subdomains
    /\.code\.run$/ // Allow all Northflank code.run subdomains
  ],
  credentials: true
};

app.use(cors(corsOptions));
console.log('[CORS] Middleware configured to allow origins:', allowedOrigins);
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
  const normalized = typeof name === 'string' && name.length > 0
    ? name.trim().charAt(0).toUpperCase() + name.trim().slice(1)
    : name;
  let { data: label } = await supabase.from('labels').select('id').eq('name', normalized).single();
  if (label) return label.id;
  const { data: newLabel, error: insertError } = await supabase.from('labels').insert({ name: normalized }).select('id').single();
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

// Google integration helper functions removed

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
  console.log('[BULK] Received bulk transaction request');
  console.log('[BULK] Request body type:', typeof req.body);
  console.log('[BULK] Request body is array:', Array.isArray(req.body));
  console.log('[BULK] Request body length:', req.body?.length);

  try {
    const items = Array.isArray(req.body) ? req.body : [];
    console.log('[BULK] Processing', items.length, 'items');

    if (items.length === 0) {
      console.log('[BULK] No items to process, returning success');
      return res.json({ ok: true });
    }

    // Log first item for debugging
    if (items.length > 0) {
      console.log('[BULK] First item sample:', JSON.stringify(items[0]));
    }

    const transactions = items.map((item, index) => {
      const tx = {
        description: item.description,
        amount: toCents(item.amount),
        date: item.date,
        type: item.type,
        category: item.category,
        quantity: Math.round(item.quantity ?? 1),
        recurring_transaction_id: item.recurringTransactionId ?? null
      };
      console.log(`[BULK] Mapped transaction ${index + 1}:`, JSON.stringify(tx));
      return tx;
    });

    console.log('[BULK] Inserting', transactions.length, 'transactions into database');
    const { data: insertedTxs, error: txError } = await supabase
      .from('transactions')
      .insert(transactions)
      .select('id');

    if (txError) {
      console.error('[BULK] Database insert error:', txError);
      console.error('[BULK] Error details:', JSON.stringify(txError, null, 2));
      return res.status(500).json({ error: 'Failed to bulk insert transactions', details: txError.message });
    }

    console.log('[BULK] Successfully inserted', insertedTxs?.length, 'transactions');
    console.log('[BULK] Inserted transaction IDs:', insertedTxs.map(t => t.id));

    // Process labels with better error handling
    try {
      const labelPromises = items.flatMap((item, i) => {
        const labels = item.labels || [];
        if (labels.length === 0) {
          console.log(`[BULK] No labels for transaction ${i + 1}`);
          return [];
        }
        const transactionId = insertedTxs[i].id;
        console.log(`[BULK] Processing ${labels.length} labels for transaction ${transactionId}:`, labels);
        return labels.map(async (name) => {
          try {
            console.log(`[BULK] Upserting label: "${name}"`);
            const labelId = await upsertLabelIdByName(name);
            console.log(`[BULK] Label "${name}" has ID: ${labelId}`);
            return { transaction_id: transactionId, label_id: labelId };
          } catch (labelError) {
            console.error(`[BULK] Error upserting label "${name}":`, labelError);
            throw labelError;
          }
        });
      });

      if (labelPromises.length > 0) {
        console.log('[BULK] Awaiting', labelPromises.length, 'label upsert operations');
        const transactionLabels = await Promise.all(labelPromises);
        console.log('[BULK] Label associations to insert:', JSON.stringify(transactionLabels, null, 2));

        const { error: labelError } = await supabase.from('transaction_labels').insert(transactionLabels);
        if (labelError) {
          console.error('[BULK] Label insert error:', labelError);
          console.error('[BULK] Label error details:', JSON.stringify(labelError, null, 2));
          // Return error since labels are important
          return res.status(500).json({
            error: 'Failed to insert transaction labels',
            details: labelError.message,
            transactionsInserted: insertedTxs.length
          });
        } else {
          console.log('[BULK] Successfully inserted', transactionLabels.length, 'label associations');
        }
      } else {
        console.log('[BULK] No labels to process');
      }
    } catch (labelProcessError) {
      console.error('[BULK] Error processing labels:', labelProcessError);
      console.error('[BULK] Label process error stack:', labelProcessError.stack);
      return res.status(500).json({
        error: 'Failed to process transaction labels',
        message: labelProcessError.message,
        transactionsInserted: insertedTxs.length
      });
    }

    console.log('[BULK] Bulk transaction insert completed successfully');
    res.json({ ok: true, inserted: insertedTxs.length });
  } catch (error) {
    console.error('[BULK] Unexpected error in bulk transaction endpoint:', error);
    console.error('[BULK] Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
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
    .is('deleted_at', null) // Only get non-deleted tasks
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
    estimatedTime: t.estimated_time || null,
    taskType: t.task_type || 'todo', // Default to 'todo' if not set
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
    subtasks = [], estimatedTime = null, taskType = 'todo'
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  console.log('[POST /api/tasks] Creating task:', { title, status, priority, estimatedTime, taskType });

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title, notes, status, priority, all_day: allDay, start, end, due,
      repeat_json: repeat, color, estimated_time: estimatedTime, task_type: taskType
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

  // Google Sync disabled by user request
  // const oauth = await getOAuthClientWithTokens();
  // ... sync logic removed ...

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
    progress = existing.progress, estimatedTime = existing.estimated_time,
    taskType = existing.task_type || 'todo'
  } = req.body || {};

  console.log('[PUT /api/tasks/:id] Updating task:', { id, oldStatus: existing.status, newStatus: status, progress, estimatedTime });

  // Initialize progress to 0 when moving to in_progress if not already set
  let finalProgress = progress;
  if (status === 'in_progress' && existing.status !== 'in_progress') {
    // Task is being moved to in_progress for the first time
    if (finalProgress === undefined || finalProgress === null) {
      finalProgress = 0;
      console.log('[PUT /api/tasks/:id] Initializing progress to 0 for new in_progress task');
    }
  }

  // Prepare update data - using DATE format instead of timestamp
  const updateData = {
    title, notes, status, priority, all_day: allDay,
    start: start ? new Date(start).toISOString().split('T')[0] : start,
    end: end ? new Date(end).toISOString().split('T')[0] : end,
    due: due ? new Date(due).toISOString().split('T')[0] : due,
    repeat_json: repeat, color,
    updated_at: new Date().toISOString().split('T')[0], // DATE format
    progress: finalProgress,
    estimated_time: estimatedTime,
    task_type: taskType
  };

  // Set completed_at when task is marked as completed - using DATE format
  if (status === 'completed' && existing.status !== 'completed') {
    updateData.completed_at = new Date().toISOString().split('T')[0]; // DATE format
    console.log('[PUT /api/tasks/:id] Task marked as completed, setting completed_at:', updateData.completed_at);
    console.log('[PUT /api/tasks/:id] Auto-purge trigger will activate to clean up tasks completed >30 days ago');
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
    // Fallback: If 'progress' column is missing (migration hasn't run)
    if (updateError.code === 'PGRST204' && updateError.message.includes("'progress' column")) {
      console.warn('[PUT /api/tasks/:id] Progress column missing. Attempting auto-migration...');

      // 1. Try to auto-migrate
      const migrationSql = 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;';
      const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSql });

      if (!migrationError) {
        console.log('[PUT /api/tasks/:id] Auto-migration successful. Retrying update...');
        // 2. Retry original update
        const { error: retryError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id);

        if (!retryError) {
          console.log('[PUT /api/tasks/:id] Retry update successful');
          return res.json({ ok: true });
        }
        console.error('[PUT /api/tasks/:id] Retry update failed:', retryError);
      } else {
        console.error('[PUT /api/tasks/:id] Auto-migration failed (likely missing exec_sql function):', migrationError);
        console.warn('[PUT /api/tasks/:id] Please run this SQL in Supabase Dashboard: ' + migrationSql);
      }

      // 3. Fallback to updating without progress
      console.warn('[PUT /api/tasks/:id] Falling back to update without progress field...');
      const { progress, ...fallbackData } = updateData;
      const { error: fallbackError } = await supabase
        .from('tasks')
        .update(fallbackData)
        .eq('id', id);

      if (fallbackError) {
        console.error('[PUT /api/tasks/:id] Error updating task (fallback):', fallbackError);
        return res.status(500).json({ error: 'Failed to update task' });
      }
      console.log('[PUT /api/tasks/:id] Fallback update successful');
    } else {
      console.error('[PUT /api/tasks/:id] Error updating task:', updateError);
      return res.status(500).json({ error: 'Failed to update task' });
    }
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

  // Google Sync disabled by user request
  // const oauth = await getOAuthClientWithTokens();
  // ... sync logic removed ...

  res.json({ ok: true });
});

// Soft delete (move to Trashbox) - using DATE format
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  console.log('[DELETE /api/tasks/:id] Soft deleting task id:', id);
  // Ensure task exists
  const { data: existing, error: fetchErr } = await supabase.from('tasks').select('id, title, deleted_at').eq('id', id).single();
  if (fetchErr || !existing) {
    console.error('[DELETE /api/tasks/:id] Task not found for soft delete:', id, fetchErr);
    return res.status(404).json({ error: 'Task not found' });
  }
  if (existing.deleted_at) {
    console.warn('[DELETE /api/tasks/:id] Task already in trash:', id);
    return res.json({ ok: true, alreadyDeleted: true });
  }
  const today = new Date().toISOString().split('T')[0]; // DATE format
  const { error: updateErr } = await supabase.from('tasks').update({
    deleted_at: today,
    updated_at: today
  }).eq('id', id);
  if (updateErr) {
    console.error('[DELETE /api/tasks/:id] Failed soft delete:', updateErr);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
  console.log('[DELETE /api/tasks/:id] Task moved to trash:', id);
  res.json({ ok: true, trashedAt: today });
});

// Complete task and move to trash (one-step operation for checkbox completion)
app.post('/api/tasks/:id/complete-to-trash', async (req, res) => {
  const { id } = req.params;
  console.log('[POST /api/tasks/:id/complete-to-trash] Completing task and moving to trash:', id);
  
  const { data: existing, error: fetchErr } = await supabase.from('tasks').select('id, status, deleted_at').eq('id', id).single();
  if (fetchErr || !existing) {
    console.error('[POST /api/tasks/:id/complete-to-trash] Task not found:', id, fetchErr);
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (existing.deleted_at) {
    console.warn('[POST /api/tasks/:id/complete-to-trash] Task already in trash:', id);
    return res.status(400).json({ error: 'Task already in trash' });
  }
  
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const { error: updateErr } = await supabase.from('tasks').update({
    status: 'completed',
    deleted_at: today
  }).eq('id', id);
  
  if (updateErr) {
    console.error('[POST /api/tasks/:id/complete-to-trash] Failed to complete and trash task:', updateErr);
    return res.status(500).json({ error: 'Failed to complete and move task to trash' });
  }
  
  console.log('[POST /api/tasks/:id/complete-to-trash] Task completed and moved to trash:', id);
  res.json({ ok: true, completed: true, trashedAt: today });
});

// List trashed tasks (within retention window)
app.get('/api/tasks/trash', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, labels:task_labels ( label:labels (name) ), subtasks(*)`)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) {
    console.error('[GET /api/tasks/trash] Error fetching trash:', error);
    return res.status(500).json({ error: 'Failed to fetch trashed tasks' });
  }
  const out = data.map(t => ({
    ...t,
    labels: t.labels.map(l => l.label.name),
    allDay: t.all_day,
    repeat: t.repeat_json,
    gcalEventId: t.gcal_event_id,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    completedAt: t.completed_at,
    deletedAt: t.deleted_at,
    progress: t.progress !== null && t.progress !== undefined ? t.progress : 0,
    estimatedTime: t.estimated_time || null,
  }));
  res.json(out);
});

// Restore a soft-deleted task
app.post('/api/tasks/:id/restore', async (req, res) => {
  const { id } = req.params;
  console.log('[POST /api/tasks/:id/restore] Restoring task id:', id);

  const { data: existing, error: fetchErr } = await supabase.from('tasks').select('id, deleted_at, status').eq('id', id).single();
  if (fetchErr || !existing) {
    console.error('[POST /api/tasks/:id/restore] Task not found for restore:', id, fetchErr);
    return res.status(404).json({ error: 'Task not found' });
  }
  if (!existing.deleted_at) {
    console.warn('[POST /api/tasks/:id/restore] Task not in trash, no need to restore:', id);
    return res.json({ ok: true, notInTrash: true });
  }

  // Prepare update object
  const updateData = {
    deleted_at: null,
    updated_at: new Date().toISOString().split('T')[0] // DATE format
  };
  
  // If the task was completed, restore it to 'new' status (uncomplete it)
  if (existing.status === 'completed') {
    console.log('[POST /api/tasks/:id/restore] Task was completed, restoring to new status');
    updateData.status = 'new';
  }

  const { error: updateErr } = await supabase.from('tasks').update(updateData).eq('id', id);
  if (updateErr) {
    console.error('[POST /api/tasks/:id/restore] Failed restore:', updateErr);
    return res.status(500).json({ error: 'Failed to restore task' });
  }
  console.log('[POST /api/tasks/:id/restore] Task restored:', id);
  res.json({ ok: true });
});

// Permanently delete a trashed task (including related subtasks & labels)
app.delete('/api/tasks/:id/permanent', async (req, res) => {
  const { id } = req.params;
  console.log('[DELETE /api/tasks/:id/permanent] Permanently deleting task id:', id);
  const { data: existing, error: fetchErr } = await supabase.from('tasks').select('id, deleted_at').eq('id', id).single();
  if (fetchErr || !existing) {
    console.error('[DELETE /api/tasks/:id/permanent] Task not found:', id, fetchErr);
    return res.status(404).json({ error: 'Task not found' });
  }
  if (!existing.deleted_at) {
    console.warn('[DELETE /api/tasks/:id/permanent] Task not in trash (refusing).', id);
    return res.status(400).json({ error: 'Task must be in trash first' });
  }
  await supabase.from('subtasks').delete().eq('task_id', id);
  await supabase.from('task_labels').delete().eq('task_id', id);
  const { error: delErr } = await supabase.from('tasks').delete().eq('id', id);
  if (delErr) {
    console.error('[DELETE /api/tasks/:id/permanent] Delete failed:', delErr);
    return res.status(500).json({ error: 'Failed to permanently delete task' });
  }
  console.log('[DELETE /api/tasks/:id/permanent] Task permanently deleted:', id);
  res.json({ ok: true, permanent: true });
});

// Admin: Run Migration
app.post('/api/admin/run-migration', async (req, res) => {
  console.log('[ADMIN] Received request to run migration');
  try {
    const migrationPath = join(__dirname, 'migrations', 'add-task-progress.sql');
    console.log('[ADMIN] Reading migration file from:', migrationPath);

    let migrationSql;
    try {
      migrationSql = readFileSync(migrationPath, 'utf8');
    } catch (err) {
      console.error('[ADMIN] Failed to read migration file:', err);
      return res.status(500).json({ error: 'Migration file not found', details: err.message });
    }

    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[ADMIN] Found ${statements.length} statements to execute`);
    const results = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[ADMIN] Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);

      // Try using rpc 'exec_sql'
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`[ADMIN] Error executing statement ${i + 1}:`, error);
        results.push({ success: false, error: error.message, statement });
        // Continue or break? Let's continue to try other statements if possible, 
        // but usually migrations should be atomic. However, this is a patch.
      } else {
        console.log(`[ADMIN] Statement ${i + 1} success`);
        results.push({ success: true });
      }
    }

    res.json({ ok: true, results });
  } catch (error) {
    console.error('[ADMIN] Unexpected error running migration:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Purge tasks older than retention (30 days) - can be called manually or scheduled
app.post('/api/tasks/purge-old', async (req, res) => {
  const retentionDays = 30;
  console.log('[POST /api/tasks/purge-old] Purging tasks older than', retentionDays, 'days');
  const { error } = await supabase.rpc('purge_old_tasks');
  if (error) {
    // Fallback manual purge if RPC not defined - using DATE comparison
    console.warn('[POST /api/tasks/purge-old] RPC purge_old_tasks not available, running manual delete. Error:', error.message);
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);
    const cutoffDate = retentionDate.toISOString().split('T')[0]; // DATE format

    const { error: manualErr } = await supabase
      .from('tasks')
      .delete()
      .lt('deleted_at', cutoffDate)
      .not('deleted_at', 'is', null);
    if (manualErr) {
      console.error('[POST /api/tasks/purge-old] Manual purge failed:', manualErr);
      return res.status(500).json({ error: 'Failed to purge old trashed tasks' });
    }
    console.log('[POST /api/tasks/purge-old] Manual purge completed');
    return res.json({ ok: true, method: 'manual' });
  }
  console.log('[POST /api/tasks/purge-old] RPC purge_old_tasks executed');
  res.json({ ok: true, method: 'rpc' });
});

// Purge completed tasks older than 30 days - can be called manually
app.post('/api/tasks/purge-completed', async (req, res) => {
  const retentionDays = 30;
  console.log('[POST /api/tasks/purge-completed] Purging completed tasks older than', retentionDays, 'days');

  try {
    // Try using the RPC function first
    const { data, error } = await supabase.rpc('purge_old_completed_tasks');

    if (error) {
      // Fallback manual purge if RPC not defined
      console.warn('[POST /api/tasks/purge-completed] RPC purge_old_completed_tasks not available, running manual delete. Error:', error.message);
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retentionDays);
      const cutoffDate = retentionDate.toISOString().split('T')[0]; // DATE format

      // First get count of tasks to be deleted
      const { data: tasksToDelete, error: countErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .lt('completed_at', cutoffDate);

      if (countErr) {
        console.error('[POST /api/tasks/purge-completed] Error counting tasks to delete:', countErr);
        return res.status(500).json({ error: 'Failed to count completed tasks for purging' });
      }

      const taskIds = tasksToDelete.map(t => t.id);
      console.log('[POST /api/tasks/purge-completed] Found', taskIds.length, 'completed tasks to delete');

      if (taskIds.length > 0) {
        // Delete related records first
        await supabase.from('subtasks').delete().in('task_id', taskIds);
        await supabase.from('task_labels').delete().in('task_id', taskIds);

        // Delete the tasks
        const { error: deleteErr } = await supabase
          .from('tasks')
          .delete()
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .lt('completed_at', cutoffDate);

        if (deleteErr) {
          console.error('[POST /api/tasks/purge-completed] Manual purge failed:', deleteErr);
          return res.status(500).json({ error: 'Failed to purge old completed tasks' });
        }
      }

      console.log('[POST /api/tasks/purge-completed] Manual purge completed, deleted', taskIds.length, 'tasks');
      return res.json({ ok: true, method: 'manual', deleted: taskIds.length });
    }

    const deletedCount = data || 0;
    console.log('[POST /api/tasks/purge-completed] RPC purge_old_completed_tasks executed, deleted', deletedCount, 'tasks');
    res.json({ ok: true, method: 'rpc', deleted: deletedCount });

  } catch (err) {
    console.error('[POST /api/tasks/purge-completed] Unexpected error:', err);
    res.status(500).json({ error: 'Failed to purge completed tasks' });
  }
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

  // Convert dates to DATE format (YYYY-MM-DD)
  const startDate = start.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];
  const todayDate = today.toISOString().split('T')[0];

  let query = supabase.from('tasks');
  if (range === 'overdue') {
    query = query.select('*').not('due', 'is', null).lt('due', todayDate).order('due', { ascending: true });
  } else {
    query = query.select('*').or(`and(start.gte.${startDate},start.lte.${endDate}),and(due.gte.${startDate},due.lte.${endDate})`).order('start', { nullsFirst: true }).order('due', { nullsFirst: true });
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
      completedAt: completedAt ? new Date(completedAt).toISOString().split('T')[0] : null, // DATE format
      createdAt: new Date().toISOString().split('T')[0] // DATE format
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
  res.status(404).json({ error: 'Google Calendar integration removed' });
});

app.get('/api/calendar/callback', async (req, res) => {
  res.send('<html><body><p>Google Calendar integration has been removed.</p></body></html>');
});

app.get('/api/calendar/events', async (req, res) => {
  res.json([]);
});

app.get('/api/calendar/status', async (req, res) => {
  res.json({ connected: false });
});

app.post('/api/calendar/events', async (req, res) => {
  res.status(404).json({ error: 'Google Calendar integration removed' });
});

app.put('/api/calendar/events/:id', async (req, res) => {
  res.status(404).json({ error: 'Google Calendar integration removed' });
});

app.delete('/api/calendar/events/:id', async (req, res) => {
  res.status(404).json({ error: 'Google Calendar integration removed' });
});

app.put('/api/calendar/events/:id/toggle', async (req, res) => {
  res.status(404).json({ error: 'Google Calendar integration removed' });
});

app.get('/api/calendar/disconnect', async (req, res) => {
  await supabase.from('settings').delete().eq('key', 'gcal_tokens');
  res.json({ ok: true });
});

app.get('/api/google-tasks', async (req, res) => {
  res.json([]);
});

app.put('/api/google-tasks/:id/toggle', async (req, res) => {
  res.status(404).json({ error: 'Google Tasks integration removed' });
});

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

  await addActivity('UPDATE', `Updated overall budget for ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })} to $${Number(amount).toFixed(2)}.`);
  res.json({ ...data, amount: toEuros(data.amount) });
});

app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(500).json({ error: 'Failed to fetch categories' });
  // Map affects_budget to affectsBudget for frontend
  const out = data.map(c => ({
    ...c,
    affectsBudget: c.affects_budget !== false // Default to true if undefined
  }));
  res.json(out);
});

app.get('/api/labels', async (req, res) => {
  const { data, error } = await supabase.from('labels').select('id,name').order('name');
  if (error) return res.status(500).json({ error: 'Failed to fetch labels' });
  // Normalize capitalization in-memory (defensive in case legacy rows exist)
  const normalized = data.map(l => {
    if (!l.name) return l.name;
    return l.name.charAt(0).toUpperCase() + l.name.slice(1);
  });
  res.json(normalized);
});

app.post('/api/categories', async (req, res) => {
  const { name, type, affectsBudget = true } = req.body || {};
  const { data, error } = await supabase.from('categories').insert({ name, type, affects_budget: affectsBudget }).select().single();
  if (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
  await addActivity('CREATE', `Created new ${String(type).toLowerCase()} category: "${name}".`);
  res.json({ ...data, affectsBudget: data.affects_budget });
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { newName, oldName, affectsBudget } = req.body || {};

  const updateData = {};
  if (newName) updateData.name = newName;
  if (affectsBudget !== undefined) updateData.affects_budget = affectsBudget;

  const { error: catErr } = await supabase.from('categories').update(updateData).eq('id', id);
  if (catErr) return res.status(500).json({ error: 'Failed to update category' });

  if (newName && oldName && newName !== oldName) {
    const { error: txErr } = await supabase.from('transactions').update({ category: newName }).eq('category', oldName);
    if (txErr) console.error('Failed to update transactions category');

    const { error: budErr } = await supabase.from('budgets').update({ category: newName }).eq('category', oldName);
    if (budErr) console.error('Failed to update budgets category');

    await addActivity('UPDATE', `Updated category "${oldName}" to "${newName}".`);
  } else {
    await addActivity('UPDATE', `Updated category "${oldName || id}".`);
  }

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

app.put('/api/recurring/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, type, category, startDate, frequency = 'monthly', dayOfMonth, labels = [] } = req.body || {};

  const { data: existing, error: fetchError } = await supabase.from('recurring_transactions').select('description').eq('id', id).single();
  if (fetchError) {
    console.error('Error fetching recurring tx:', fetchError);
    return res.status(404).json({ error: 'Recurring transaction not found' });
  }

  const { error: updateError } = await supabase
    .from('recurring_transactions')
    .update({ description, amount: toCents(amount), type, category, start_date: startDate, frequency, day_of_month: dayOfMonth })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating recurring tx:', updateError);
    return res.status(500).json({ error: 'Failed to update recurring transaction' });
  }

  // Delete existing labels
  await supabase.from('recurring_transaction_labels').delete().eq('recurring_transaction_id', id);

  // Insert new labels
  if (labels.length > 0) {
    const labelIds = await Promise.all(labels.map(name => upsertLabelIdByName(name)));
    const recurringLabels = labelIds.map(label_id => ({ recurring_transaction_id: id, label_id }));
    await supabase.from('recurring_transaction_labels').insert(recurringLabels);
  }

  await addActivity('UPDATE', `Updated recurring transaction: "${description}".`);
  res.json({ id, description, amount, type, category, startDate, frequency, dayOfMonth, labels });
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

    const startDate = new Date(r.start_date);
    startDate.setUTCHours(0, 0, 0, 0);
    let cursor;
    if (lastTx) {
      const lastTxDate = new Date(lastTx.date);
      lastTxDate.setUTCHours(0, 0, 0, 0);
      // If the start_date was changed to an earlier date, use the start_date
      // Otherwise, start from the month after the last transaction
      if (startDate < lastTxDate) {
        cursor = new Date(startDate);
      } else {
        cursor = new Date(lastTxDate);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
    } else {
      cursor = new Date(startDate);
    }

    while (cursor <= today) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const day = Math.min(r.day_of_month, dim);
      const genDate = new Date(Date.UTC(year, month, day));
      genDate.setUTCHours(0, 0, 0, 0);

      // Generate if the date is today or in the past, and either:
      // - There's no last transaction, OR
      // - The generated date is after the last transaction date
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

  await addActivity('UPDATE', `Updated savings for ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })} to $${Number(amount).toFixed(2)}.`);
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

app.post('/api/sync-google', async (req, res) => {
  console.log('[SYNC] Starting Google Sync...');
  const oauth = await getOAuthClientWithTokens();
  if (!oauth) {
    console.log('[SYNC] Google not connected');
    return res.status(400).json({ error: 'Google account not connected' });
  }

  let createdCount = 0;
  let errors = [];

  try {
    // 1. Fetch Google Calendar Events (Past 30 days to Future 90 days)
    const calendar = google.calendar({ version: 'v3', auth: oauth });
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90);

    console.log('[SYNC] Fetching calendar events from', timeMin.toISOString(), 'to', timeMax.toISOString());
    const eventsRes = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    const events = eventsRes.data.items || [];
    console.log('[SYNC] Found', events.length, 'events');

    // 2. Fetch Google Tasks
    const tasksApi = google.tasks({ version: 'v1', auth: oauth });
    console.log('[SYNC] Fetching Google Tasks...');
    const tasksRes = await tasksApi.tasks.list({
      tasklist: '@default',
      showCompleted: true,
      showHidden: true,
    });
    const gtasks = tasksRes.data.items || [];
    console.log('[SYNC] Found', gtasks.length, 'tasks');

    // 3. Get existing IDs to avoid duplicates
    const { data: existingTasks, error: dbError } = await supabase
      .from('tasks')
      .select('gcal_event_id, gtask_id');

    if (dbError) throw dbError;

    const existingGcalIds = new Set(existingTasks.map(t => t.gcal_event_id).filter(Boolean));
    const existingGtaskIds = new Set(existingTasks.map(t => t.gtask_id).filter(Boolean));

    // 4. Import Events
    for (const event of events) {
      if (existingGcalIds.has(event.id)) continue;
      if (!event.start) continue; // Cancelled or invalid

      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      const allDay = !event.start.dateTime;

      // Convert to DATE format (YYYY-MM-DD)
      const startDate = start ? new Date(start).toISOString().split('T')[0] : null;
      const endDate = end ? new Date(end).toISOString().split('T')[0] : null;

      const newTask = {
        title: event.summary || '(No Title)',
        notes: event.description || '',
        status: 'new', // Events are usually 'scheduled', map to 'new'
        priority: 'medium',
        all_day: allDay,
        start: startDate,
        end: endDate,
        gcal_event_id: event.id,
        created_at: new Date().toISOString().split('T')[0], // DATE format
        updated_at: new Date().toISOString().split('T')[0]  // DATE format
      };

      const { error } = await supabase.from('tasks').insert(newTask);
      if (error) {
        console.error('[SYNC] Error importing event:', event.summary, error);
        errors.push(`Event: ${event.summary} - ${error.message}`);
      } else {
        createdCount++;
        existingGcalIds.add(event.id);
      }
    }

    // 5. Import Tasks
    for (const task of gtasks) {
      if (existingGtaskIds.has(task.id)) continue;
      if (!task.title) continue;

      const newTask = {
        title: task.title,
        notes: task.notes || '',
        status: task.status === 'completed' ? 'completed' : 'new',
        priority: 'medium',
        due: task.due ? new Date(task.due).toISOString().split('T')[0] : null, // DATE format
        gtask_id: task.id,
        created_at: new Date().toISOString().split('T')[0], // DATE format
        updated_at: new Date().toISOString().split('T')[0]  // DATE format
      };

      if (task.completed) {
        newTask.completed_at = new Date(task.completed).toISOString().split('T')[0]; // DATE format
      }

      const { error } = await supabase.from('tasks').insert(newTask);
      if (error) {
        console.error('[SYNC] Error importing task:', task.title, error);
        errors.push(`Task: ${task.title} - ${error.message}`);
      } else {
        createdCount++;
        existingGtaskIds.add(task.id);
      }
    }

  } catch (e) {
    console.error('[SYNC] Sync failed:', e);
    return res.status(500).json({ error: 'Sync failed', details: e.message });
  }

  console.log('[SYNC] Completed. Created', createdCount, 'new tasks.');
  res.json({ ok: true, created: createdCount, errors });
});

// Temporary endpoint to run migration via API
app.post('/api/admin/run-migration', async (req, res) => {
  console.log('[ADMIN] Request to run migration');
  try {
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const migrationPath = join(__dirname, 'migrations', 'add-task-progress.sql');

    console.log(`[ADMIN] Reading migration file: ${migrationPath}`);
    const migrationSql = readFileSync(migrationPath, 'utf8');

    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[ADMIN] Executing ${statements.length} statements`);

    const results = [];
    for (const statement of statements) {
      console.log(`[ADMIN] Executing: ${statement}`);
      // Try using the 'exec_sql' RPC if it exists (it seems to be used in run-migration.js)
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('[ADMIN] RPC exec_sql failed:', error);
        // Fallback: Try to just run it as a raw query if possible, but supabase-js doesn't support raw query easily without RPC.
        // However, the error might be because 'exec_sql' doesn't exist.
        results.push({ statement, error: error.message });
      } else {
        results.push({ statement, success: true });
      }
    }

    res.json({ ok: true, results });
  } catch (e) {
    console.error('[ADMIN] Migration failed:', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: Capitalize existing labels migration
app.post('/api/admin/migrate-capitalize-labels', async (req, res) => {
  console.log('[ADMIN] Running capitalize labels migration');
  try {
    const migrationPath = join(__dirname, 'migrations', 'capitalize-existing-labels.sql');
    let migrationSql;
    try {
      migrationSql = readFileSync(migrationPath, 'utf8');
    } catch (e) {
      console.error('[ADMIN] Could not read capitalize-existing-labels.sql:', e.message);
      return res.status(500).json({ error: 'Migration file not found' });
    }
    const statements = migrationSql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    const results = [];
    for (const statement of statements) {
      console.log('[ADMIN] Executing label migration statement:', statement.slice(0, 60) + (statement.length > 60 ? '...' : ''));
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.error('[ADMIN] Statement failed:', error.message);
        results.push({ statement, success: false, error: error.message });
      } else {
        results.push({ statement, success: true });
      }
    }
    res.json({ ok: true, results });
  } catch (e) {
    console.error('[ADMIN] Capitalize labels migration failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
