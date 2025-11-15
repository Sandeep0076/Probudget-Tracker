import { supabase } from './supabaseClient.js';

const addSecurityQuestion = async () => {
  try {
    console.log('Adding security question and answer to users table...');
    
    // First, check if user exists
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, username, password');
    
    if (selectError) {
      console.error('Error selecting users:', selectError.message);
      return;
    }
    
    if (users && users.length > 0) {
      // Update existing user with security question/answer
      const { error: updateError } = await supabase
        .from('users')
        .update({
          security_question: 'What is the name of your first teacher?',
          security_answer: 'Gita'
        })
        .eq('id', users[0].id);
      
      if (updateError) {
        console.error('Error updating user with security question:', updateError.message);
        return;
      }
      console.log('Successfully added security question and answer to existing user.');
    } else {
      // Create a new user with default values
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'Mr and Mrs Pathania',
          password: 'password123',
          security_question: 'What is the name of your first teacher?',
          security_answer: 'Gita'
        });
      
      if (insertError) {
        console.error('Error creating user:', insertError.message);
        return;
      }
      console.log('Successfully created new user with security question and answer.');
    }
    
    console.log('Security question setup completed!');
    
  } catch (error) {
    console.error('Error adding security question:', error.message);
  }
};

addSecurityQuestion();