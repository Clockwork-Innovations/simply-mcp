# Code Execution Mode

Run AI-generated code in an isolated sandbox.

## Overview

Code execution mode lets AI models write JavaScript/TypeScript code that calls your tools. Benefits:

- **Multi-tool orchestration** - Compose tools in single request
- **PHI protection** - Tool results stay in sandbox, never sent to model
- **Token efficiency** - ~90% reduction in tools/list size
- **Structured output** - Code returns data directly

## Basic Setup

```typescript
import { createServer } from 'simply-mcp';

export const server = createServer({
  name: 'code-server',
  version: '1.0.0',
  description: 'Server with code execution',

  codeExecution: {
    language: 'typescript',    // or 'javascript'
    timeout: 10000,            // 10 second timeout
    introspectTools: true,     // Make tools available in sandbox
  },
});
```

## How It Works

1. Client receives `code_executor` tool
2. AI writes code that calls your tools
3. Code runs in QuickJS (WebAssembly) sandbox
4. Results returned directly (not to model context)

Example AI-generated code:
```javascript
// AI writes this, runs in sandbox
const user = await getUser({ id: '123' });
const orders = await getOrders({ userId: user.id });
const total = orders.reduce((sum, o) => sum + o.amount, 0);

return { user: user.name, orderCount: orders.length, total };
```

## Network Access

Enable controlled external API access:

```typescript
codeExecution: {
  network: {
    enabled: true,
    mode: 'whitelist',
    whitelist: {
      domains: ['api.example.com', '*.example.com'],
      urlPatterns: ['https://api.example.com/v1/*'],
      allowedMethods: ['GET', 'POST'],
      allowedProtocols: ['https'],
      maxConcurrentRequests: 5,
      maxResponseSize: 5 * 1024 * 1024,  // 5MB
      timeout: 5000,
    },
  },
},
```

## Environment Variables

Pass secrets to sandbox:

```typescript
codeExecution: {
  env: {
    API_KEY: process.env.API_KEY || '',
    API_URL: 'https://api.example.com',
  },
},
```

Access in sandbox:
```javascript
const response = await fetch(`${env.API_URL}/data`, {
  headers: { 'Authorization': `Bearer ${env.API_KEY}` },
});
```

## Code Execution Only Mode

Hide all tools except `code_executor`:

```typescript
export const server = createServer({
  name: 'phi-protected-server',
  version: '1.0.0',
  description: 'PHI-protected server',

  codeExecutionOnly: true,  // Only expose code_executor

  codeExecution: {
    introspectTools: true,  // Required
  },
});
```

Benefits:
- Tool results never return to model
- ~90% token reduction
- Natural batching
- Better for sensitive data (PHI, PII)

## Progressive Disclosure

Use `getFunctions()` for dynamic tool availability:

```typescript
codeExecution: {
  getFunctions: (context) => {
    // Return different tools based on context
    if (context?.metadata?.user?.isAdmin) {
      return ['getUser', 'deleteUser', 'getOrders'];
    }
    return ['getUser', 'getOrders'];
  },
},
```

## Execution Modes

Code execution uses a QuickJS WebAssembly sandbox by default. It works on Node.js, Bun, and Cloudflare Workers with ~50ms latency and full tool introspection.

### Cloudflare Workers

Deploy Cloudflare Workers with the default QuickJS mode. There is no separate
`codeExecution.mode = 'cloudflare'` runtime setting. The supported Worker path
is the Cloudflare bundle/runtime flow, which wires QuickJS for `workerd`.

#### Deploying as a Cloudflare Worker

Use the Cloudflare bundle path or a Worker-compatible fetch handler. The load-
bearing invariant is that code execution remains in QuickJS.

```typescript
// worker.ts
import { BuildMCPServer } from 'simply-mcp';
import { createWorkerHandler } from 'simply-mcp/worker';
import { z } from 'zod';

const server = new BuildMCPServer({
  name: 'my-mcp-server',
  version: '1.0.0',
  codeExecution: {
    mode: 'quickjs',
  },
});

server.addTool({
  name: 'query_db',
  description: 'Query a database',
  parameters: z.object({ sql: z.string() }),
  execute: async ({ sql }) => { /* ... */ },
});

const inner = createWorkerHandler(server, { stateful: true });

export default {
  async fetch(request: Request) {
    return inner.fetch(request);
  },
};
```

For production bundling, prefer the Cloudflare formatter/CLI path so the
Workers-native QuickJS WASM wiring is generated for you.

**Endpoints:**
- `POST /mcp` — MCP JSON-RPC endpoint
- `GET /health` — Health check (returns server info + tool/resource counts)

**`wrangler.jsonc`** — standard Worker deployment:
```jsonc
{
  "name": "my-mcp-server",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat_v2"]
}
```

## Security

The QuickJS sandbox provides:

- WASM boundary with 128MB memory limit
- No filesystem access
- Controlled network access via whitelist
- Timeout enforcement via interrupt handler
- Tool call isolation (results don't reach the model in `codeExecutionOnly` mode)
