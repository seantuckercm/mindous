
/**
 * Test script for Browser Automation Tool
 */

import { executeBrowserAutomation, scrapeWebsite, closeBrowser } from '@/lib/tools/browser-automation';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function testBrowserAutomation() {
  console.log('🌐 Testing Browser Automation Tool...\n');

  try {
    // Test 1: Navigate and extract basic info
    console.log('Test 1: Navigate and extract basic info');
    const result1 = await executeBrowserAutomation({
      action: 'navigate',
      url: 'https://example.com',
      waitForNetworkIdle: true
    });
    console.log('✅ Success!');
    console.log('Title:', result1.title);
    console.log('URL:', result1.url);
    console.log('HTML length:', result1.html?.length);
    console.log();

    // Test 2: Extract text
    console.log('Test 2: Extract text from page');
    const result2 = await executeBrowserAutomation({
      action: 'extract_text',
      url: 'https://example.com',
      selector: 'h1'
    });
    console.log('✅ Success!');
    console.log('Extracted text:', result2.text);
    console.log();

    // Test 3: Take screenshot
    console.log('Test 3: Take screenshot');
    const result3 = await executeBrowserAutomation({
      action: 'screenshot',
      url: 'https://example.com',
      fullPage: false
    });
    console.log('✅ Success!');
    console.log('Screenshot captured (base64 length):', result3.screenshot?.length);
    
    // Save screenshot to file
    if (result3.screenshot) {
      const screenshotPath = join(tmpdir(), 'mindous-test-screenshot.png');
      await writeFile(screenshotPath, result3.screenshot, 'base64');
      console.log('Screenshot saved to:', screenshotPath);
    }
    console.log();

    // Test 4: Extract structured data
    console.log('Test 4: Extract structured data');
    const result4 = await executeBrowserAutomation({
      action: 'extract_data',
      url: 'https://example.com',
      selectors: {
        heading: 'h1',
        paragraph: 'p',
        links: 'a'
      }
    });
    console.log('✅ Success!');
    console.log('Extracted data keys:', Object.keys(result4.data || {}));
    console.log('Heading:', result4.data?.heading?.text);
    console.log();

    // Test 5: Execute JavaScript
    console.log('Test 5: Execute JavaScript in browser');
    const result5 = await executeBrowserAutomation({
      action: 'evaluate',
      url: 'https://example.com',
      script: `
        const meta = Array.from(document.querySelectorAll('meta'))
          .map(m => ({
            name: m.getAttribute('name'),
            content: m.getAttribute('content')
          }))
          .filter(m => m.name);
        return { metaCount: meta.length, userAgent: navigator.userAgent };
      `
    });
    console.log('✅ Success!');
    console.log('Meta tags count:', result5.result?.metaCount);
    console.log('User agent:', result5.result?.userAgent?.substring(0, 50) + '...');
    console.log();

    // Test 6: Helper function - scrapeWebsite
    console.log('Test 6: Helper function - scrapeWebsite');
    const text = await scrapeWebsite('https://example.com', 'body');
    console.log('✅ Success!');
    console.log('Scraped text length:', text.length);
    console.log('First 100 chars:', text.substring(0, 100) + '...');
    console.log();

    // Test 7: Custom user agent
    console.log('Test 7: Custom user agent');
    const result7 = await executeBrowserAutomation({
      action: 'evaluate',
      url: 'https://example.com',
      userAgent: 'Mindous.ai Bot 1.0',
      script: 'navigator.userAgent'
    });
    console.log('✅ Success!');
    console.log('Custom user agent set:', result7.result?.includes('Mindous.ai'));
    console.log();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up browser instance
    console.log('Cleaning up browser...');
    await closeBrowser();
    console.log('✅ Browser closed');
  }
}

testBrowserAutomation().then(() => {
  console.log('\n✅ All Browser Automation tests completed!');
  process.exit(0);
});
