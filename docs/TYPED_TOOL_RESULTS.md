# Typed Tool Results

`simply-mcp` has one canonical typed-result rule:

- `structuredContent` is the machine-readable payload.
- `content` is display-only text/media for hosts and humans.
- `outputSchema` is the runtime validation authority.
- `resultType` is descriptive TypeScript metadata unless it carries enough
  schema information to derive `outputSchema`.

## Canonical Rule

If a consumer wants typed tool-result parsing, it must validate
`structuredContent` against `outputSchema`.

The framework does **not** treat `content[0].text` as the typed payload, even
when the text happens to contain JSON. Parsing display text as machine data is
legacy compatibility behavior, not the typed contract.

## Authoring Rule

If you want typed result consumption:

1. Publish an `outputSchema` explicitly, or use a schema-carrying `resultType`
   that can derive one.
2. Return structured JSON-compatible data so the runtime can populate
   `structuredContent`.
3. Keep `content` for narration, summaries, and display text.

Examples:

```ts
import { createTool, createType } from 'simply-mcp';

const WeatherResult = createType('WeatherResult', {
  type: 'object',
  properties: {
    city: { type: 'string' },
    tempC: { type: 'number' },
  },
});

export const weather = createTool({
  name: 'weather',
  description: 'Get current weather',
  resultType: WeatherResult,
  handler: async () => ({ city: 'Austin', tempC: 29 }),
});
```

```ts
import { createTool } from 'simply-mcp';

export const weather = createTool({
  name: 'weather',
  description: 'Get current weather',
  outputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      tempC: { type: 'number' },
    },
    required: ['city', 'tempC'],
  },
  resultType: 'WeatherResult',
  handler: async () => ({
    content: [{ type: 'text', text: 'Austin is 29C' }],
    structuredContent: { city: 'Austin', tempC: 29 },
  }),
});
```

## `outputSchema` vs `resultType`

- `outputSchema` only:
  runtime typed parsing works.
- schema-carrying `resultType` only:
  `simply-mcp` derives `outputSchema`, so runtime typed parsing works.
- string-only `resultType` only:
  compile-time/codegen hints only; runtime typed parsing is unavailable.
- both present:
  `outputSchema` is the runtime authority and `resultType` remains descriptive.

## Mismatch Behavior

When a tool declares a typed result contract and the runtime payload disagrees:

- missing `structuredContent` fails;
- invalid `structuredContent` fails;
- JSON-looking `content` text is not used as a typed fallback.

The public helper throws `ToolResultContractError` with one of:

- `NO_TYPED_RESULT_CONTRACT`
- `MISSING_STRUCTURED_CONTENT`
- `OUTPUT_SCHEMA_MISMATCH`

## Consumer Helper Path

Use the exported helper path:

```ts
import { parseCanonicalToolResult } from 'simply-mcp';

const data = parseCanonicalToolResult(toolDefinitionOrMetadata, handlerResult);
```

This works with:

- local `createTool(...)` definitions
- published tool metadata from `tools/list`
- full `HandlerResult` envelopes returned at runtime

## Migration Guidance

- Existing consumers that parse `content[0].text` as JSON should treat that as
  migration debt, not a durable contract.
- Port tools to publish `outputSchema` and populate `structuredContent`.
- Port consumers to `parseCanonicalToolResult(...)` once the tool metadata is
  authoritative.
