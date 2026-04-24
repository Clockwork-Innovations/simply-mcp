# UI Components

Add visual interfaces to your MCP tools.

## Overview

Simply-MCP supports three ways to add UI:

1. **Inline HTML** - Simple, self-contained
2. **React Components** - Complex, interactive
3. **External URL** - Embed existing pages

## Quick Example

```typescript
import { createApp } from 'simply-mcp';

export const dashboardApp = createApp({
  uri: 'ui://dashboard',
  name: 'Dashboard',
  source: '<div style="padding: 1rem"><h1>Hello!</h1></div>',
  size: { width: 400, height: 300 },
});
```

## createApp() Options

```typescript
export const myApp = createApp({
  uri: 'ui://my-app',           // Required: URI starting with ui://
  name: 'My App',               // Required: Display name

  // Content (choose one):
  source: '<div>HTML</div>',    // Inline HTML
  component: './MyApp.tsx',     // React component path
  // source: 'https://...',     // External URL

  // Optional:
  description: 'App description',
  size: { width: 400, height: 300 },
  css: 'h1 { color: blue; }',   // Additional styles (inline HTML only)
  tools: [myTool],              // Tools this app can call
});
```

## Inline HTML

Good for simple, static UIs:

```typescript
export const statusApp = createApp({
  uri: 'ui://status',
  name: 'Status',
  source: `
    <div style="font-family: system-ui; padding: 20px;">
      <h1>Server Status</h1>
      <p style="color: green;">Online</p>
    </div>
  `,
});
```

## React Components

For interactive UIs, use React:

```typescript
// server.ts
export const calculatorApp = createApp({
  uri: 'ui://calculator',
  name: 'Calculator',
  component: './components/Calculator.tsx',
  tools: [addTool, subtractTool],
});
```

```tsx
// components/Calculator.tsx
import React, { useState } from 'react';

export default function Calculator() {
  const [result, setResult] = useState(0);

  const handleAdd = async () => {
    // Call tool from UI
    const response = await window.mcpApps.callTool('add_tool', { a: 1, b: 2 });
    setResult(response.sum);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Calculator</h1>
      <p>Result: {result}</p>
      <button onClick={handleAdd}>Add 1 + 2</button>
    </div>
  );
}
```

## Linking Tools to Apps

Apps can specify which tools they use:

```typescript
export const stockApp = createApp({
  uri: 'ui://stocks',
  name: 'Stock Dashboard',
  component: './StockDashboard.tsx',
  tools: [getStockTool, refreshTool],  // These tools are callable from the UI
});
```

## Viewing UIs

MCP clients that support UI rendering (Claude Desktop, ChatGPT) will display apps automatically.

### Playground

The simplest way to test MCP Apps during development:

```bash
npx simplymcp playground server.ts --open
```

The playground renders ext-apps inline when you execute tools. Tools with linked apps show a purple "app" badge in the sidebar. After execution, the app HTML loads in a sandboxed iframe with full SEP-1865 protocol support (tool calls, size changes, link opening, logging).

### Display Server

For clients without native UI support, use the built-in display server:

```typescript
export const server = createServer({
  name: 'my-server',
  version: '1.0.0',
  description: 'Server with UI',
  ui: {
    port: 3333,     // UI display server port
    autoOpen: true, // Open browser automatically
  },
});
```

Then access UIs at `http://localhost:3333/ui/my-app`.

## Security

UI content runs in sandboxed iframes with:
- `allow-scripts allow-same-origin` sandbox policy
- Different-origin isolation
- CSP restrictions on external resources

See [advanced/MCP_APPS.md](./advanced/MCP_APPS.md) for details on the MCP Apps specification.
