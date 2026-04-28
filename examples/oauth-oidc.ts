/**
 * OIDC Resource Server Mode Example
 *
 * MCP server delegates authentication to an external OIDC provider (Google).
 * Tokens are verified locally via the provider's JWKS endpoint.
 *
 * Run: npx simplymcp run examples/oauth-oidc.ts
 *
 * Prerequisites:
 * - Configure Google OAuth: https://console.cloud.google.com/apis/credentials
 * - Set GOOGLE_CLIENT_ID environment variable
 */

import { createServer, createTool, createRouter } from '../src/index.js';

// Server with OIDC authentication (resource server only)
export const server = createServer({
  name: 'oidc-example',
  version: '1.0.0',
  description: 'MCP server with Google OIDC authentication',
  port: 3000,
  auth: {
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    resourceServerUrl: 'https://mcp.example.com',
    scopesSupported: ['openid', 'email', 'tools:read', 'tools:execute'],
    defaultToolScopes: ['openid'],
  },
  // Server-level scope patterns
  toolScopes: {
    'admin-*': ['tools:execute'],
  },
});

// Public tool — only requires default 'openid' scope
export const whoAmI = createTool({
  description: 'Show current user info from JWT claims',
  handler: () => 'User info from JWT token',
});

// Tool with explicit scope requirement
export const executeCode = createTool({
  description: 'Execute arbitrary code (requires elevated scope)',
  requiredScopes: ['tools:execute'],
  params: {
    code: { type: 'string', description: 'Code to execute' },
  },
  handler: ({ code }) => `Executed: ${code}`,
});

// Router with scope — all tools inherit 'tools:read'
export const readOnlyRouter = createRouter({
  requiredScopes: ['tools:read'],
  tools: [
    createTool({
      description: 'List available files',
      handler: () => ['file1.txt', 'file2.txt'],
    }),
    createTool({
      description: 'Read a file',
      params: { path: { type: 'string', description: 'File path' } },
      handler: ({ path }) => `Contents of ${path}`,
    }),
  ],
});
