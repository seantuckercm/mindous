# Mindous.ai Agent Tools

This directory contains the core tools that power the Mindous.ai agent's capabilities. Each tool is designed to be modular, secure, and easily extensible.

## 📚 Available Tools

### 1. Web Search Tool (`web-search.ts`)
**Purpose:** Search the web and retrieve relevant information

**Capabilities:**
- Real-time web search using Tavily API
- Support for general, news, and image searches
- Domain filtering (include/exclude)
- Time-range filtering for news
- Built-in caching to avoid duplicate searches
- Automatic fallback to mock data for development

**Usage Example:**
```typescript
import { executeWebSearch } from './web-search';

const results = await executeWebSearch({
  query: 'latest AI trends 2024',
  max_results: 5,
  search_type: 'news',
  time_range: 'week'
});
```

**Requirements:**
- `TAVILY_API_KEY` environment variable
- Get your API key at: https://tavily.com

---

### 2. Code Execution Tool (`code-execution.ts`)
**Purpose:** Execute Python and Node.js code in sandboxed environments

**Capabilities:**
- Execute Python 3 and Node.js code
- Capture stdout, stderr, and return values
- Configurable timeout (up to 5 minutes)
- Security validation to prevent dangerous code
- Automatic cleanup of temporary files
- Standard input support

**Usage Example:**
```typescript
import { executeCode } from './code-execution';

const result = await executeCode({
  code: `
    def fibonacci(n):
      if n <= 1: return n
      return fibonacci(n-1) + fibonacci(n-2)
    print(fibonacci(10))
  `,
  language: 'python',
  timeout: 30
});

console.log(result.stdout); // Output: 55
```

**Security Features:**
- Code validation for dangerous patterns
- Sandboxed execution environment
- File system access limited to temp directory
- Network access disabled
- Memory and output size limits

---

### 3. Enhanced File Operations Tool (`file-operations.ts`)
**Purpose:** Comprehensive file system operations

**Capabilities:**
- **CRUD Operations:** Create, read, update, delete files
- **Directory Operations:** Create directories, list contents, tree view
- **File Search:** Grep-like search with pattern matching
- **Binary File Support:** Base64 encoding for binary files
- **File Metadata:** Size, dates, type information
- **Tree Listing:** Recursive directory structure visualization

**Usage Examples:**
```typescript
import { executeFileOperation } from './file-operations';

// Read a file
const file = await executeFileOperation({
  operation: 'read',
  path: 'src/index.ts',
  projectPath: '/path/to/project'
});

// Search in files
const matches = await executeFileOperation({
  operation: 'search',
  path: 'src',
  projectPath: '/path/to/project',
  pattern: 'function.*async',
  maxDepth: 5
});

// Get directory tree
const tree = await executeFileOperation({
  operation: 'tree',
  path: 'src',
  projectPath: '/path/to/project',
  maxDepth: 3
});
```

---

### 4. API Integration Tool (`api-integration.ts`)
**Purpose:** Make HTTP requests to external APIs

**Capabilities:**
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, etc.)
- Multiple authentication methods:
  - Bearer token
  - API key
  - Basic auth
- Automatic retry with exponential backoff
- Request/response timeout handling
- Custom headers and query parameters
- Support for JSON, text, and binary responses

**Usage Example:**
```typescript
import { executeAPIRequest } from './api-integration';

const result = await executeAPIRequest({
  url: 'https://api.example.com/data',
  method: 'POST',
  body: { name: 'test', value: 123 },
  auth: {
    type: 'bearer',
    token: 'your-api-token'
  },
  timeout: 30000,
  retries: 3
});

console.log(result.data);
```

**Helper Functions:**
```typescript
import { simpleGet, simplePost } from './api-integration';

// Quick GET request
const data = await simpleGet('https://api.example.com/data');

// Quick POST request
const response = await simplePost(
  'https://api.example.com/create',
  { name: 'test' }
);
```

---

### 5. Browser Automation Tool (`browser-automation.ts`)
**Purpose:** Automate browser interactions and web scraping

**Capabilities:**
- Navigate to websites and extract content
- Take full-page or viewport screenshots
- Extract text from pages or specific elements
- Extract structured data with custom selectors
- Fill forms and submit data
- Click elements and interact with pages
- Execute custom JavaScript in the browser context
- Handle JavaScript-heavy websites
- Custom user agent support

**Usage Examples:**
```typescript
import { executeBrowserAutomation } from './browser-automation';

// Take a screenshot
const screenshot = await executeBrowserAutomation({
  action: 'screenshot',
  url: 'https://example.com',
  fullPage: true
});

// Extract structured data
const data = await executeBrowserAutomation({
  action: 'extract_data',
  url: 'https://example.com/products',
  selectors: {
    title: 'h1.product-title',
    price: '.product-price',
    images: 'img.product-image'
  }
});

// Fill and submit a form
await executeBrowserAutomation({
  action: 'fill_form',
  url: 'https://example.com/contact',
  formData: {
    '#name': 'John Doe',
    '#email': 'john@example.com',
    '#message': 'Hello!'
  }
});
```

