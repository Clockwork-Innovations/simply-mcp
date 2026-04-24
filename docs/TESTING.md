# Testing

Validate and test your MCP server.

## Lint Validation

Quick validation without starting the server:

```bash
npx simplymcp lint server.ts
```

Output:
```
✓ Server: my-server v1.0.0
✓ Tools: 3
  • greet_tool
  • add_tool
  • delete_tool
✓ Prompts: 1
  • greeting
✓ Resources: 2
```

### Verbose Mode

Detailed validation with per-tool status:

```bash
npx simplymcp lint server.ts --verbose
```

Output:
```
✓ Server: my-server v1.0.0

Tools (3):
  ✓ greet_tool - Greet a user
  ✓ add_tool - Add two numbers
  ✓ delete_tool - Delete an item

Prompts (1):
  ✓ greeting - Generate a greeting

Resources (2):
  ✓ config://app - App configuration
  ✓ stats://server - Server statistics
```

## Unit Testing

Test tools directly:

```typescript
import { greetTool } from './server.js';

test('greetTool returns greeting', () => {
  const result = greetTool.handler({ name: 'Alice' });
  expect(result).toBe('Hello, Alice!');
});

test('greetTool with formal flag', () => {
  const result = greetTool.handler({ name: 'Alice', formal: true });
  expect(result).toBe('Good day, Alice');
});
```

## Integration Testing

Test the full server:

```typescript
import { spawn } from 'child_process';

test('server responds to tools/list', async () => {
  const proc = spawn('npx', ['simplymcp', 'run', 'server.ts']);

  // Send JSON-RPC request
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  }) + '\n');

  // Read response
  const response = await new Promise((resolve) => {
    proc.stdout.once('data', (data) => resolve(JSON.parse(data)));
  });

  expect(response.result.tools).toHaveLength(3);
  proc.kill();
});
```

## MCP Playground

For interactive testing with a web UI:

```bash
npx simplymcp playground server.ts --open
```

Features:
- Tool sidebar with input forms (type-aware: text, boolean, enum, object/array)
- One-click tool execution with results viewer
- MCP Apps (ext-apps) rendering inline via SEP-1865 protocol
- LLM chat interface for conversational testing
- Connect to running servers: `--url http://localhost:3000/mcp`

See [CLI Reference](./CLI.md#playground) for full options.

## MCP Pilot

For advanced testing (OAuth debugging, viewport emulation, multi-provider), use [MCP Pilot](../mcp-pilot/):

```bash
cd mcp-pilot && pnpm dev
```

Features:
- Visual tool testing
- Prompt inspection
- Resource browser
- OAuth debugging
