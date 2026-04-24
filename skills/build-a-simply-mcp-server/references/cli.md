# CLI Commands — Full Reference

## run [file..] — Run MCP servers

```bash
npx simply-mcp server.ts
```

| Option | Description |
|--------|-------------|
| `--transport` | `stdio` (default), `http`, `http-stateless`, `ws` |
| `--port, -p` | Port for HTTP/WS (default: 3000) |
| `--watch` | Watch files and auto-restart |
| `--watch-poll` | Use polling for file watching |
| `--watch-interval` | Polling interval in ms (default: 100) |
| `--ui-watch` | Hot reload UI resources |
| `--quick` | Production mode (NODE_ENV=production, faster startup) |
| `--inspect` | Enable Node.js inspector |
| `--inspect-brk` | Inspector + break on first line |
| `--inspect-port` | Inspector port (default: 9229) |
| `--fresh` | Clear caches before starting |
| `--dry-run` | Validate without starting |
| `--verbose` | Show detection details |
| `--config` | Path to config file |
| `--auto-install` | Auto-install dependencies (default: true) |
| `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` |
| `--force-install` | Force reinstall dependencies |

**Transport modes:**
- **stdio** (default): Standard I/O for Claude Desktop integration
- **http**: Stateful HTTP with session management
- **http-stateless**: Stateless HTTP (JSON-only, scalable, no sessions)
- **ws**: WebSocket (bidirectional, stateful)

Multi-server mode: `npx simply-mcp a.ts b.ts --transport http -p 3000`

---

## dev [entry] — HMR development server

```bash
npx simply-mcp dev server.ts --port 3000
```

| Option | Description |
|--------|-------------|
| `--port, -p` | MCP server port (default: 3000) |
| `--widget-dir, -w` | Widget directory (default: ./ui) |
| `--vite-port` | Vite dev server port (default: 5173) |
| `--tunnel, -t` | Tunnel: `ngrok`, `cloudflare`, `none` |
| `--with-vite` | Force enable Vite build watch |
| `--skip-vite` | Disable Vite build watch |
| `--vite-build-out-dir` | Vite output directory (default: dist) |
| `--no-inspector` | Disable Inspector preview |
| `--verbose, -v` | Verbose logging |
| `--open, -o` | Open Inspector in browser |

Features: Hot Module Replacement, Vite integration (auto-detected), Inspector preview, tunneling.

---

## bundle [entry] — Bundle for distribution

```bash
npx simply-mcp bundle server.ts -o dist/server.js
```

| Option | Description |
|--------|-------------|
| `-o, --output` | Output file path |
| `-f, --format` | `standalone` (default), `cli`, `bun`, `bun-compile`, `docker` |
| `-t, --target` | `node18`, `node20`, `node22` (default), `esnext` |
| `-e, --external` | Extra external packages (comma-separated) — rarely needed, see auto-externalization below |
| `--docker` | Create Docker-ready bundle (Dockerfile + package.json) |
| `-w, --watch` | Watch for changes |
| `--watch-restart` | Auto-restart server after rebuild |
| `--http` | Embed HTTP transport |
| `--http-stateless` | Embed stateless HTTP mode |
| `--assets` | Include assets (comma-separated) |
| `--deps-dir` | Shared directory for native dependencies |
| `--auto-install` | Auto-install dependencies |
| `--verbose` | Verbose output |

### Auto-externalization

The bundler automatically detects and externalizes packages that can't be inlined:

| Category | Detection | Examples |
|----------|-----------|---------|
| **Always external** | Hardcoded in `externals.ts` | `@modelcontextprotocol/sdk`, `zod`, `quickjs-emscripten` |
| **Native modules** | Known list + pattern matching (`@node-rs/*`, `node-*`, etc.) | `better-sqlite3`, `canvas`, `sharp` |
| **Heavy packages** | Known list (download large binaries) | `playwright`, `puppeteer`, `electron` |
| **esbuild two-pass** | `require-resolve-not-external` warnings (standalone/cli formats) | Packages using `require.resolve()` |
| **Bun retry** | Resolution failure → auto-externalize → retry (bun/bun-compile formats) | Transitive deps from `file:` links |

