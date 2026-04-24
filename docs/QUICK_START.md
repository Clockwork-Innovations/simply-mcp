# Quick Start

Get a working MCP server in under 5 minutes. Pick whichever path suits you.

## The AI Way (Recommended)

Open [Claude Code](https://claude.ai/claude-code) or any AI coding tool and describe what you want:

```
> Build me an MCP server that fetches weather data for a given city
  and returns temperature, humidity, and conditions
```

The AI will generate a complete server using Simply-MCP's factory API -- `createServer`, `createTool`, params with full type inference, and a handler. You get a working `.ts` file ready to run with `npx simplymcp run`.

From there, iterate. Ask for additional tools, resources, or a React UI. Each change stays within the same factory pattern, so the AI can modify your server without rewriting it. This is the fastest way to go from idea to running server.

## The Manual Way

### 1. Install

```bash
npm install simply-mcp
```

### 2. Create Your Server

Create `server.ts`:

```typescript
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'My first MCP server',
});

export const greetTool = createTool({
  description: 'Greet someone by name',
  params: {
    name: { type: 'string', description: 'Name to greet' },
  },
  handler: ({ name }) => `Hello, ${name}!`,
});
```

### 3. Validate

```bash
npx simplymcp lint server.ts
```

### 4. Run

```bash
npx simplymcp run server.ts              # stdio (for Claude Desktop)
npx simplymcp run server.ts --port 3000  # HTTP
```

### 5. Add to Claude Desktop

Edit `~/.claude/claude_desktop_config.json`:

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

Restart Claude Desktop to load your server.

## Next Steps

- **[API Reference](./API_REFERENCE.md)** -- All factory functions: createServer, createTool, createResource, createApp
- **[CLI](./CLI.md)** -- Full command reference for lint, run, dev, bundle
- **[AI Workflow](./AI_WORKFLOW.md)** -- Patterns for building and iterating with AI assistance
- **[Examples](../examples/)** -- Minimal, complete, and code-execution examples
