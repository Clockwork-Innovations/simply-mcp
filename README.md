<div align="center">
  <img src="https://raw.githubusercontent.com/clockwork-innovations/simply-mcp/main/resources/assets/simply-mcp-banner.png" alt="Simply MCP" width="100%">
</div>

# Simply MCP

> The fastest way to build MCP servers. Tell an AI what you need, or write it yourself.

[![npm version](https://badge.fury.io/js/simply-mcp.svg)](https://www.npmjs.com/package/simply-mcp)
[![License](https://img.shields.io/badge/License-Simply--MCP-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![MCP Compliance](https://img.shields.io/badge/MCP-Tier_1_Compatible-success.svg)](./COMPLIANCE.md)

---

## Tier 1 Compatible Framework

Simply-MCP is a **Tier 1 Compatible Community Framework**, providing 100% coverage of the Model Context Protocol specification (2025-11-25) and all active Standards Track SEPs.

- **SEP-1865 (MCP Apps)**: Native support for rich, interactive UIs.
- **SEP-1036 (URL Elicitation)**: Secure out-of-band user interaction.
- **SEP-1577 (Sampling)**: Advanced LLM sampling with tool-use and context support.
- **SEP-2339 (Tasks)**: Durable, asynchronous background operations.

View the full [Compliance Report](./COMPLIANCE.md).

---

## What You Can Build

<div align="center">
  <img src="https://raw.githubusercontent.com/Rifampin/simply-mcp/main/docs/assets/gallery/system-monitor.png" width="45%" alt="System Monitor">
  <img src="https://raw.githubusercontent.com/Rifampin/simply-mcp/main/docs/assets/gallery/map.png" width="45%" alt="Interactive Map">
</div>
<div align="center">
  <img src="https://raw.githubusercontent.com/Rifampin/simply-mcp/main/docs/assets/gallery/scenario-modeler.png" width="45%" alt="SaaS Scenario Modeler">
  <img src="https://raw.githubusercontent.com/Rifampin/simply-mcp/main/docs/assets/gallery/budget-allocator.png" width="45%" alt="Budget Allocator">
</div>

<p align="center">
  <strong>Real-time dashboards &bull; Interactive maps &bull; Financial modeling &bull; Data visualization</strong>
</p>

---

## Two Ways to Build

### Path 1: Let AI Build It (Recommended)

With [Claude Code](https://claude.ai/claude-code) or any AI coding tool:

```
> Build me an MCP server that monitors system resources
  and shows a real-time dashboard
```

The AI uses Simply-MCP's factory API to generate a complete, production-ready server. Iterate by describing what you want to change.

### Path 2: Write It Yourself

```typescript
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
});

export const addTool = createTool({
  description: 'Add two numbers',
  params: {
    a: { type: 'number', description: 'First number' },
    b: { type: 'number', description: 'Second number' },
  },
  handler: ({ a, b }) => ({ sum: a + b }),
});
```

```bash
npx simplymcp run server.ts            # Run (stdio for Claude)
npx simplymcp run server.ts --port 3000  # Run (HTTP)
```

Both paths produce the same thing: a type-safe MCP server with tools, resources, and optional UI.

---

## Install

```bash
npm install simply-mcp
```

The bare install pulls only the core MCP runtime (SDK, `zod`, `yargs`,
MCP Apps). Opt-in features are declared as **optional peer
dependencies** — install only the ones your server uses:

| Feature you use | Add |
|---|---|
| HTTP transport | `npm install hono @hono/node-server` |
| WebSocket transport | `npm install ws` |
| `.ts` server entries via the CLI | `npm install esbuild tsx` |
| Interface API (decorators / `IServer`) | `npm install typescript` |
| OAuth (bcrypt hashing) | `npm install bcrypt` |
| OAuth (Redis storage) | `npm install ioredis` |
| MCP Apps with React UI | `npm install @babel/standalone @remote-dom/core @remote-dom/react` |
| UI minification (production) | `npm install postcss cssnano html-minifier-terser terser` |
| HTML input sanitization | `npm install dompurify` |
| Code execution sandbox | `npm install quickjs-emscripten` |
| File-watch dev mode | `npm install chokidar` |
| Resource SQLite backend | `npm install better-sqlite3` |
| Express-router OAuth | `npm install express` |

Missing-peer errors point at the exact package to install.

---

## One Codebase. Multiple Platforms.

| Claude Desktop | ChatGPT | Your App |
|:--------------:|:-------:|:--------:|
| ✓ | ✓ | ✓ |

Write once. The OpenAI adapter is built-in.

---

## Features

| Feature | What it does |
|---------|--------------|
| **MCP Apps** | Rich UIs with React, Vue, or any framework |
| **OpenAI Compatible** | Same code deploys to ChatGPT |
| **Type Inference** | Define once, types flow everywhere |
| **Code Execution** | Sandboxed QuickJS for AI-generated code |
| **Python Handlers** | Mix TypeScript and Python in one server |
| **Multi-Transport** | stdio, HTTP, WebSocket — pick any |
| **Bundle Ready** | `npx simplymcp bundle` → single file |

---

## Why Simply-MCP?

```typescript
// The old way: schema, types, validation, handler — all separate
const schema = { name: 'add', inputSchema: { type: 'object', properties: { a: { type: 'number' } } } };
interface AddParams { a: number; b: number; }
// ...more boilerplate

// Simply-MCP: one definition, fully typed
export const addTool = createTool({
  description: 'Add two numbers',
  params: {
    a: { type: 'number', description: 'First' },
    b: { type: 'number', description: 'Second' },
  },
  handler: ({ a, b }) => ({ sum: a + b }),  // Fully typed!
});
```

---

## CLI

```bash
npx simplymcp lint server.ts             # Validate before running
npx simplymcp run server.ts              # Run (stdio)
npx simplymcp run server.ts --port 3000  # Run (HTTP)
npx simplymcp dev server.ts --port 3000  # Dev mode with hot reload
npx simplymcp bundle server.ts           # Bundle for production
```

---

## Claude Desktop Integration

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

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Quick Start](./docs/QUICK_START.md) | Get running in 5 minutes |
| [AI Workflow](./docs/AI_WORKFLOW.md) | Building servers with AI assistance |
| [API Reference](./docs/API_REFERENCE.md) | createServer, createTool, createResource, createApp |
| [CLI](./docs/CLI.md) | Full command reference |
| [Transport](./docs/TRANSPORT.md) | stdio, HTTP, WebSocket modes |
| [Code Execution](./docs/CODE_EXECUTION.md) | QuickJS sandbox for tool chaining |
| [Typed Tool Results](./docs/TYPED_TOOL_RESULTS.md) | Canonical `structuredContent` + `outputSchema` parsing contract |
| [Bundling](./docs/BUNDLING.md) | Production deployment |
| [Examples](./docs/EXAMPLES.md) | Annotated example index |
| [FAQ](./docs/FAQ.md) | Common questions |

---

## Examples

| Example | Description |
|---------|-------------|
| [minimal.ts](./examples/minimal.ts) | Absolute minimum (~20 lines) |
| [complete.ts](./examples/complete.ts) | All core features |
| [code-execution.ts](./examples/code-execution.ts) | Sandbox mode |

---

## License

Simply-MCP is free for non-commercial use (research, personal projects, education, evaluation). Commercial use requires a separate license. See [LICENSE](./LICENSE) for details.

For commercial licensing: [licensing@cwinnov.com](mailto:licensing@cwinnov.com)

---

[NPM](https://www.npmjs.com/package/simply-mcp) · [GitHub](https://github.com/Rifampin/simply-mcp) · [Issues](https://github.com/Rifampin/simply-mcp/issues)

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) by Anthropic.
