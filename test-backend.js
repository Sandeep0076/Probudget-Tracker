#!/usr/bin/env node

// Simple script to test backend connectivity
const backendUrl = 'https://port1--summerspends-backend--8yslcsphg2s8.code.run';

console.log('🔍 Testing backend connectivity...');
console.log('Backend URL:', backendUrl);

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${backendUrl}${endpoint}`;
  console.log(`\n📡 Testing ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://port1--summerspends--8yslcsphg2s8.code.run'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    
    return { status: response.status, text, headers: response.headers };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  
  // Test basic connectivity
  await testEndpoint('/api/health');
  
  // Test CORS
  await testEndpoint('/api/cors-test');
  
  // Test settings (the one failing)
  await testEndpoint('/api/settings');
  
  // Test login endpoint
  await testEndpoint('/api/auth/login', 'POST', {
    username: 'test',
    password: 'test'
  });
  
  console.log('\n✅ Testing complete!');
}

runTests().catch(console.error);
