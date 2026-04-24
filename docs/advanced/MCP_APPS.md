# MCP Apps (SEP-1865)

Rich UI responses following the MCP Apps specification.

## Overview

MCP Apps allow tools to return visual interfaces. When a tool is linked to an app, responses include UI metadata that compatible clients can render.

## Tool-UI Linking

Link a tool to a UI resource:

```typescript
import { createServer, createTool, createApp } from 'simply-mcp';

export const server = createServer({
  name: 'stock-server',
  version: '1.0.0',
  description: 'Stock tools with UI',
});

// Define the UI
export const stockApp = createApp({
  uri: 'ui://stock-dashboard',
  name: 'Stock Dashboard',
  component: './StockDashboard.tsx',
  size: { width: 600, height: 400 },
});

// Link tool to UI
export const getStockTool = createTool({
  description: 'Get stock quote',
  params: { ticker: { type: 'string', description: 'Ticker symbol' } },
  uiResourceUri: 'ui://stock-dashboard',  // Links to the app
  handler: ({ ticker }) => ({ ticker, price: 150.25, change: 2.5 }),
});
```

Tool response includes UI metadata:
```json
{
  "content": [{ "type": "text", "text": "..." }],
  "_meta": {
    "ui": {
      "resourceUri": "ui://stock-dashboard",
      "visibility": ["model", "app"],
      "preferredFrameSize": { "width": 600, "height": 400 }
    }
  }
}
```

## registerAppResource()

Programmatically register UI resources:

```typescript
import { registerAppResource } from 'simply-mcp';

// HTML template
registerAppResource({
  uri: 'ui://dashboard/v1',
  name: 'Dashboard',
  content: '<div id="app">{{content}}</div>',
  size: { width: 800, height: 600 },
});

// Async content
registerAppResource({
  uri: 'ui://chart/v1',
  name: 'Chart',
  content: async () => generateChartHTML(),
});
```

## MIME Types

| Type | Description |
|------|-------------|
| `text/html;profile=mcp-app` | MCP Apps HTML (default) |
| `text/html` | Raw HTML |
| `text/uri-list` | External URL (iframe) |
| `application/vnd.mcp-ui.remote-dom` | Remote DOM scripts |

## Client Rendering

### React

```tsx
import { AppRenderer } from 'simply-mcp/client';

<AppRenderer
  client={mcpClient}
  uiMetadata={{ resourceUri: 'ui://stock-dashboard' }}
  toolResult={toolResponse}
/>
```

### Web Component

```typescript
import { registerUIResourceRenderer } from 'simply-mcp/client';

registerUIResourceRenderer();
```

```html
<ui-resource-renderer
  uri="ui://stock-dashboard"
  content="..."
></ui-resource-renderer>
```

## OpenAI Compatibility

For ChatGPT/OpenAI deployment:

```typescript
export const server = createServer({
  name: 'my-openai-app',
  version: '1.0.0',
  description: 'ChatGPT App',
  openai: {
    widgetDomain: 'my-app.example.com',
    widgetCSP: {
      connect_domains: ['api.example.com'],
      resource_domains: ['cdn.example.com'],
    },
  },
});
```

Or use the adapter:
```typescript
import { wrapHtmlWithAdapters } from 'simply-mcp';

const html = wrapHtmlWithAdapters('<div>My UI</div>', {
  openai: true,   // Enable window.openai.callTool()
  mcpui: true,    // Enable postMessage protocol
});
```

## Security

Per SEP-1865:
- All UI content sandboxed: `allow-scripts allow-same-origin`
- Different-origin iframe isolation
- JSON-RPC postMessage protocol for tool calls
- CSP restrictions on external resources

## Hybrid Tool Execution

Hybrid execution lets a tool handler **pause mid-execution**, send data to its linked MCP App, wait for the user's interaction in the App, and resume with the response. The App becomes a participant in the tool execution pipeline rather than a passive display.

### Flow

```
AI calls generate_chart tool
  → Server handler: fetches data, processes it
  → ctx.requestAppInput(): sends processed data to App iframe
  → App: renders interactive chart, user zooms/filters
  → App responds: sends final state back
  → Server handler resumes: returns unified result to AI
```

### Handler Usage

Use `ctx.requestAppInput()` inside any tool handler linked to an App via `createApp()`:

```typescript
export const generateChart = createTool({
  description: 'Generate interactive chart',
  params: { query: { type: 'string', description: 'Data query' } },
  handler: async (params, ctx) => {
    // Phase 1: Server-side compute
    ctx.progress('Fetching data...');
    const data = await fetchFromDatabase(params.query);

    // Phase 2: Send to App, wait for user interaction
    const appResponse = await ctx.requestAppInput({
      data: { chartData: data, chartType: 'bar' },
      type: 'chart-interaction',  // optional, for App-side routing
      timeout: 120000,            // optional, default 60s
    });

    if (appResponse.action === 'cancel') {
      return 'Chart generation cancelled by user.';
    }

    // Phase 3: Return unified result
    return {
      content: [{ type: 'text', text: `Chart with filters: ${JSON.stringify(appResponse.data)}` }],
      structuredContent: { ...data, userFilters: appResponse.data },
    };
  },
});

export const chartApp = createApp({
  uri: 'ui://chart',
  component: './ChartApp.tsx',
  tools: [generateChart],
});
```

### App-Side Handler

In the App iframe, register `window.mcpApps.onAppInputRequest` to handle requests:

```javascript
window.mcpApps.onAppInputRequest = async (data, type) => {
  // Render UI based on data
  renderChart(data.chartData, data.chartType);

  // Wait for user interaction (e.g., click "Apply Filters")
  const userSelection = await waitForUserAction();

  return {
    data: { filters: userSelection },
    action: 'submit'  // or 'cancel'
  };
};
```

If no `onAppInputRequest` handler is registered, the request auto-cancels.

### API Reference

**`ctx.requestAppInput(request)`** — only available when tool has an `appUri`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `Record<string, unknown>` | required | Structured data for the App |
| `type` | `string` | `'input-request'` | Message type for App-side routing |
| `timeout` | `number` | `60000` | Timeout in ms |

**Returns** `Promise<AppInputResponse>`:

| Field | Type | Description |
|-------|------|-------------|
| `data` | `Record<string, unknown>` | App's response data |
| `action` | `'submit' \| 'cancel'` | Whether user completed or cancelled |

## Visibility

Control who can see/call tools:

```typescript
export const adminApp = createApp({
  uri: 'ui://admin',
  name: 'Admin Panel',
  visibility: ['app'],  // Only callable from UI, not by model
});

export const publicApp = createApp({
  uri: 'ui://public',
  name: 'Public Dashboard',
  visibility: ['model', 'app'],  // Both model and UI can access (default)
});
```
