/**
 * Minimal Simply-MCP Server
 *
 * The absolute minimum to get a working MCP server.
 * Run: npx simplymcp run examples/minimal.ts
 * Lint: npx simplymcp lint examples/minimal.ts
 */

import { createServer, createTool } from '../src/index.js';

// Server configuration using createServer()
export const server = createServer({
  name: 'minimal-server',
  version: '1.0.0',
  description: 'Minimal MCP server example',
});

// A simple tool using createTool() for full type inference
export const greetTool = createTool({
  description: 'Greet someone by name',
  params: {
    name: { type: 'string', description: 'Name to greet' },
  },
  handler: ({ name }) => `Hello, ${name}!`,
});
