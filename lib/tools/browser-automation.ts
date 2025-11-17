
import { type ToolManifest } from '@/db/schema';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Browser Automation Tool
 * Uses Puppeteer for browser automation, web scraping, and testing
 */
export const browserAutomationManifest: ToolManifest = {
  key: 'browser_automation',
  version: '1.0.0',
  description: 'Automate browser interactions, scrape websites, take screenshots, and extract structured data',
  inputSchema: {
    type: 'object',
    required: ['action', 'url'],
    properties: {
      action: {
        type: 'string',
        enum: ['navigate', 'screenshot', 'extract_text', 'extract_data', 'fill_form', 'click', 'evaluate'],
        description: 'Browser action to perform'
      },
      url: {
        type: 'string',
        format: 'uri',
        description: 'URL to navigate to'
      },
      selector: {
        type: 'string',
        description: 'CSS selector for element(s) to interact with'
      },
      selectors: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Multiple CSS selectors for structured data extraction'
      },
      formData: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Form data to fill (selector: value pairs)'
      },
      script: {
        type: 'string',
        description: 'JavaScript code to evaluate in the browser'
      },
      waitFor: {
        type: 'string',
        description: 'CSS selector or time (ms) to wait for before action'
      },
      timeout: {
        type: 'integer',
        minimum: 1000,
        maximum: 60000,
        default: 30000,
        description: 'Navigation/action timeout in milliseconds'
      },
      waitForNetworkIdle: {
        type: 'boolean',
        default: true,
        description: 'Wait for network to be idle before proceeding'
      },
      fullPage: {
        type: 'boolean',
        default: false,
        description: 'Capture full page screenshot'
      },
      userAgent: {
        type: 'string',
        description: 'Custom user agent string'
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the operation succeeded'
      },
      action: {
        type: 'string',
        description: 'Action performed'
      },
      text: {
        type: 'string',
        description: 'Extracted text content'
      },
      data: {
        description: 'Extracted structured data'
      },
      screenshot: {
        type: 'string',
        description: 'Base64 encoded screenshot'
      },
      html: {
        type: 'string',
        description: 'Page HTML content'
      },
      title: {
        type: 'string',
        description: 'Page title'
      },
      url: {
        type: 'string',
        description: 'Current page URL'
      },
      result: {
        description: 'Result of script evaluation'
      },
      error: {
        type: 'string',
        description: 'Error message if operation failed'
      }
    },
    required: ['success', 'action']
  },
  resources: {
    timeoutSec: 60,
    memMb: 1024,
    cpuShares: 512
  },
  container: {
    image: 'mindous/tool-browser-automation:1.0.0',
    cmd: ['node', 'index.js'],
    argsTemplate: ['--input', '/work/input.json', '--output', '/work/output.json']
  },
  permissions: {
    network: {
      enabled: true
    },
    filesystem: {
      tempDirMb: 512
    }
  }
};

export interface BrowserAutomationInput {
  action: 'navigate' | 'screenshot' | 'extract_text' | 'extract_data' | 'fill_form' | 'click' | 'evaluate';
  url: string;
  selector?: string;
  selectors?: Record<string, string>;
  formData?: Record<string, string>;
  script?: string;
  waitFor?: string;
  timeout?: number;
  waitForNetworkIdle?: boolean;
  fullPage?: boolean;
  userAgent?: string;
}

export interface BrowserAutomationOutput {
  success: boolean;
  action: string;
  text?: string;
  data?: any;
  screenshot?: string;
  html?: string;
  title?: string;
  url?: string;
  result?: any;
  error?: string;
}

let browserInstance: Browser | null = null;

/**
 * Execute browser automation tool
 */
