import { supabase } from './supabaseClient.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    const migrationPath = join(__dirname, 'migrations', 'add-category-affects-budget.sql');
    console.log('Reading migration file from:', migrationPath);
    const migrationSql = readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
        console.error('Error executing migration:', error);
    } else {
        console.log('Migration executed successfully.');
    }
}

runMigration();