**Helper Functions:**
```typescript
import { scrapeWebsite, takeScreenshot } from './browser-automation';

// Quick scraping
const text = await scrapeWebsite('https://example.com', '.content');

// Quick screenshot
const base64Image = await takeScreenshot('https://example.com', true);
```

---

### 6. Code Generation Tool (`code-generation.ts`)
**Purpose:** Generate code using AI/LLM

**Capabilities:**
- Generate various types of code (components, pages, APIs, utilities)
- Support for multiple languages (TypeScript, JavaScript, CSS, JSON, HTML)
- Framework-specific generation (React, Next.js, Vue, Svelte)
- Context-aware generation with project structure
- Multi-LLM support with routing

**Usage Example:**
```typescript
import { executeCodeGeneration } from './code-generation';

const result = await executeCodeGeneration({
  prompt: 'Create a React component for a user profile card',
  type: 'component',
  language: 'typescript',
  framework: 'react',
  context: {
    dependencies: ['react', 'tailwindcss'],
    additionalInstructions: 'Use Tailwind CSS for styling'
  }
});

console.log(result.code);
console.log(result.fileName); // e.g., UserProfileCard.tsx
```

---

## 🔧 Tool Registry

The `registry.ts` file provides a centralized registry for all tools:

```typescript
import { executeTool, getTool, getAllToolManifests } from './registry';

// Execute a tool by key
const result = await executeTool('web_search', {
  query: 'AI news',
  max_results: 5
});

// Get tool information
const tool = getTool('code_execution');
console.log(tool.manifest);

// List all available tools
const allManifests = getAllToolManifests();
```

## 🏗️ Tool Structure

Each tool follows a consistent structure:

```typescript
// 1. Tool Manifest - Defines the tool's schema
export const toolManifest: ToolManifest = {
  key: 'tool_name',
  version: '1.0.0',
  description: 'What the tool does',
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* JSON Schema */ },
  resources: { /* Resource requirements */ },
  permissions: { /* Security permissions */ }
};

// 2. Input/Output Types
export interface ToolInput {
  // Input parameters
}

export interface ToolOutput {
  // Output structure
}

// 3. Execution Function
export async function executeTool(
  input: ToolInput
): Promise<ToolOutput> {
  // Implementation
}
```

## 🔐 Security Considerations

### Code Execution
- Code is validated before execution
- Sandboxed environment with limited file system access
- Network access disabled by default
- Memory and output size limits
- Automatic timeout and cleanup

### Browser Automation
- Browser runs in headless mode with security flags
- No file downloads outside temp directory
- User agent can be customized for privacy
- Automatic cleanup of browser instances

### API Integration
- Sensitive data (API keys, tokens) should be in environment variables
- Request/response size limits
- Timeout protection
- Retry with backoff to prevent overwhelming APIs

### File Operations
- All paths are validated and restricted to project directory
- Hidden files excluded by default (can be enabled)
- Binary files handled separately with encoding
- File size checks for large files

## 📦 Dependencies

Core dependencies for the tools:
```json
{
  "@tavily/core": "^1.x",
  "puppeteer": "^21.x",
  "axios": "^1.x",
  "node-cache": "^5.x"
}
```

Install with:
```bash
npm install @tavily/core puppeteer axios node-cache
```

## 🔑 Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Tavily API for web search
TAVILY_API_KEY=your_tavily_api_key

# LLM providers (for code generation)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
```

## 🧪 Testing

Test scripts are available in `/scripts/test-tools/`. Run individual tool tests:

```bash
# Test web search
npm run test:tool:search

# Test code execution
npm run test:tool:code-exec

# Test file operations
npm run test:tool:files

# Test API integration
npm run test:tool:api

# Test browser automation
npm run test:tool:browser
```

## 🚀 Adding New Tools

To add a new tool:

1. Create a new file in `/lib/tools/` (e.g., `my-tool.ts`)
2. Define the tool manifest following the standard structure
3. Implement the execution function
4. Export from `/lib/tools/index.ts`
5. Register in `/lib/tools/registry.ts`
6. Add tests in `/scripts/test-tools/`
7. Update this README

## 📖 Best Practices

1. **Error Handling**: Always wrap tool execution in try-catch blocks
2. **Timeouts**: Set reasonable timeouts for all operations
3. **Logging**: Use console.log with prefixes (e.g., `[Tool Name]`)
4. **Cleanup**: Always clean up resources (files, browser instances, etc.)
5. **Validation**: Validate inputs before processing
6. **Caching**: Cache expensive operations when possible
7. **Security**: Never trust user input, always validate and sanitize

## 🤝 Contributing

When contributing new tools or improvements:

1. Follow the existing tool structure
2. Add comprehensive TypeScript types
3. Include detailed JSDoc comments
4. Write tests for all functionality
5. Update documentation
6. Consider security implications
7. Test with real-world scenarios

## 📝 License

Part of the Mindous.ai platform. All rights reserved.
