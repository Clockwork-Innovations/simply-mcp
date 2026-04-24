# Code Execution & Type System — Full Reference

## Sandbox

Code execution uses a QuickJS WebAssembly sandbox. It works on Node.js, Bun, and Cloudflare Workers — no containers or external services needed.

## Code Execution Pattern

For servers where AI composes multiple tool calls into one JS request:

```typescript
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'browser-server',
  version: '1.0.0',
  description: 'Browser automation',
  codeExecution: {
    timeout: 60000,
    introspectTools: true,
    captureOutput: true,
    embedInstructionsInDescription: true,
  },
  codeExecutionOnly: true,  // Only expose code_executor tool
});

export const pageNavigate = createTool({
  name: 'pageNavigate',  // camelCase for JS sandbox
  description: 'Navigate to URL',
  params: { url: { type: 'string', description: 'URL to visit' } },
  handler: async ({ url }) => ({ url, title: 'Page loaded' }),
});
```

AI writes JS in sandbox — both calling styles work:
```javascript
const nav = await pageNavigate({ url: "https://example.com" });  // object params
const nav = await pageNavigate("https://example.com");            // positional args
```

## resultType — Typed Function Stubs

By default, tools without `resultType` show no return type in the description (omitted, not `any`). Use `resultType` for typed stubs:

```typescript
export const getMeds = createTool({
  description: 'Get medications',
  params: { patientId: { type: 'string' } },
  resultType: 'Array<{ id: string; name: string; dosage: string }>',
  handler: async ({ patientId }) => [{ id: '1', name: 'Aspirin', dosage: '81mg' }],
});
// → getMeds(patientId: string): Array<{ id: string; name: string; dosage: string }>
```

## createType — Reusable Named Types

When multiple tools share types, define aliases with `createType` + `resultType`:

```typescript
import { createType } from 'simply-mcp';

// Must be exported
export const Location = createType('Location', {
  file: { type: 'string' }, line: { type: 'number' }, column: { type: 'number' }, text: { type: 'string' },
});
export const SymbolInfo = createType('SymbolInfo', {
  name: { type: 'string' }, kind: { type: 'string' }, line: { type: 'number' }, exported: { type: 'boolean' },
});

export const goToDefinition = createTool({
  name: 'goToDefinition',
  description: 'Go to definition',
  resultType: 'Location[]',
  params: { path: { type: 'string' }, line: { type: 'number' }, column: { type: 'number' } },
  handler: async (params) => { /* ... */ },
});
```

**AI sees** (minified, wrapped in XML tags):
```
<types>type Location={file:string;line:number;column:number;text:string};type SymbolInfo={name:string;kind:string;line:number;exported:boolean};</types>
<functions>goToDefinition(path:string,line:number,column:number):Location[]</functions>
```

Whitespace is automatically minified: no spaces around `:`, `,`, `|`, or inside `{}`. Only spaces inside `/*comments*/` are preserved.

Only types referenced by 2+ tools are emitted in `<types>`. Single-use types are auto-inlined into the function signature.

## createType Signatures

```typescript
createType(def: IType)                          // Unnamed inline
createType(name: string, props: Record<string, IType>)  // Named flat props
createType(name: string, schema: IType)         // Named full IType
createType(name: string, tsTypeDef: string)     // Named TS string (most concise)
```

The TS string overload emits directly without JSON schema conversion:
```typescript
export const Location = createType('Location', '{ file: string; line: number; column: number }');
```

## hideCodeExecutionReturnType — Omit Return Types

For standalone action tools whose results are rarely composed with other tools, hide the return type from the code_executor description to save tokens:

```typescript
export const clearSession = createTool({
  description: 'Clear all browser session data',
  resultType: '{ cleared: boolean; cookies: boolean; storage: boolean; cache: boolean }',
  hideCodeExecutionReturnType: true,
  params: { clearCookies: { type: 'boolean', required: false } },
  handler: async (params) => { ... },
});
// AI sees: clearSession(clearCookies?:boolean)
// Without flag: clearSession(clearCookies?:boolean):{cleared:boolean;cookies:boolean;storage:boolean;cache:boolean}
```

The return type still works at runtime — it's only hidden from the description. Good candidates: one-shot actions (clear, delete, toggle), side-effect tools, tools whose results are rarely piped into other calls.

