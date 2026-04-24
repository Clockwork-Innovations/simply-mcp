/**
 * Code Execution Mode Example
 *
 * Demonstrates the QuickJS sandbox for secure code execution.
 * AI models write JavaScript/TypeScript code that calls your tools.
 *
 * Key features:
 * - Tools execute in QuickJS (WebAssembly) sandbox
 * - Optional network whitelist for external APIs
 * - Progressive disclosure with getFunctions()
 * - Environment variable injection
 *
 * Run: npx simplymcp run examples/code-execution.ts
 * Lint: npx simplymcp lint examples/code-execution.ts
 */

import { createServer, createTool } from 'simply-mcp';

// ============================================================================
// SERVER WITH CODE EXECUTION
// ============================================================================

export const server = createServer({
  name: 'code-execution-example',
  version: '1.0.0',
  description: 'Example server with code execution sandbox',

  // Code execution configuration
  codeExecution: {
    language: 'typescript',
    timeout: 10000, // 10 second timeout

    // Optional: Inject tools into sandbox
    introspectTools: true,

    // Optional: Environment variables available in sandbox
    env: {
      API_KEY: process.env.API_KEY || 'demo-key',
    },

    // Optional: Network access whitelist
    // network: {
    //   enabled: true,
    //   mode: 'whitelist',
    //   whitelist: {
    //     domains: ['api.example.com'],
    //     allowedMethods: ['GET', 'POST'],
    //     allowedProtocols: ['https'],
    //     timeout: 5000,
    //   },
    // },
  },

  // Optional: Hide all tools except code_executor
  // codeExecutionOnly: true,
});

// ============================================================================
// TOOLS (Available inside the sandbox)
// ============================================================================

// Simple calculation tool
export const calculateTool = createTool({
  description: 'Perform a calculation',
  params: {
    operation: {
      type: 'string',
      description: 'Operation to perform',
      enum: ['add', 'subtract', 'multiply', 'divide'],
    },
    a: { type: 'number', description: 'First operand' },
    b: { type: 'number', description: 'Second operand' },
  },
  handler: ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

// Data lookup tool
export const lookupTool = createTool({
  description: 'Look up data by key',
  params: {
    key: { type: 'string', description: 'Key to look up' },
  },
  handler: ({ key }) => {
    const data: Record<string, unknown> = {
      user_1: { name: 'Alice', role: 'admin' },
      user_2: { name: 'Bob', role: 'user' },
      config: { maxItems: 100, enabled: true },
    };
    const value = data[key];
    if (!value) throw new Error(`Key not found: ${key}`);
    return value;
  },
});

// Batch processing tool
export const batchProcessTool = createTool({
  description: 'Process multiple items',
  params: {
    items: {
      type: 'array',
      description: 'Items to process',
      items: { type: 'string', description: 'Item' },
    },
  },
  handler: ({ items }) => ({
    processed: items.length,
    results: items.map((item) => `processed:${item}`),
  }),
});

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * With code execution enabled, clients can write code like:
 *
 * ```javascript
 * // The AI writes this code, which runs in the sandbox
 * const calc1 = await calculate({ operation: 'add', a: 10, b: 5 });
 * const calc2 = await calculate({ operation: 'multiply', a: calc1.result, b: 2 });
 *
 * const user = await lookup({ key: 'user_1' });
 *
 * const batch = await batchProcess({
 *   items: ['item1', 'item2', 'item3']
 * });
 *
 * return {
 *   finalValue: calc2.result,
 *   user: user.name,
 *   batchResults: batch.results
 * };
 * ```
 *
 * Benefits:
 * - Multi-tool orchestration in single request
 * - Tool results stay in sandbox (PHI protection)
 * - Natural JavaScript control flow
 * - Structured output returned directly
 */
