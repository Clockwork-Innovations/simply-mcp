# Claude Code 2KB description-limit gotcha

Claude Code truncates MCP tool `description` fields at **2048 chars** (hard-coded) starting v2.1.84. Past that boundary the client appends `…[truncated]` and the model only sees the prefix. The server sees no error — it just silently underperforms. Every Claude Code variant (terminal, desktop, IDE extension) inherits this.

Other clients (Claude Desktop, Cursor, Inspector) do NOT have this limit. The gotcha is specific to the Claude Code binary.

## When a simply-mcp server hits it

| Surface | Why it grows past 2KB | First-line mitigation |
|---|---|---|
| `code_executor` with `introspectTools: true` | Each dispatched tool's signature is inlined into the executor description | Split into routers/skills; patch CC if unavoidable |
| `skills_vfs` (created by `createSkill()`) | Tool description lists every alias + usage line | Patch CC; no in-framework knob |
| Long `createTool({ description })` | User authored; easy to blow past 2KB with examples | Move detail to a `resource://...` the agent `cat`s on demand |
| `createSkill({ skill: longMarkdown })` | Whole SKILL.md goes into the skill-tool description | Trim SKILL.md; rely on VFS `references/` for depth |

Token budget hint: aim for < 1500 chars on any single tool description to leave headroom for future growth.

## Detect — does this server trip the limit?

1. **Stats-only**: `simply-mcp inspect <server.ts>` prints description length + estimated token count for the `code_executor` tool (`--json` for scripting). If `length > 2048`, CC will truncate.
2. **Live check**: run the server and call `tools/list` through a minimal stdio client. If any `description` ends in `…[truncated]` CC is already cutting. Outside of CC (Inspector, Claude Desktop) you see the full description — useful for side-by-side.
3. **Reproducer**: `examples/oversized-description.ts` ships a server whose sole tool has a >2KB description so you can exercise the detection flow end-to-end. Boot it, then inspect or list tools.

## Fix — patch the Claude Code binary

The 2048 constant lives in CC's minified bundle behind a variable name that rotates every release (observed so far: `WoH`, `RoH`, `P4$`). There is NO runtime flag or env var — the only fix is a binary patch.

**Do not copy a ready-made script into your own repo.** The minified names drift with every CC version, so a cached copy bit-rots. Instead:

1. Read `<monorepo>/scripts/patch-claude-desc-limit.sh` in this repo's working copy — it re-detects the variable name on every run by grepping for `\w{2,5}=2048` adjacent to the canonical truncation pattern (`description??"";return Y.length>VAR?Y.slice(0,VAR)+…truncat…`).
2. If the script no longer matches (new obfuscation shape), update the detection regex using the current CC bundle as ground truth — don't trust any hand-copied fragment.
3. Install the auto-invoker: `alias claude="$HOME/bin/claude-wrapper"`. The wrapper stamps the patched binary path at `~/.claude/.desc-limit-patched` and re-patches on every version bump.
4. The patch lifts the limit from `=2048` to `=15e3` (15KB) and backs up `<claude-bin>.bak` on first run. A hard reinstall of CC wipes the patch — the wrapper catches it on next launch.

## Alternative: design around the limit

The right long-term fix is architectural, not a binary patch. Skills + `skills_vfs` keep the visible description constant-sized: the agent `ls`/`cat`s VFS entries only when a task needs them, and every byte of `references/` is paid for on demand rather than upfront. If a server is hitting 2KB because `code_executor` introspected too many tools, the usual move is to split those tools into a skill-member set and let the agent discover them progressively.

Patch + architecture are orthogonal: patching keeps existing heavy descriptions working; switching to skills prevents re-hitting the ceiling as the server grows.

## See also

- `<monorepo>/scripts/patch-claude-desc-limit.sh` — self-documenting patch script with version history
- `<monorepo>/bin/claude-wrapper` — shell wrapper that stamps + auto-patches on version change
- `references/skills-vfs.md` — progressive disclosure pattern that sidesteps the limit by construction
- `src/cli/inspect.ts` — `simply-mcp inspect` implementation for auditing description stats
- `examples/oversized-description.ts` — reproducer fixture
