
/**
 * Test script for API Integration Tool
 */

import { executeAPIRequest, simpleGet } from '@/lib/tools/api-integration';

async function testAPIIntegration() {
  console.log('🌐 Testing API Integration Tool...\n');

  try {
    // Test 1: Simple GET request
    console.log('Test 1: Simple GET request');
    const result1 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    });
    console.log('✅ Success!');
    console.log('Status:', result1.status, result1.statusText);
    console.log('Title:', result1.data?.title);
    console.log('Duration:', result1.duration + 'ms');
    console.log();

    // Test 2: GET with query parameters
    console.log('Test 2: GET with query parameters');
    const result2 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      params: {
        userId: '1',
        _limit: '3'
      }
    });
    console.log('✅ Success!');
    console.log('Status:', result2.status);
    console.log('Results count:', result2.data?.length);
    console.log();

    // Test 3: POST request
    console.log('Test 3: POST request');
    const result3 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'POST',
      body: {
        title: 'Test Post',
        body: 'This is a test post from Mindous.ai',
        userId: 1
      }
    });
    console.log('✅ Success!');
    console.log('Status:', result3.status);
    console.log('Created ID:', result3.data?.id);
    console.log();

    // Test 4: Custom headers
    console.log('Test 4: Custom headers');
    const result4 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mindous.ai Test Agent'
      }
    });
    console.log('✅ Success!');
    console.log('Status:', result4.status);
    console.log();

    // Test 5: Error handling (404)
    console.log('Test 5: Error handling (404)');
    const result5 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts/99999',
      method: 'GET'
    });
    console.log('Success:', result5.success ? '✅' : '❌');
    console.log('Status:', result5.status);
    console.log('Error:', result5.error);
    console.log();

    // Test 6: Timeout handling
    console.log('Test 6: Timeout handling (may take a moment)');
    const result6 = await executeAPIRequest({
      url: 'https://httpstat.us/200?sleep=5000',
      method: 'GET',
      timeout: 2000
    });
    console.log('Success:', result6.success ? '✅' : '❌');
    console.log('Error:', result6.error);
    console.log();

    // Test 7: Helper function
    console.log('Test 7: Helper function (simpleGet)');
    const data = await simpleGet('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ Success!');
    console.log('User name:', data.name);
    console.log('User email:', data.email);
    console.log();

    // Test 8: Bearer token auth (mock)
    console.log('Test 8: Bearer token authentication');
    const result8 = await executeAPIRequest({
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      auth: {
        type: 'bearer',
        token: 'fake-token-for-testing'
      }
    });
    console.log('✅ Request sent with auth header');
    console.log('Status:', result8.status);
    console.log();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPIIntegration().then(() => {
  console.log('✅ All API Integration tests completed!');
  process.exit(0);
});
