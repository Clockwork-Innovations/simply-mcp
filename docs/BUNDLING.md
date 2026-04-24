# Bundling for Production

Create production-ready bundles for deployment.

## Quick Start

```bash
npx simplymcp bundle server.ts -o dist/server.mjs
```

## Bundle Formats

### standalone (Default)

Includes everything needed to run. No external dependencies.

```bash
npx simplymcp bundle server.ts -o dist/server.mjs
```

Run with:
```bash
node dist/server.mjs
```

### cli

Smaller bundle, requires the simply-mcp CLI at runtime.

```bash
npx simplymcp bundle server.ts -o dist/server.mjs -f cli
```

Run with:
```bash
npx simply-mcp run dist/server.mjs
```

Better for:
- Deployment with existing Node.js
- Smaller download sizes
- Docker images with shared node_modules

### bun

Bun-targeted ESM bundle. Requires the Bun runtime.

```bash
npx simplymcp bundle server.ts -o dist/server.js -f bun
```

Run with:
```bash
bun dist/server.js
```

### bun-compile

Standalone binary compiled with Bun. No runtime needed — all dependencies
(including the MCP SDK) are inlined into the binary.

```bash
npx simplymcp bundle server.ts -o dist/server -f bun-compile
```

Run with:
```bash
./dist/server
```

Uses a two-step build internally: first bundles all dependencies into a single
JS file (resolving deep imports through package export maps), then compiles
that file into a standalone binary. This ensures Bun's VFS contains all code
without runtime module resolution.

### docker

Docker-ready deployment package with Dockerfile and configuration.

```bash
npx simplymcp bundle server.ts -o dist/ -f docker
```

## Options

| Option | Description |
|--------|-------------|
| `-o, --output` | Output path |
| `-f, --format` | Bundle format: `standalone`, `cli`, `bun`, `bun-compile`, `docker` |
| `--sourcemap` | Generate source maps |

## Claude CLI Integration

Update config to use the bundle:

**Before (TypeScript source):**
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

**After (Production bundle):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/dist/server.mjs"]
    }
  }
}
```

## Docker Example

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY dist/server.mjs .

EXPOSE 3000
CMD ["node", "server.mjs"]
```

Build and run:
```bash
npx simplymcp bundle server.ts -o dist/server.mjs
docker build -t my-mcp-server .
docker run -p 3000:3000 my-mcp-server
```
