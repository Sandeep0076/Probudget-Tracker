import { supabase } from './supabaseClient.js';

const resetDatabase = async () => {
  try {
    // Truncate the transactions table
    const { error: truncateError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Placeholder to delete all

    if (truncateError) {
      console.error('Error truncating transactions:', truncateError.message);
      return;
    }
    console.log('Transactions table truncated.');

    // Truncate the recurring_transactions table
    const { error: recurringTruncateError } = await supabase
      .from('recurring_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Placeholder to delete all

    if (recurringTruncateError) {
      console.error('Error truncating recurring_transactions:', recurringTruncateError.message);
      return;
    }
    console.log('Recurring transactions table truncated.');

    // Truncate the activity table
    const { error: activityTruncateError } = await supabase
      .from('activity_log')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Placeholder to delete all

    if (activityTruncateError) {
      console.error('Error truncating activity:', activityTruncateError.message);
      return;
    }
    console.log('Activity table truncated.');

  } catch (error) {
    console.error('Error resetting database:', error.message);
  }
};

resetDatabase();