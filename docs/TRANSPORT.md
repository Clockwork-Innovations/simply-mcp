# Transport Modes

Simply-MCP supports three transport modes for communicating with MCP clients.

## stdio (Default)

Standard input/output transport. Used by Claude CLI and Claude Desktop.

```typescript
import { createServer } from 'simply-mcp';

export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My server',
  // No port = stdio mode
});
```

```bash
npx simplymcp run server.ts
```

Client config (`~/.claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["simplymcp", "run", "/path/to/server.ts"]
    }
  }
}
```

## HTTP

HTTP server with JSON-RPC. Supports both stateless and stateful modes.

### Stateless (Default)

Each request is independent. Good for serverless deployments.

```typescript
export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My server',
  port: 3000,
  // stateful: false (default)
});
```

```bash
npx simplymcp run server.ts --port 3000
```

### Stateful (Sessions)

Maintains session state between requests. Requires SSE for notifications.

```typescript
export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My server',
  port: 3000,
  stateful: true,
});
```

Sessions are created automatically. Client must include session ID in subsequent requests.

### Authentication

HTTP mode supports API key authentication:

```typescript
export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My server',
  port: 3000,
  auth: {
    type: 'apiKey',
    headerName: 'X-API-Key',  // Default: 'Authorization'
    keys: [
      { name: 'admin', key: 'sk-admin-123', permissions: ['*'] },
      { name: 'reader', key: 'sk-read-456', permissions: ['read:*'] },
    ],
  },
});
```

For OAuth 2.1, see [advanced/OAUTH2.md](./advanced/OAUTH2.md).

## WebSocket

Bidirectional communication for real-time applications.

```typescript
export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My server',
  websocket: {
    port: 8080,
    heartbeatInterval: 30000,
    heartbeatTimeout: 60000,
    maxMessageSize: 10 * 1024 * 1024,  // 10MB
  },
});
```

## Priority

Configuration priority (highest to lowest):
1. CLI flags (`--port 3000`)
2. createServer() config (`port: 3000`)
3. Environment variables (`SIMPLY_MCP_PORT`)
4. Defaults (stdio)
