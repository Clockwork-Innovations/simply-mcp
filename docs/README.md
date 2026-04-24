# Simply-MCP Documentation

Quick reference for building MCP servers with Simply-MCP.

## Core Guides

| Guide | Description |
|-------|-------------|
| [Quick Start](./QUICK_START.md) | Get from zero to working server in 5 minutes |
| [Interfaces](./INTERFACES.md) | Complete reference for createServer, createTool, createPrompt, etc. |
| [CLI](./CLI.md) | Commands: run, bundle, dev |
| [Transport](./TRANSPORT.md) | stdio, HTTP, WebSocket modes |
| [Bundling](./BUNDLING.md) | Production deployment |
| [UI Components](./UI_COMPONENTS.md) | Adding UIs to tools |
| [Testing](./TESTING.md) | Testing your server |

## Advanced Guides

| Guide | Description |
|-------|-------------|
| [OAuth2](./advanced/OAUTH2.md) | OAuth 2.1 authentication |
| [Code Execution](./advanced/CODE_EXECUTION.md) | Isolated sandbox mode |
| [MCP Apps](./advanced/MCP_APPS.md) | SEP-1865 rich UI spec |

## Quick Example

```typescript
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My MCP server',
});

export const greetTool = createTool({
  description: 'Greet someone',
  params: { name: { type: 'string', description: 'Name' } },
  handler: ({ name }) => `Hello, ${name}!`,
});

// Python handler (for ML/data processing)
export const analyzeTool = createTool({
  description: 'Analyze data with Python',
  params: { data: { type: 'array', items: { type: 'number' } } },
  handler: { type: 'python', code: 'RETURN({"sum": sum(ARGS["data"])})' },
});
```

```bash
npx simplymcp run server.ts
```
