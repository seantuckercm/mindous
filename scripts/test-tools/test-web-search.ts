
/**
 * Test script for Web Search Tool
 */

import { executeWebSearch } from '@/lib/tools/web-search';

async function testWebSearch() {
  console.log('🔍 Testing Web Search Tool...\n');

  try {
    // Test 1: Basic search
    console.log('Test 1: Basic search');
    const result1 = await executeWebSearch({
      query: 'artificial intelligence trends 2024',
      max_results: 3
    });
    console.log('✅ Success!');
    console.log(`Found ${result1.results.length} results`);
    console.log('First result:', result1.results[0]?.title);
    console.log();

    // Test 2: News search with time range
    console.log('Test 2: News search with time range');
    const result2 = await executeWebSearch({
      query: 'AI breakthrough',
      max_results: 3,
      search_type: 'news',
      time_range: 'week'
    });
    console.log('✅ Success!');
    console.log(`Found ${result2.results.length} news results`);
    console.log();

    // Test 3: Domain filtering
    console.log('Test 3: Domain filtering');
    const result3 = await executeWebSearch({
      query: 'machine learning',
      max_results: 3,
      include_domains: ['arxiv.org', 'github.com']
    });
    console.log('✅ Success!');
    console.log(`Found ${result3.results.length} results from specific domains`);
    console.log();

    // Test 4: Caching
    console.log('Test 4: Testing cache');
    const result4 = await executeWebSearch({
      query: 'artificial intelligence trends 2024',
      max_results: 3
    });
    console.log(result4.cached ? '✅ Result from cache!' : '❌ Not cached');
    console.log();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWebSearch().then(() => {
  console.log('✅ All Web Search tests completed!');
  process.exit(0);
});
