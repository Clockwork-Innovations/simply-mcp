---
name: build-a-simply-mcp-server
description: Build Simply-MCP servers with createTool(), createResourceTemplate(), code execution mode, or MCP Apps. Use when creating MCP servers, testing tool handlers, writing simply-mcp test harnesses, building servers where AI composes tool calls into JavaScript, deploying MCP servers to Cloudflare Workers, or creating parameterized resources.
allowed-tools: Write, Read, Edit, Bash
---

# Simply-MCP Server Development

## Pattern selection

| Pattern | Use when | Tools exposed |
|---|---|---|
| `createServer()` + `createTool()` | Default — most servers | N tools |
| `createServer()` + `createApp()` | Tools returning interactive UI | N tools + UI resources |
| `createServer()` + `createSkill()` | Progressive disclosure via `/skills/<slug>/` VFS | 1 (`skills_vfs`) + N hidden |
| `createServer()` + `codeExecution` | AI composes multi-tool JS | 1 (`code_executor`) |
| `createTool()` + Python handler | ML, data, existing Python code | N tools (Python backend) |
| `createResourceTemplate()` | Parameterized URI resources | N resources |

## Deep-dive references (read on demand)

- `references/cli.md` — CLI commands, full option tables
- `references/auth.md` — API key, OAuth 2.1, OIDC, per-tool scopes
- `references/mcp-apps.md` — MCP Apps, HTML template, hybrid execution
- `references/skills-vfs.md` — `createSkill()`, skills_vfs builtins, VFS layout, progressive disclosure
- `references/code-execution.md` — Code execution, createType, resultType, typed stubs, sandbox filtering
- `references/python-handlers.md` — Python handlers (inline / script), options
- `references/test-harness.md` — Test patterns, mock backends, gotchas, templates
- `references/agent-sdk-testing.md` — Testing with the Anthropic Agent SDK
- `references/claude-code-desc-truncation.md` — Claude Code's 2KB MCP description cap: detect, patch, design around

## Working examples (copy and edit)

- `examples/minimal.ts` — smallest server, one tool
- `examples/complete.ts` — all factory functions wired together
- `examples/skill-playground.ts` — `createSkill()` + progressive disclosure
- `examples/code-execution.ts` — code_executor + createType stubs
- `examples/oauth-oidc.ts` — OAuth 2.1 + OIDC setup
- `examples/python-handlers.ts` — Python inline + script handlers
- `examples/oversized-description.ts` — reproducer for the Claude Code 2KB limit

---

## Minimal server

Components are auto-discovered from module exports. `name` is optional — inferred from the variable name.

import { createServer, createTool } from 'simply-mcp';

export const server = createServer({ name: 'my-server', version: '1.0.0' });

export const greet = createTool({
  description: 'Greet a user',
  params: {
    name: { type: 'string', description: '' },
    formal: { type: 'boolean', description: '', required: false },
  },
  handler: ({ name, formal }) => formal ? `Good day, ${name}.` : `Hey, ${name}`,
});

Run:

npx simply-mcp server.ts                           # stdio (Claude Desktop / Code / Cursor)
npx simply-mcp server.ts --transport http -p 3000  # HTTP
npx simply-mcp dev server.ts                       # HMR dev + inspector

Full CLI table → `references/cli.md`. Working server → `examples/minimal.ts`.

---

## createTool() — options

createTool({
  // Required
  description,                        // '' allowed when name + params self-document
  handler: (params, ctx) => Result,
  params: { [k]: { type, description, required? } },

  // Optional
  name,                               // defaults to variable name
  timeout,                            // handler ms
  annotations: { readOnlyHint?, destructiveHint?, idempotentHint?, openWorldHint?, requiresConfirmation?, category? },
  outputSchema,                       // MCP structured output (JSON Schema)
  resultType,                         // code-exec stub return type (string | TypeShape)
  hideCodeExecutionReturnType,
  requiredScopes,                     // OAuth scopes
  hidden,                             // hide from tools/list
  visibility,                         // ('model' | 'app')[]
  inputExamples,                      // Params[]
  skill,                              // skill membership (auto-hides, see Skills)
  bash: { alias, args: (argv) => Params },
  icons: [{ uri, mimeType }],
  task,                               // true | { ttl, pollInterval } — auto-wrap as background task
});

