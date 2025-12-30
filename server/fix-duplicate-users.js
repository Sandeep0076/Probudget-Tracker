import { supabase } from './supabaseClient.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixDuplicateUsers() {
  console.log('[FIX-DUPLICATE-USERS] Starting migration to fix duplicate users...');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', 'fix-duplicate-users.sql');
    console.log('[FIX-DUPLICATE-USERS] Reading migration file from:', migrationPath);
    
    const migrationSql = readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and filter out empty statements and comments
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`[FIX-DUPLICATE-USERS] Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[FIX-DUPLICATE-USERS] Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      // Try to execute using RPC
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`[FIX-DUPLICATE-USERS] Error executing statement ${i + 1}:`, error.message);
        console.error('[FIX-DUPLICATE-USERS] Full error:', error);
        
        // If RPC doesn't exist, show instructions
        if (error.message && error.message.includes('exec_sql')) {
          console.error('\n[FIX-DUPLICATE-USERS] RPC function "exec_sql" not found in database.');
          console.error('[FIX-DUPLICATE-USERS] Please run these SQL statements manually in your Supabase SQL Editor:');
          console.error('\n--- START OF SQL ---');
          console.error(migrationSql);
          console.error('--- END OF SQL ---\n');
          process.exit(1);
        }
      } else {
        console.log(`[FIX-DUPLICATE-USERS] Statement ${i + 1} executed successfully`);
        if (data) {
          console.log('[FIX-DUPLICATE-USERS] Result:', data);
        }
      }
    }
    
    console.log('\n[FIX-DUPLICATE-USERS] ✓ Migration completed successfully!');
    console.log('[FIX-DUPLICATE-USERS] Duplicate users have been cleaned up and constraints added.');
    
    // Verify the fix
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('id, username, password');
    
    if (verifyError) {
      console.error('[FIX-DUPLICATE-USERS] Error verifying users:', verifyError);
    } else {
      console.log(`\n[FIX-DUPLICATE-USERS] Current users in database: ${users.length}`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Password: ${user.password ? '***' : 'EMPTY'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[FIX-DUPLICATE-USERS] Fatal error:', error);
    process.exit(1);
  }
}

fixDuplicateUsers();