**You should NOT need `--external` for:**
- `@modelcontextprotocol/sdk` — always handled automatically
- `zod` — always handled (bun breaks Zod v4 module init order)
- Native modules — detected via known lists, patterns, and `.node` binary scanning
- Packages bun can't resolve — caught by retry logic

**When you DO need `--external`:**
- Custom packages with runtime-only dynamic imports the bundler can't detect
- Packages that bundle successfully but break at runtime (rare edge cases)

Auto-externalized packages are automatically added to sidecar dependencies and installed at bundle time.

### Docker format (`-f docker`)

| Option | Default | Description |
|--------|---------|-------------|
| `--agent-model` | `haiku` | Claude model: haiku, sonnet, opus |
| `--agent-system-prompt` | - | Path to system prompt file |
| `--agent-max-turns` | 10 | Max conversation turns |
| `--expose-port` | 8080 | Container port |
| `--health-endpoint` | true | Include /health endpoint |
| `--streaming` | true | Enable SSE streaming |
| `--compose` | false | Generate docker-compose.yml |

---

## inspect <file> — Inspect code_executor description

```bash
npx simply-mcp inspect server.ts
```

| Option | Description |
|--------|-------------|
| `--raw` | Print raw description without stats |
| `--json` | Output as JSON (length, tokens, flags) |

Loads the server, finds the `code_executor` tool, and prints its description with stats (char length, estimated tokens, `<types>`/`<functions>` presence, `any`/`unknown` detection). Useful for debugging description format and verifying token efficiency without starting an HTTP server.

---

## list — Show running servers

```bash
npx simply-mcp list
npx simply-mcp list --verbose    # Uptime, version, group info
npx simply-mcp list --json       # JSON output
npx simply-mcp list --cleanup    # Remove dead servers from registry
```

---

## stop [target] — Stop running servers

```bash
npx simply-mcp stop all              # Stop all
npx simply-mcp stop my-server        # By name
npx simply-mcp stop 12345            # By PID
npx simply-mcp stop -g group-id      # By group
npx simply-mcp stop all --force      # Force kill (SIGKILL)
```

---

## playground [entry] — Interactive testing UI

```bash
npx simply-mcp playground server.ts --open
npx simply-mcp playground --url http://localhost:3000/mcp
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

Starts a Hono + Vite + React web UI with:
- Tool sidebar with type-aware input forms and one-click execution
- MCP Apps (ext-apps) inline rendering via SEP-1865 protocol
- Tool result viewer with multi-execution tab bar
- LLM chat interface

Tools with linked `createApp()` show an "app" badge. After execution, the app HTML renders in a sandboxed iframe with full protocol support (tool calls back to server, size changes, link opening, logging).

---

## config init — Initialize configuration

```bash
npx simply-mcp config init                # Create TypeScript config file
npx simply-mcp config init -f json        # JSON format
npx simply-mcp config init -f js          # JavaScript format
```

Config formats: `simplymcp.config.ts`, `.js`, `.mjs`, `.json`

---

## generate-metadata — OAuth metadata (RFC 9728)

```bash
npx simply-mcp generate-metadata \
  --resource https://mcp.example.com \
  --auth-server https://accounts.google.com \
  --scopes "openid,email,tools:read" \
  --output .well-known/
```

| Option | Description |
|--------|-------------|
| `-r, --resource` | Resource server URL (required) |
| `-a, --auth-server` | Authorization server URL(s) (required) |
| `-s, --scopes` | Comma-separated scopes |
| `-o, --output` | Output directory |
| `--resource-name` | Human-readable name |
| `--resource-docs` | Documentation URL |
| `--issuer` | Issuer URL |
| `--cloudflare` | Generate Cloudflare headers |
| `--json` | JSON output |
