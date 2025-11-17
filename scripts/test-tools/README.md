
# Tool Test Scripts

This directory contains test scripts for all Mindous.ai agent tools.

## Running Tests

### Individual Tool Tests

```bash
# Web Search Tool
npx tsx scripts/test-tools/test-web-search.ts

# Code Execution Tool
npx tsx scripts/test-tools/test-code-execution.ts

# File Operations Tool
npx tsx scripts/test-tools/test-file-operations.ts

# API Integration Tool
npx tsx scripts/test-tools/test-api-integration.ts

# Browser Automation Tool
npx tsx scripts/test-tools/test-browser-automation.ts
```

### Run All Tests

```bash
npx tsx scripts/test-tools/test-all-tools.ts
```

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
TAVILY_API_KEY=your_tavily_api_key
```

## Test Coverage

### Web Search Tool (`test-web-search.ts`)
- ✅ Basic search
- ✅ News search with time range
- ✅ Domain filtering
- ✅ Caching functionality

### Code Execution Tool (`test-code-execution.ts`)
- ✅ Python code execution
- ✅ Node.js code execution
- ✅ Error handling
- ✅ Timeout handling
- ✅ Code validation

### File Operations Tool (`test-file-operations.ts`)
- ✅ Create directory
- ✅ Create file
- ✅ Read file
- ✅ Get metadata
- ✅ List files
- ✅ Search in files
- ✅ Directory tree
- ✅ Update file
- ✅ Delete file

### API Integration Tool (`test-api-integration.ts`)
- ✅ Simple GET request
- ✅ GET with query parameters
- ✅ POST request
- ✅ Custom headers
- ✅ Error handling
- ✅ Timeout handling
- ✅ Helper functions
- ✅ Authentication

### Browser Automation Tool (`test-browser-automation.ts`)
- ✅ Navigate and extract info
- ✅ Extract text
- ✅ Take screenshot
- ✅ Extract structured data
- ✅ Execute JavaScript
- ✅ Helper functions
- ✅ Custom user agent

## Expected Output

Each test should:
1. Print test descriptions
2. Show success/failure status
3. Display relevant output data
4. Exit with code 0 on success, 1 on failure

## Troubleshooting

### Web Search Tool
- **Issue:** Tests fail with "TAVILY_API_KEY not found"
- **Solution:** Add your Tavily API key to `.env.local`

### Code Execution Tool
- **Issue:** Python or Node.js not found
- **Solution:** Ensure Python 3 and Node.js are installed

### Browser Automation Tool
- **Issue:** Browser fails to launch
- **Solution:** Install Chromium dependencies or run in headless mode

### API Integration Tool
- **Issue:** Network timeouts
- **Solution:** Check internet connection or increase timeout values

## Contributing

When adding new tools, create corresponding test files:
1. Follow the existing test structure
2. Cover all main functionality
3. Include error cases
4. Update this README