## outputSchema (MCP Structured Output)

JSON Schema for structured results. If provided without `resultType`, auto-derives it:

```typescript
export const getUser = createTool({
  description: 'Get user',
  params: { id: { type: 'string' } },
  outputSchema: {
    type: 'object',
    properties: { name: { type: 'string' }, email: { type: 'string' } },
    required: ['name', 'email'],
  },
  handler: async ({ id }) => ({ name: 'Alice', email: 'alice@example.com' }),
});
```

## Sandbox Tool Filtering

Dynamically control which tools are exposed inside `code_executor` per-call, without triggering `notifications/tools/list_changed`. The client sends a filter each time — fully stateless.

### Server Setup

```typescript
export const server = createServer({
  name: 'care-server',
  version: '1.0.0',
  codeExecution: {
    timeout: 60000,
    introspectTools: true,
    enableSandboxFilter: true,   // Injects hidden _setSandboxFilter + _getToolsDescription
    onSandboxToolsChanged: (update) => {
      // Fires when _setSandboxFilter is called in sandbox
      // update: { typeDefinitions: string, functions: string, toolNames: string[] }
      console.log('Filtered tools:', update.toolNames);
      console.log('Types:', update.typeDefinitions);
      console.log('Signatures:', update.functions);
    },
  },
});
```

### Hidden Sandbox Functions

Injected into sandbox but NOT listed in `getFunctions()` or tool description:

| Function | Purpose | Activates gate? |
|----------|---------|-----------------|
| `_setSandboxFilter({ tools?, routers? })` | Filter tools + return types & signatures | Yes |
| `_getToolsDescription(names[])` | Discovery only (return types & signatures) | No |

Both return `{ typeDefinitions: string, functions: string, toolNames: string[] }`.

### Client Flow

```
1. Discovery (optional):
   code_executor({ code: '_getToolsDescription(["get_patient"])' })
   → { typeDefinitions: "...", functions: "getPatient(id: string): any", toolNames: ["get_patient"] }

2. Execution (each turn):
   code_executor({ code: `
     _setSandboxFilter({ tools: ["get_patient"] });
     const p = await getPatient({ id: "john" });
     return p;
   ` })
   // get_patient works, all other tools throw "Tool X is not available"
```

### Router Resolution

`_setSandboxFilter` resolves router names to their member tools:

```javascript
// If care_router owns get_patient + list_appointments:
_setSandboxFilter({ routers: ['care_router'] });
// → allows get_patient and list_appointments, blocks everything else

// Mix tools and routers:
_setSandboxFilter({ tools: ['delete_record'], routers: ['care_router'] });
// → allows delete_record + get_patient + list_appointments
```

### Key Behavior

| Scenario | Result |
|----------|--------|
| `enableSandboxFilter: false` (default) | No hidden functions, no gating — existing behavior |
| Feature enabled, `_setSandboxFilter` not called | All tools work (gate inactive) |
| `_setSandboxFilter({ tools: ['a'] })` then call `b()` | Throws `"Tool 'b' is not available in the current sandbox filter"` |
| `_getToolsDescription(['a'])` then call `b()` | `b()` works (gate not activated) |
| `onSandboxToolsChanged` callback | Fires on `_setSandboxFilter`, NOT on `_getToolsDescription` |

### No MCP Notifications

The filter operates inside the `code` string — no change to `code_executor` schema, no `notifications/tools/list_changed`. Client cache is preserved.

## Inspect Description

Debug the code_executor description without starting a server:

```bash
npx simply-mcp inspect server.ts          # Pretty-printed with stats
npx simply-mcp inspect server.ts --raw    # Raw description only
npx simply-mcp inspect server.ts --json   # JSON with length, token estimate, flags
```

Stats include: char length, estimated tokens, presence of `<types>`/`<functions>` tags, and whether `any`/`unknown` appear (which indicate missing `resultType`).

## Dry-Run Type Analysis

```bash
npx simply-mcp lint server.ts -v
```

Reports type consolidation opportunities for code execution servers — where `createType`/`resultType` would reduce token usage in stubs. Uses a pseudo-BPE token estimator for accurate context window impact measurement.
