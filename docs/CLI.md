# CLI Reference

Simply-MCP command line interface.

## Commands

### run

Start an MCP server.

```bash
npx simplymcp run <server.ts> [options]
```

| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed output |
| `--transport` | Transport mode: `stdio`, `http`, `http-stateless`, `ws` |
| `--port <n>` | Port for HTTP/WS transport |
| `--watch` | Restart on file changes |
| `--dry-run` | Validate without starting |

**Examples:**

```bash
# Start in stdio mode (for Claude CLI)
npx simplymcp run server.ts

# Start in HTTP mode
npx simplymcp run server.ts --transport http --port 3000

# Development with auto-reload
npx simplymcp run server.ts --watch
```

### bundle

Create production bundle.

```bash
npx simplymcp bundle <server.ts> [options]
```

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output file path |
| `-f, --format <fmt>` | Bundle format (see below) |
| `--sourcemap` | Generate source maps |
| `--http` | Enable HTTP transport |

**Bundle Formats:**

| Format | Output | Run command |
|--------|--------|-------------|
| `standalone` (default) | ESM JS (~500KB) | `node bundle.js` |
| `cli` | ESM JS (~50KB) | `npx simply-mcp run bundle.js` |
| `bun` | Bun-targeted ESM JS | `bun bundle.js` |
| `bun-compile` | Standalone binary (~57MB) | `./bundle` |
| `docker` | Docker package | `docker run` |

**Examples:**

```bash
# Default standalone bundle
npx simplymcp bundle server.ts -o dist/server.mjs

# Slim CLI bundle (smaller, requires simply-mcp at runtime)
npx simplymcp bundle server.ts -o dist/server.mjs -f cli

# Bun standalone binary
npx simplymcp bundle server.ts -o dist/server -f bun-compile

# Docker deployment
npx simplymcp bundle server.ts -o dist/ -f docker
```

### dev

Development mode with watch and hot reload.

```bash
npx simplymcp dev <server.ts> [options]
```

Equivalent to `run --watch`.

### playground

Interactive testing playground with web UI, tool execution, and MCP Apps rendering.

```bash
npx simplymcp playground <server.ts> [options]
npx simplymcp playground --url http://localhost:3000/mcp
```

| Option | Description |
|--------|-------------|
| `--port, -p` | Playground UI port (default: 4000) |
| `--url, -u` | Connect to an already-running MCP server |
| `--provider` | LLM provider (anthropic, openai) |
| `--model, -m` | LLM model name or alias |
| `--open, -o` | Open browser automatically |
| `--watch, -w` | Watch for file changes |
| `--verbose, -v` | Enable verbose logging |

**Features:**
- Tool sidebar with input forms and one-click execution
- MCP Apps (ext-apps) rendering inline via SEP-1865 protocol
- Tool result viewer with multi-execution tab bar
- LLM chat interface for conversational testing

**Examples:**

```bash
# Start from source file
npx simplymcp playground server.ts --open

# Connect to running server
npx simplymcp playground --url http://localhost:3000/mcp

# With LLM chat
npx simplymcp playground server.ts --provider anthropic --model sonnet
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG_SIMPLY_MCP=1` | Enable debug logging |
| `SIMPLY_MCP_PORT` | Default port for HTTP mode |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation error |
| 2 | Runtime error |
