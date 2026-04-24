# Skills VFS — Deep Dive

`createSkill()` turns a server into a progressive-disclosure surface: an in-memory VFS mounted at `/skills/<slug>/` plus a single `skills_vfs` MCP tool for the agent to browse. Skill-member tools (`createTool({ skill })`) auto-hide from `tools/list` and are invoked through `skills_vfs "<alias> …"`.

Guiding principle: an agent that never touches skills pays **zero tokens** for them; one that does pays only for what it `cat`s.

## Why skills ≠ routers

| | `createRouter()` | `createSkill()` |
|---|------------------|-----------------|
| Shape | Tool namespace (`admin__deleteUser`) | Filesystem (`/skills/admin/SKILL.md`) |
| Discovery | `tools/list` enumerates the stub | Agent runs `ls /skills` on demand |
| Per-tool context cost | Parameter schema always visible | Hidden until `cat scripts/<alias>` |
| Best for | Grouping tools by namespace | Procedural tasks with docs + references + scripts |

Skills shine when the task has **procedure** (read doc → look up a value → invoke a tool with specific args). Routers shine when you just want namespacing.

## VFS layout

```
/skills/<slug>/
  SKILL.md                   from createSkill({ skill: '...' })
  <subResource-key>          from subResources: { 'env-matrix': '...' }
  references/<resource.name> from references: [createResource({...})]
  scripts/<bash.alias>       from scripts: [createTool({ bash: { alias } })]
```

- `slug` is the skill's `name` field (not sanitized — use snake_case).
- `subResources` land **at the skill root**, not under `references/`. Use the path you actually want the agent to `cat`.
- `references/<name>` collides last-writer-wins against a `subResources['<name>']` at the root. Verbose mode warns on collisions.
- `scripts/<alias>` files are auto-rendered contracts derived from the tool's JSON Schema — you don't write them. Usage line is `${alias} ${paramNames.join(' ')}`.

## Pull vs push mode

The **pull-mode** (recommended) has the skill aggregate its own assets:

```typescript
const approvalCodes = createResource({ uri: '...', name: 'approval-codes', value: '...' });
const voidPayment = createTool({ skill: 'payment_void', bash: { alias: 'void-payment', ... }, ... });

createSkill({
  name: 'payment_void',
  references: [approvalCodes],  // ← pulled in by the skill
  scripts: [voidPayment],       // ← pulled in by the skill
});
```

The **push-mode** (declare ownership on the asset) also exists for tools:

```typescript
createTool({ skill: 'payment_void', bash: { alias: 'void-payment', ... }, ... });
// → auto-included in /skills/payment_void/scripts/void-payment
```

For tools, push-mode + pull-mode converge — either way the script lands. For resources, prefer pull-mode: a plain `createResource(...)` + `createSkill({ references: [...] })`. Push-mode on resources (`createResource({ skill })`) is typed but not currently forwarded by the adapter.

## Skill-membership auto-hide

`createTool({ skill: 'foo' })` sets `hidden: true` by default. The tool stays invocable (via `skills_vfs "<alias>"` or `tools/call` if the client knows the name) but disappears from `tools/list`. Dual-expose by setting `hidden: false` explicitly.

## skills_vfs

Single MCP tool registered when ≥1 skill exists. One `{ command: string }` parameter. Configurable name via the lower-level `registerBashShellTool` option (`toolName`).

### Supported builtins

| Builtin | Supported flags | Notes |
|---------|-----------------|-------|
| `pwd` | — | |
| `ls` | path arg | No `-l`, no `-a`, no `-R` |
| `cat` | path arg(s) | Multiple paths concatenate |
| `grep` | `-i` + pattern + path | No `-r`, no `-E`/`-P` |
| `find` | `-name <glob>` only | No `-type`, `-path`, `-maxdepth`, pipes |
| `cd` | path arg | Persists in stateful sessions |
| `head` | `-n <N>` + path | |
| `tail` | `-n <N>` + path | |

No pipes, no `&&`, no subshells. If the agent runs something unsupported, it sees a descriptive error and can try again.

### Alias dispatch

Any command name not in `BUILTINS` is matched against every registered tool's `bash.alias`. On match, `skills_vfs` calls `args(argv)` to map positional argv → the tool's param object, invokes the handler, and stringifies the result into stdout. Collisions with builtins are rejected at `addTool` time.

### cwd semantics

- **stdio / stateful HTTP**: long-lived closure — `cd` persists across calls.
- **stateless HTTP** (`stateful: false`): each request may hit a fresh instance, so the tool description tells the agent `cwd resets to /skills each call`. Absolute paths always work.

## Progressive disclosure

Two mechanisms, different tradeoffs:

- **`subResources`**: lazy resources under `skill://<slug>/<key>`. Registered only when the skill is invoked, followed by `notifications/resources/list_changed`. Good for heavy reference material.
- **`skillTools`**: lazy tools, same pattern with `notifications/tools/list_changed`. Good for specialist tools that shouldn't inflate the default `tools/list`.

Note: both require the client to honor MCP notifications. Most do, but the VFS-only path (`references/`, `scripts/`) is universally supported because it rides the static `skills_vfs` tool description, not notifications.

## Sampling hint

`createSkill({ sampling: { intelligencePriority } })` advises the client on model selection when the skill is invoked via `ctx.sample`. Range:

- 0–3 haiku (fast, cheap)
- 4–6 sonnet (balanced)
- 7–9 opus (complex reasoning)

Only meaningful when the client honors sampling priorities.

## Gotchas

- **`find` is `-name`-only.** If a trace shows the agent running `find . -type f`, it errors. Prompt authors should teach `ls -R` alternatives or `find . -name '*'`.
- **`subResources` keys double as filenames.** `'env-matrix'` produces `/skills/<slug>/env-matrix` (no extension). Set the key to the exact path you want.
- **Dynamic resource handlers are skipped** in `references`: only static `value` resources materialize into the VFS. Dynamic handlers still work via `resources/read`.
- **Orphan `bash:` aliases** (tool with `bash.alias` but no `skill:` membership) are not landed in any `/skills/<slug>/scripts/` — verbose mode warns. Give them a `skill:` or a standalone alias docs block.
- **Test fixtures need a freshly built dist.** `pnpm exec simply-mcp <fixture>` spawns a real subprocess — a stale `dist/` silently loads old skills code. Postbuild `link-local-bin.mjs` symlinks to the current build.

## Authoring SKILL.md for discovery

Less-prescriptive SKILL.md often outperforms step-by-step procedures. Mention **where** things live (`references/`, `scripts/`) and let the agent discover specifics via `ls`/`cat`. This is how a 6-turn procedural chain (find → cat SKILL.md → cat references → cat scripts → dispatch → success) emerges naturally instead of being hand-unrolled.

Example minimum-viable SKILL.md:

```markdown
# payment_void

Void a customer payment with a tier-specific approval code.

## When to use

The user reports a payment void for a specific `payment_id` and mentions the customer tier (STANDARD, PRO, ENTERPRISE).

## What you'll need

- The customer's approval code for their tier (`references/`).
- The call contract for the void alias (`scripts/`).

Browse those with `ls` and `cat`.

## Result

On success the shell prints `voided payment <id> with code <code>`.
```

## See also

- Live fixture: `packages/simply-mcp-ts-dev/examples/skills-vfs-demo/server.ts`
- Paradigm writeup: `plans/simply-mcp-skills-vfs/iskills-paradigm-notes.md`
- Bash shell implementation: `packages/simply-mcp-ts-dev/src/skills/bash-shell.ts`