export async function executeBrowserAutomation(
  input: BrowserAutomationInput
): Promise<BrowserAutomationOutput> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set user agent if provided
    if (input.userAgent) {
      await page.setUserAgent(input.userAgent);
    }

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to URL
    const navigationOptions: any = {
      timeout: input.timeout || 30000,
      waitUntil: input.waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded'
    };

    console.log('[Browser Automation] Navigating to:', input.url);
    await page.goto(input.url, navigationOptions);

    // Wait for selector or timeout if specified
    if (input.waitFor) {
      if (!isNaN(Number(input.waitFor))) {
        await page.waitForTimeout(Number(input.waitFor));
      } else {
        await page.waitForSelector(input.waitFor, { timeout: input.timeout });
      }
    }

    // Perform the requested action
    const result = await performAction(page, input);

    // Close the page
    await page.close();

    return {
      success: true,
      action: input.action,
      ...result
    };

  } catch (error: any) {
    console.error('[Browser Automation] Error:', error.message);

    if (page) {
      await page.close().catch(() => {});
    }

    return {
      success: false,
      action: input.action,
      error: error.message
    };
  }
}

/**
 * Perform the requested browser action
 */
async function performAction(page: Page, input: BrowserAutomationInput): Promise<any> {
  const { action, selector, selectors, formData, script, fullPage } = input;

  switch (action) {
    case 'navigate':
      return {
        title: await page.title(),
        url: page.url(),
        html: await page.content()
      };

    case 'screenshot':
      const screenshot = await page.screenshot({
        encoding: 'base64',
        fullPage: fullPage || false
      });
      return {
        screenshot,
        title: await page.title(),
        url: page.url()
      };

    case 'extract_text':
      if (!selector) {
        // Extract all text from page
        const text = await page.evaluate(() => document.body.innerText);
        return { text, title: await page.title(), url: page.url() };
      } else {
        // Extract text from specific element(s)
        const text = await page.$$eval(selector, (elements) =>
          elements.map(el => el.textContent?.trim() || '').join('\n')
        );
        return { text, title: await page.title(), url: page.url() };
      }

    case 'extract_data':
      if (!selectors || Object.keys(selectors).length === 0) {
        throw new Error('Selectors are required for extract_data action');
      }

      const data: Record<string, any> = {};
      
      for (const [key, sel] of Object.entries(selectors)) {
        try {
          // Try to get multiple elements first
          const values = await page.$$eval(sel, (elements) =>
            elements.map(el => ({
              text: el.textContent?.trim() || '',
              html: el.innerHTML,
              href: (el as HTMLAnchorElement).href || undefined,
              src: (el as HTMLImageElement).src || undefined
            }))
          );

          data[key] = values.length === 1 ? values[0] : values;
        } catch (error) {
          console.warn(`[Browser Automation] Failed to extract data for key "${key}":`, error);
          data[key] = null;
        }
      }

      return {
        data,
        title: await page.title(),
        url: page.url()
      };

    case 'fill_form':
      if (!formData || Object.keys(formData).length === 0) {
        throw new Error('Form data is required for fill_form action');
      }

      for (const [sel, value] of Object.entries(formData)) {
        await page.waitForSelector(sel, { timeout: 5000 });
        await page.type(sel, value);
      }

      return {
        title: await page.title(),
        url: page.url()
      };

    case 'click':
      if (!selector) {
        throw new Error('Selector is required for click action');
      }

      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);

      // Wait for navigation or timeout
      try {
        await page.waitForNavigation({ timeout: 3000, waitUntil: 'networkidle2' });
      } catch (error) {
        // Navigation might not occur, that's okay
      }

      return {
        title: await page.title(),
        url: page.url()
      };

    case 'evaluate':
      if (!script) {
        throw new Error('Script is required for evaluate action');
      }

      const evalResult = await page.evaluate(script);

      return {
        result: evalResult,
        title: await page.title(),
        url: page.url()
      };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('[Browser Automation] Launching browser...');
    
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    // Clean up on process exit
    process.on('exit', () => {
      if (browserInstance) {
        browserInstance.close();
      }
    });
  }

  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Helper function to scrape a website and extract text
 */
export async function scrapeWebsite(url: string, selector?: string): Promise<string> {
  const result = await executeBrowserAutomation({
    action: 'extract_text',
    url,
    selector,
    waitForNetworkIdle: true
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to scrape website');
  }

  return result.text || '';
}

/**
 * Helper function to take a screenshot
 */
export async function takeScreenshot(url: string, fullPage: boolean = false): Promise<string> {
  const result = await executeBrowserAutomation({
    action: 'screenshot',
    url,
    fullPage,
    waitForNetworkIdle: true
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to take screenshot');
  }

  return result.screenshot || '';
}
