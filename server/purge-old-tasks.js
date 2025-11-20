#!/usr/bin/env node
// Script: purge-old-tasks.js
// Manually purge trashed tasks older than 30 days. Intended for cron/scheduler.
// Usage: node server/purge-old-tasks.js

import { supabase } from './supabaseClient.js';

(async () => {
  try {
    const retentionDays = 30;
    // Calculate cutoff date in DATE format (YYYY-MM-DD)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoff = cutoffDate.toISOString().split('T')[0]; // DATE format
    
    console.log('[PURGE SCRIPT] Purging tasks deleted before', cutoff);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .lt('deleted_at', cutoff)
      .not('deleted_at', 'is', null);

    if (error) {
      console.error('[PURGE SCRIPT] Error:', error);
      process.exit(1);
    }
    console.log('[PURGE SCRIPT] Completed purge');
    process.exit(0);
  } catch (e) {
    console.error('[PURGE SCRIPT] Unexpected error:', e);
    process.exit(1);
  }
})();