### Token-efficient definitions

| Element | `description: ''` when… | Add description when… |
|---|---|---|
| Tool | verb+noun (`pageClick`, `tabCreate`) | non-obvious behavior, side effects |
| Param | contextual name (`cellId`, `text`) | units (`ms`), format hint, edge cases |
| Enum | values self-explanatory | values are codes / abbreviations |

- Shared shapes: `createType('Name', { ... })` — types referenced once auto-inline into the signature.
- `resultType: { success: 'boolean' }` inline shorthand; `?` suffix = optional.
- `hideCodeExecutionReturnType: true` — for one-shot action tools whose return isn't composed.

Style deep-dive: `/writing-mcp-tools` skill. Working examples: `examples/code-execution.ts`.

---

## createServer() — options

createServer({
  // Required
  name, version,
  description,

  // Transport
  port,                                // enables HTTP/WS
  stateful,

  // Code execution (references/code-execution.md)
  codeExecution: { timeout, introspectTools, captureOutput, embedInstructionsInDescription, resultFormatter, descriptionSuffix, enableSandboxFilter, onSandboxToolsChanged, memoryLimitMB },
  codeExecutionOnly,

  // Token optimization
  annotationFilter,                    // 'none' | 'mcp-standard' | 'minimal' | 'all'
  inputExamples: { include, maxExamplesPerTool },
  systemPromptGeneration: { enabled, output: 'embed' | 'file' | 'both', style: 'compact' | 'verbose' },

  // Security (OWASP MCP Top 10 — secure defaults)
  host,                                // default '127.0.0.1'
  sanitizeOutput,                      // default false (opt-in; mangles legit `<IMPORTANT>`/`<|im_start|>`/`<system>` in markdown/transcripts)
  sanitizeDescriptions,                // default true
  schemaIntegrity,                     // SHA-256 pin schemas, default true
  secretScanning,                      // default false
  sessionBinding,                      // IP+UA fingerprint, default true

  // Capabilities
  capabilities: { extensions: { [vendor/ext]: { version } }, completions },

  // Router
  flattenRouters,
  minimalRouterDisclosure,
  hideRouterSubtools,

  // Auth (references/auth.md)
  auth: { type: 'apiKey' | 'oauth' | 'oidc', ... },

  // ChatGPT Apps compat
  openai: { widgetDomain, widgetCSP: { connect_domains }, fileParams },
});

---

## Handler context `ctx`

| `ctx.*` | Purpose | Available |
|---|---|---|
| `logger` | `debug`, `info`, `warn`, `error`, `notice`, `critical` | always |
| `progress(msg, opts?)` | progress with auto-increment | always |
| `task` | task handle (auto-injected) | tool has `task: true` |
| `reportProgress(n, total?, msg?)` | raw MCP progress | client sends progressToken |
| `createTask(params?)` | manual task creation | client supports tasks |
| `elicitInput(prompt, schema)` | structured input mid-handler | client supports elicitation |
| `sample(messages, opts?)` | LLM completion from client | client supports sampling |
| `readResource(uri)` | read a server resource | server has resources |
| `requestAppInput(data)` | send data to MCP App iframe | tool linked to `createApp()` |

---

## Errors

Throw `McpError` (typed code) or `Error`. Zod errors auto-format.

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
throw new McpError(ErrorCode.InvalidParams, 'id is required');
// Codes: InvalidParams, InvalidRequest, InternalError

## Pagination

`tools/list`, `resources/list`, `prompts/list` are cursor-paginated automatically. Custom lists: `applyPagination(items, cursor, 100)` from `simply-mcp/server/utils/pagination.js`.

---

## Skills VFS

`createSkill()` auto-mounts `/skills/<slug>/` and registers a single `skills_vfs` MCP tool. Tools with `skill: '<slug>'` auto-hide from `tools/list` — the agent reads `SKILL.md` and dispatches them via `skills_vfs "<alias> …"`. Zero-cost for agents that never touch the skill.

VFS layout:

/skills/<slug>/
  SKILL.md                      ← createSkill({ skill })
  <subResource-key>             ← createSkill({ subResources })
  references/<resource.name>    ← createSkill({ references })
  scripts/<bash.alias>          ← createSkill({ scripts }) — contract auto-rendered

### createSkill() — options

createSkill({
  // Required
  name,                                // snake_case
  description,
  skill,                               // inline markdown OR relative file path

  // Pull-mode
  references,                          // createResource()[] — static only
  scripts,                             // createTool()[] — with bash.alias
  subResources: { [key]: string },     // inline content OR file path

  // Progressive disclosure (level 4)
  skillTools,                          // tool names revealed after skill invoked

  // Sampling
  sampling: { intelligencePriority: 0-9, temperature },

  hidden,
});

### skills_vfs

Builtins: `pwd`, `ls`, `cat`, `grep`, `find` (`-name` only), `cd`, `head`, `tail`. No pipes, no `-type`, no `-R`. Non-builtin names match `bash.alias` on registered tools and dispatch through the handler.

- stdio + stateful HTTP: `cd` persists across calls in the session
- stateless HTTP: cwd resets each call (described in the tool description)

End-to-end example → `examples/skill-playground.ts`. Deep dive → `references/skills-vfs.md`.

---

## Other factory functions

Signatures only — full examples in `examples/complete.ts`.

createResource({ uri, name, description, mimeType, value | handler, hidden?, skill? });
createResourceTemplate({ uriTemplate, name, description, mimeType, handler });  // handler({ uriTemplate, params })
createPrompt({ name, description, args: { [k]: { type, description, required? } }, handler, hidden?, skill? });
createRouter({ name, description, tools, requiredScopes?, metadata? });         // namespaced as router__tool
createApp({ uri, name, source? | component? | buildDir? | remoteDom?, tools, size, css?, subscribable?, visibility?, domain?, csp?, permissions? });
createAgent({ name, description, systemPrompt, sampling, skills, tools, resources, prompts, maxHistoryLength, workflows });

Dynamic resource URIs extract `{paramName}` as typed params. MCP Apps auto-wire `_meta.ui.resourceUri` — no manual `_meta`. Deep dive → `references/mcp-apps.md`.

---

## CLI

| Command | Purpose |
|---|---|
| `simply-mcp <file>` | Run server (stdio default) — alias for `run` |
| `run` | Run server (stdio \| http \| http-stateless \| ws) |
| `dev` | HMR dev server with Vite + tunnels |
| `playground` | Web UI: tool sidebar, execution, MCP Apps renderer |
| `bundle` | Bundle for production (standalone \| cli \| bun \| bun-compile \| docker \| cloudflare) |
| `inspect` | Inspect code_executor description + stats |
| `run --dry-run` | Validate server (lint mode) |
| `list` \| `stop` \| `config` | Process / config management |
| `generate-metadata` | OAuth `.well-known` metadata (RFC 9728) |

npx simply-mcp server.ts                          # stdio
npx simply-mcp server.ts --transport http -p 3000 # HTTP
npx simply-mcp server.ts --watch                  # watch mode
npx simply-mcp server.ts --quick                  # production mode (NODE_ENV=production)
npx simply-mcp bundle server.ts                   # standalone (~500KB)
npx simply-mcp bundle server.ts -f cloudflare     # CF Workers ESM bundle
npx simply-mcp playground server.ts --open        # web UI

Full option tables → `references/cli.md`.

---

## Testing

`createTool()` returns `{ ...def, handler, __brand: 'createTool' }` — call `.handler(params)` for unit tests without MCP transport.

const result = await myTool.handler({ name: 'test' });

Playground (interactive): `npx simply-mcp playground server.ts --open`. Mock backends, harness templates, protocol tests → `references/test-harness.md`. Agent SDK integration tests → `references/agent-sdk-testing.md`.

---

## Config files

Auto-detected: `simplymcp.config.ts`, `.js`, `.mjs`, `.json`.

import { defineConfig } from 'simply-mcp';

export default defineConfig({
  defaultServer: 'main',
  servers: {
    main: { entry: './src/server.ts', transport: 'http', port: 3000, watch: true },
    worker: { entry: './src/worker.ts', transport: 'stdio' },
  },
  defaults: { transport: 'stdio', verbose: false },
});
