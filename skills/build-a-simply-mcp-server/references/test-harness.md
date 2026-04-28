# Test Harness for Simply-MCP Servers

## Table of Contents

- [Key Concepts](#key-concepts)
- [Implementation Steps](#implementation-steps)
- [Test Categories Checklist](#test-categories-checklist)
- [Common Gotchas](#common-gotchas)
- [Complete Harness Script Template](#complete-harness-script-template)
- [Full Mock Backend Template](#full-mock-backend-template)
- [Request Tracking and Validation](#request-tracking-and-validation)
- [Protocol-Level Testing](#protocol-level-testing)
- [Testing codeExecutionOnly Servers](#testing-codeexecutiononly-servers)
- [Multi-Server Patterns](#multi-server-patterns)
- [Working Examples](#working-examples)

---

## Key Concepts

`createTool()` returns `{ ...def, handler, __brand: 'createTool' }` — the handler is directly callable:

```typescript
const result = await myTool.handler({ param1: 'value' });
```

**Two testing levels:**

| Level | What it Tests | When to Use |
|-------|---------------|-------------|
| Handler tests | Tool business logic (HTTP calls, response parsing, error handling) | Always — validates the tool works correctly |
| Protocol tests | MCP transport (JSON-RPC, sessions, SSE) | Rarely — simply-mcp already tests this |

**Always prefer handler-level testing.** Protocol testing validates simply-mcp, not your tools.

## Harness Structure

```
tests/harness/
  {server-name}-harness.ts    # Standalone script (bun/tsx)
```

---

## Implementation Steps

### Step 0: Ensure simply-mcp is resolvable

MCP server files `import { createTool } from 'simply-mcp'` — but this package is resolved by the simply-mcp CLI at runtime, not installed via npm. For harness scripts that do a direct `import()`, you need a symlink:

```bash
# Check if it already exists
ls <project>/node_modules/simply-mcp 2>/dev/null

# If not, create it (points to local dev build)
ln -s /home/rifampin/cs-projects/packages/simply-mcp-ts-dev <project>/node_modules/simply-mcp
```

This is a live filesystem symlink — no caching, no staleness. Rebuilds of simply-mcp are picked up immediately.

### Step 1: Identify all tool handlers and their HTTP dependencies

Read the MCP server file. For each `createTool()`, note:
- Handler params and return type
- Backend endpoints called (apiGet/apiPost paths)
- Any local processing (regex, data transforms)

### Step 2: Create mock backend with canned responses

```typescript
const mockServer = Bun.serve({
  port: 0, // auto-assign
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/context')) {
      return Response.json({ context: 'Mock source text...' });
    }
    if (path.endsWith('/sources')) {
      return Response.json([
        { id: 's1', filename: 'doc.pdf', mimeType: 'application/pdf', selected: true, metadata: '{}' },
      ]);
    }
    // ... more routes

    return new Response('Not Found', { status: 404 });
  },
});
```

For Node.js (non-Bun) projects, use `http.createServer()` instead.

### Step 3: Set env vars before importing tools

Tools that use module-level constants from `process.env` must have env vars set before dynamic import:

```typescript
process.env.MY_BACKEND_URL = `http://localhost:${mockServer.port}`;
process.env.MY_SESSION_ID = 'test-session';

// Dynamic import AFTER env vars are set
const tools = await import('../../src/mcp-servers/my-server');
```

### Step 4: Write tests using test()/assert() framework

```typescript
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, duration: Date.now() - start, error });
    console.log(`  ✗ ${name} (${Date.now() - start}ms)`);
    console.log(`    → ${error}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
```

### Step 5: Test each handler

```typescript
// Zero-param tool
await test('get_context returns context string', async () => {
  const result = await tools.my_get_context.handler();
  assert(result.context !== undefined, 'Should have context field');
  assert(typeof result.context === 'string', 'Context should be string');
});

// Tool with params
await test('get_source forwards source_id', async () => {
  const result = await tools.my_get_source.handler({ source_id: 's1' });
  assert(result.id === 's1', 'Should return matching source');
});

// Tool with POST body
await test('search_sources posts query', async () => {
  const result = await tools.my_search.handler({ query: 'test' });
  assert(Array.isArray(result.results), 'Should return results array');
});

// Tool with computed logic
await test('fact_check computes supported verdict', async () => {
  const result = await tools.my_fact_check.handler({ claim: 'test claim' });
  assert(result.verdict === 'supported', `Expected supported, got ${result.verdict}`);
});
```

### Step 6: Test error handling

```typescript
await test('handles backend 500 error', async () => {
  errorMode = 500;
  try {
    await tools.my_tool.handler({ source_id: 's1' });
    assert(false, 'Should have thrown');
  } catch (err) {
    assert((err as Error).message.includes('500'), 'Should mention HTTP status');
  } finally {
    errorMode = null;
  }
});
```

### Step 7: Print summary and exit

```typescript
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n=== Summary ===`);
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed:');
  results.filter(r => !r.passed).forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  process.exit(1);
}
```

---

## Test Categories Checklist

For each tool, cover:
- [ ] Happy path — correct response shape
- [ ] Parameter forwarding — params reach the right endpoint
- [ ] POST body — request body is correctly constructed
- [ ] Optional params — behavior with/without optional fields
- [ ] Error handling — backend HTTP errors (400, 404, 500)
- [ ] Edge cases — empty results, missing fields, null values
- [ ] Computed fields — verdict logic, aggregations, transforms
- [ ] Local processing — regex extraction, data transforms (no HTTP)

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `Cannot find package 'simply-mcp'` | MCP server files import from `'simply-mcp'` but it's resolved by the simply-mcp CLI at runtime. Create a symlink: `ln -s /home/rifampin/cs-projects/packages/simply-mcp-ts-dev <project>/node_modules/simply-mcp`. Live symlink — no caching. |
| Env vars not picked up | Use dynamic `import()` after setting `process.env`, not static `import` at top |
| Module cached with wrong env | Each `bun test` file runs in separate process — no cross-file issue. For harness scripts, set env before any import |
| Mock server port conflict | Use `port: 0` for auto-assignment |
| Handler type errors | `createTool` handler param is `(params, context?)` — omit context in tests |
| Tools calling other tools | If tool A internally calls tool B's endpoint, mock both routes |

---

## Complete Harness Script Template

```typescript
#!/usr/bin/env bun
/**
 * {Server Name} MCP Tools Test Harness
 *
 * Validates tool handlers before providing them to an LLM.
 * Run: bun tests/harness/{server-name}-harness.ts
 */

// ============================================================================
// Test Framework
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, duration: Date.now() - start, error });
    console.log(`  ✗ ${name} (${Date.now() - start}ms)`);
    console.log(`    → ${error}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== {Server Name} Tools Test Harness ===\n');

  // 1. Start mock backend
  const mockServer = createMockBackend();
  const mockPort = mockServer.port;
  console.log(`Mock backend on port ${mockPort}\n`);

  // 2. Set env vars BEFORE import
  process.env.CLOCKWORK_BACKEND_URL = `http://localhost:${mockPort}`;
  process.env.CLOCKWORK_SESSION_ID = 'test-session';

  // 3. Dynamic import
  const tools = await import('../../src/mcp-servers/my-server');

  try {
    console.log('--- Tools ---');

    await test('get_context returns context', async () => {
      const result = await tools.my_get_context.handler();
      assert(result.context !== undefined, 'Missing context field');
    });

    // ... more tests ...

    console.log('\n--- Error Handling ---');

    await test('handles backend 500', async () => {
      errorMode = 500;
      try {
        await tools.my_get_context.handler();
        assert(false, 'Should have thrown');
      } catch (err) {
        assert((err as Error).message.includes('500'), 'Should mention status');
      } finally {
        errorMode = null;
      }
    });

  } finally {
    mockServer.stop();
  }

  // Summary
  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main().catch(err => {
  console.error('Harness error:', err);
  process.exit(1);
});
```

---

## Full Mock Backend Template

For tools that call a REST API backend, create a mock server that returns canned responses and optionally tracks requests for assertion.

```typescript
interface RequestLog {
  method: string;
  path: string;
  body: any;
  timestamp: number;
}

const requestLog: RequestLog[] = [];
let errorMode: number | null = null; // Set to HTTP status to force errors

function createMockBackend() {
  return Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // Parse body for POST requests
      let body: any = null;
      if (method === 'POST') {
        try {
          body = await req.json();
        } catch {}
      }

      // Log request
      requestLog.push({ method, path, body, timestamp: Date.now() });

      // Force error mode for error handling tests
      if (errorMode !== null) {
        return new Response('Simulated Error', { status: errorMode });
      }

      // Route handling — strip session prefix, match relative paths
      const sessionPattern = /\/api\/[^/]+\/[^/]+/;
      const relativePath = path.replace(sessionPattern, '');

      switch (true) {
        case relativePath === '/context' && method === 'GET':
          return Response.json({ context: 'Mock context...' });

        case relativePath === '/sources' && method === 'GET':
          return Response.json(MOCK_SOURCES);

        case /^\/sources\/[^/]+$/.test(relativePath) && method === 'GET': {
          const sourceId = relativePath.split('/').pop()!;
          const source = MOCK_SOURCES.find(s => s.id === sourceId);
          if (!source) return new Response('Not Found', { status: 404 });
          return Response.json({ ...source, extractedText: `Text for ${source.filename}` });
        }

        case relativePath === '/search' && method === 'POST':
          return Response.json({
            results: [{
              sourceId: 's1',
              filename: 'report.pdf',
              snippets: `Match for "${body?.query}": ...passage...`,
            }],
          });

        default:
          return new Response('Not Found', { status: 404 });
      }
    },
  });
}
```

---

## Request Tracking and Validation

Track all requests to the mock backend for fine-grained assertions:

```typescript
const requestLog: Array<{ method: string; path: string; body: any }> = [];

// In mock server fetch handler:
requestLog.push({ method, path, body });

// In tests:
await test('find_evidence splits comma-separated source_ids', async () => {
  requestLog.length = 0; // Clear log

  await tools.my_find_evidence.handler({
    assertion: 'test claim',
    source_ids: 'id1, id2, id3',
  });

  const req = requestLog.find(r => r.path.includes('/find-evidence'));
  assert(req !== undefined, 'Should have made find-evidence request');
  assert(Array.isArray(req!.body.source_ids), 'source_ids should be array');
  assert(req!.body.source_ids.length === 3, 'Should have 3 source IDs');
  assert(req!.body.source_ids[0] === 'id1', 'First ID should be trimmed');
});
```

---

## Protocol-Level Testing

When you need to validate MCP protocol behavior (not just handler logic), spawn the server as a subprocess and communicate via JSON-RPC.

### HTTP Transport Client

```typescript
class HttpMCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private requestId = 1;

  constructor(private port: number, private timeout = 30000) {
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  async send(method: string, params?: unknown): Promise<any> {
    const body = JSON.stringify({
      jsonrpc: '2.0', id: this.requestId++, method, params,
    });
    // POST to /mcp with session header
    // Parse SSE or JSON response
  }

  async initialize(): Promise<any> {
    return this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-harness', version: '1.0.0' },
    });
  }

  async listTools(): Promise<Array<{ name: string; description: string }>> {
    const resp = await this.send('tools/list', {});
    return resp.result?.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<any> {
    return this.send('tools/call', { name, arguments: args });
  }
}
```

### Stdio Transport Client

```typescript
import { spawn, ChildProcess } from 'child_process';

class StdioMCPClient {
  private process: ChildProcess | null = null;
  private requestId = 1;
  private pending = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';

  async start(serverPath: string): Promise<void> {
    this.process = spawn('bun', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    this.process.stdout?.on('data', (data) => {
      this.buffer += data.toString();
      // Parse newline-delimited JSON, resolve pending requests
    });
  }

  async send(method: string, params?: unknown): Promise<any> {
    const id = this.requestId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.process!.stdin!.write(
        JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'
      );
    });
  }
}
```

---

## Testing codeExecutionOnly Servers

For servers with `codeExecutionOnly: true`, the MCP layer exposes a single `code_executor` tool. To test via protocol:

```typescript
// Via protocol (spawned server)
const result = await client.callTool('code_executor', {
  code: 'newsroom_get_context()',
});
const text = result.result?.content?.[0]?.text;
assert(text.includes('context'), 'Should return context');

// Multi-tool composition
const composed = await client.callTool('code_executor', {
  code: `
    const sources = newsroom_list_sources();
    const context = newsroom_get_context();
    return { sourceCount: sources.length, hasContext: !!context.context };
  `,
});
```

**Prefer direct handler testing over protocol testing for codeExecutionOnly servers.** The code_executor is simply-mcp infrastructure — your handlers are what matter.

---

## Multi-Server Patterns

When testing a server that depends on another server:

```typescript
// Start dependency server first
const depServer = createDependencyMockServer();

// Start main server with dependency URL
process.env.DEP_SERVER_URL = `http://localhost:${depServer.port}`;
const tools = await import('./my-server');

// Test tools that internally call the dependency
await test('tool calls dependency server', async () => {
  const result = await tools.my_tool.handler({ input: 'test' });
  assert(result.fromDependency !== undefined, 'Should include dependency data');
});

// Cleanup
depServer.stop();
```

---

## Working Examples

| Harness | Location | Tools Tested |
|---------|----------|-------------|
| Newsroom tools | `clockwork-create-sdk/backend-ts/tests/harness/newsroom-tools-harness.ts` | 13 tools, 26 tests — source analysis, article/editor, entity extraction, error handling |
