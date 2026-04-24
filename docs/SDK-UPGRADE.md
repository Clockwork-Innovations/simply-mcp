# MCP SDK Upgrade Workflow

How to upgrade `@modelcontextprotocol/sdk` in simply-mcp safely.

## Quick Start

```bash
# 1. Check current compliance
pnpm sdk:audit

# 2. Upgrade the SDK
pnpm update @modelcontextprotocol/sdk

# 3. Run contract tests — they'll catch new schemas
pnpm test:smoke

# 4. Re-run audit to see full gap report
pnpm sdk:audit
```

## What the Tools Do

### Contract Tests (`tests/unit/protocol/sdk-contract.test.ts`)

Automatically fail when:
- The SDK adds new request schemas without registered handlers
- Exclusion lists reference schemas the SDK no longer exports
- New `throw new Error(...)` is added in handler code (should use `McpError`)

Key lists to maintain:
- **`KNOWN_GAPS`** — schemas intentionally not handled yet. Currently empty (all schemas handled).
- **`KNOWN_PLAIN_ERROR_COUNT`** — tracks plain `Error` throw count. Currently 0 — all use `McpError`.
- **`SDK_INTERNAL_SCHEMAS`** — schemas the SDK handles internally (`Initialize`, `Ping`).
- **`SERVER_TO_CLIENT_SCHEMAS`** — schemas the server sends TO the client (`CreateMessage`, `Elicit`, `ListRoots`).

The test also verifies **bundle codegen sync** — ensuring `compile-wrapper-generator.ts` includes `listChanged`, `logging`, `SetLevelRequestSchema`, `ListResourceTemplatesRequestSchema`, `McpError`/`ErrorCode`, and `onerror`.

### SDK Audit Script (`scripts/sdk-audit.ts`)

On-demand report comparing SDK exports vs simply-mcp usage:

```bash
pnpm sdk:audit          # Human-readable
pnpm sdk:audit --json   # Machine-readable (for CI)
```

Reports:
- Request schema coverage (which schemas have handlers)
- Notification schema coverage (which notifications are used)
- Type export coverage (which SDK types are imported)
- Actionable gap list

Exit code `1` when gaps are detected.

## Upgrade Checklist

When upgrading the SDK version:

1. **Run `pnpm sdk:audit` before and after** to see what changed
2. **Run `pnpm test:smoke`** — contract tests catch new schemas immediately
3. **Check the SDK changelog** for breaking changes
4. **For each new request schema**:
   - Add a handler in `src/server/handler-registration.ts`
   - Add to bundle codegen in `src/core/formatters/compile-wrapper-handlers.ts`
   - Add the import in `src/core/formatters/compile-wrapper-generator.ts`
   - Or add to `KNOWN_GAPS` in the contract test with a TODO
5. **For each new capability flag**:
   - Wire it in **all 3** Server creation sites in `builder-server.ts` (`start()`, `startWithTransport()`, `_createServerInstance()`)
   - Wire it in bundle codegen (`compile-wrapper-generator.ts`)
   - Add a test in the Capability Flags section of the contract test
6. **For new notification schemas**:
   - Verify the notification is sent when appropriate
   - Add method name mapping in `scripts/sdk-audit.ts` if needed
7. **Commit and run full test suite**: `pnpm test:standard`

## Architecture

```
tests/unit/protocol/sdk-contract.test.ts  ← CI guard (fails on drift)
scripts/sdk-audit.ts                      ← On-demand gap report
docs/SDK-UPGRADE.md                       ← This file
```

The contract test reads the SDK's `types.d.ts` at test time, so it automatically adapts to whatever SDK version is installed — no manual schema list maintenance needed.
