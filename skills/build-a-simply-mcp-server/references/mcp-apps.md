# MCP Apps — Full Reference

MCP Apps are interactive UIs that run in host iframes (Claude Desktop, ChatGPT, etc.) and communicate with your server's tools via a standardized JSON-RPC 2.0 protocol.

## Communication Flows

| Flow | Trigger | API | Use Case |
|------|---------|-----|----------|
| **App → Host** | User clicks button | `window.mcpApps.callTool(name, args)` | Interactive UI calling server tools |
| **Host → App** | LLM calls tool | `window.mcpApps.onToolResult` | Receiving tool results pushed by the model |
| **Host → App** | LLM streams input | `window.mcpApps.onToolInput` / `onToolInputPartial` | Streaming data to the app as the model generates |
| **Server ↔ App** | Handler mid-execution | `ctx.requestAppInput()` / `onAppInputRequest` | Hybrid: handler pauses, app collects user input, handler resumes |
| **App → Host** | App sends message | `window.mcpApps.sendMessage(content)` | Inject content into conversation |
| **App → Host** | App updates context | `window.mcpApps.updateModelContext(ctx)` | Update model's understanding of app state |
| **App → Host** | App opens link | `window.mcpApps.openLink(url)` | Open URL in host browser |
| **App → Host** | App downloads file | `window.mcpApps.downloadFile(contents)` | Host-mediated file download (iframes block direct downloads) |
| **App → Host** | App done | `window.mcpApps.requestTeardown()` | Request host to remove the app |
| **App → Host** | App reads resource | `window.mcpApps.readServerResource({uri})` | Read a server resource through the host |
| **App → Host** | App lists resources | `window.mcpApps.listServerResources()` | List available server resources |
| **Host → App** | Host requests teardown | `window.mcpApps.onTeardown` | Host asks app to clean up before removal |

---

## Basic Pattern

```typescript
import { createServer, createTool, createApp, wrapHtmlWithAdapters } from 'simply-mcp';

export const server = createServer({ name: 'my-server', version: '1.0.0', description: '...' });

export const getPrice = createTool({
  description: 'Get stock price',
  params: { ticker: { type: 'string', description: 'Stock symbol' } },
  handler: async ({ ticker }) => ({ ticker, price: 178.50, change: +2.3 }),
});

const html = wrapHtmlWithAdapters(`
<html><body>
  <input id="ticker" value="AAPL">
  <button onclick="fetchPrice()">Get Price</button>
  <div id="result"></div>
  <script>
    function extract(r) {
      if (r?.structuredContent) return r.structuredContent;
      if (r?.content?.[0]?.text) { try { return JSON.parse(r.content[0].text); } catch { return r; } }
      return r;
    }
    async function fetchPrice() {
      const raw = await window.mcpApps.callTool('get_price', { ticker: document.getElementById('ticker').value });
      const data = extract(raw);
      document.getElementById('result').textContent = data ? '$' + data.price : 'Error';
    }
    window.mcpApps.onToolResult = (raw) => {
      const data = extract(raw);
      if (data?.price) document.getElementById('result').textContent = '$' + data.price;
    };
  </script>
</body></html>
`);

export const dashboard = createApp({
  uri: 'ui://stock/dashboard',
  name: 'Stock Dashboard',
  description: 'Interactive stock viewer',
  source: html,
  tools: [getPrice],
  size: { width: 400, height: 300 },
});
```

---

## createApp() — All Options

```typescript
createApp({
  // Required
  uri: 'ui://my/app',              // Must use ui:// scheme
  name: 'My App',

  // Content source (pick one)
  source: htmlString,              // Inline HTML (use wrapHtmlWithAdapters())
  component: './MyComponent.tsx',  // React component path (auto-compiled)
  remoteDom: importPath,           // Remote DOM component
  buildDir: './dist',              // Pre-built app dir (served via URL at /__apps/{name}/*)

  // Optional
  description: 'What this app does',
  tools: [tool1, tool2],           // Tools this UI can call (array)
  // tools: { sum: addTool },      // OR named map: exposed as 'sum' instead of tool's original name
  css: 'body { font-family: sans-serif; }',  // Injected stylesheet
  size: { width: 800, height: 600 },
  subscribable: true,              // App can receive ongoing updates
  visibility: ['model', 'app'],    // Who can see this resource
  domain: 'myapp.sandbox.local',   // Custom sandbox domain
  prefersBorder: true,             // Hint to host to draw a border

  // Content Security Policy
  csp: {
    connectDomains: ['api.example.com'],    // Domains for fetch/XHR
    resourceDomains: ['cdn.example.com'],   // Domains for images/scripts/styles
    frameDomains: ['embed.example.com'],    // Domains for nested iframes
    baseUriDomains: ['example.com'],        // Allowed base URIs
  },

  // iframe permissions
  permissions: {
    camera: {},
    microphone: {},
    geolocation: {},
    clipboardWrite: {},
  },

  // Proxy: auto-injects proxy_fetch tool when connectDomains is non-empty (default: true)
  proxy: true,
});
```

### React Component Apps

When you use `component: './MyComponent.tsx'`, the framework auto-compiles the TSX/JSX to browser-ready JavaScript using esbuild (with babel fallback). The component is bundled with React and rendered into a full HTML document with the MCP Apps adapter injected.

```typescript
export const calcApp = createApp({
  uri: 'ui://calculator',
  name: 'Calculator',
  component: './components/Calculator.tsx',
  tools: [addTool, multiplyTool],
  size: { width: 300, height: 400 },
});
```

### Build Directory Apps

For full React/Vite/webpack apps that are too large for srcdoc or need their own build pipeline, use `buildDir`. You build the app yourself (e.g., `vite build`), then point at the output directory. The framework serves it via URL at `/__apps/{name}/*` with SPA fallback.

```typescript
export const dashboard = createApp({
  uri: 'ui://dashboard',
  name: 'Dashboard',
  buildDir: './dashboard-app/dist',  // Must contain index.html
  tools: [queryTool, exportTool],
  size: { width: 1200, height: 800 },
});
```

The MCP Apps adapter script is auto-injected into `index.html` when served, so `window.mcpApps` works the same as inline HTML apps. The resource MIME type becomes `text/uri-list` (URL-based rather than `text/html` srcdoc).

---

## CallToolResult Format

Tool results from `callTool()` may arrive in two formats depending on the host:

```json
{
  "content": [{ "type": "text", "text": "{\"price\": 178.5}" }],
  "structuredContent": { "price": 178.5 }
}
```

Always use a helper to normalize:

```javascript
function extract(r) {
  if (r?.structuredContent) return r.structuredContent;
  if (r?.content?.[0]?.text) { try { return JSON.parse(r.content[0].text); } catch { return r; } }
  return r;
}
```

---

## window.mcpApps API

The adapter injects `window.mcpApps` into every app iframe. It works across MCP Apps hosts (Claude Desktop) and ChatGPT (via JSON-RPC + OpenAI extensions).

### Methods (App → Host)

| Method | Signature | Purpose |
|--------|-----------|---------|
| `callTool` | `(name, args, options?) → Promise<result>` | Call a server tool and get the result |
| `sendMessage` | `(content) → void` | Inject a message into the conversation |
| `updateModelContext` | `(context) → void` | Update the model's context about app state |
| `openLink` | `(url) → void` | Open URL in the host's browser |
| `requestDisplayMode` | `(mode) → void` | Request fullscreen/compact display |
| `sendSizeChanged` | `(width, height) → void` | Notify host of size change |
| `notifyIntrinsicHeight` | `(height) → void` | Shorthand for sendSizeChanged(undefined, height) |
| `requestTeardown` | `() → void` | Request host to remove this app |
| `downloadFile` | `(contents) → Promise<{isError?}>` | Host-mediated file download (iframe blocks direct) |
| `readServerResource` | `({uri}) → Promise<ReadResourceResult>` | Read a server resource through the host |
| `listServerResources` | `() → Promise<ListResourcesResult>` | List available server resources |
| `applyHostStyles` | `() → void` | Apply host CSS variables, theme, and fonts (auto-called on context change) |
| `sendLog` | `(level, message, data?) → void` | Send log message to host |
| `setWidgetState` | `(state) → void` | Persist widget state across renders |
| `getWidgetState` | `() → state` | Retrieve persisted widget state |
| `getToolInput` | `() → data` | Get initial tool input data |
| `getHostCapabilities` | `() → capabilities` | Query host feature support |
| `getHostContext` | `() → context` | Get host context (theme, locale, etc.) |
| `getHostInfo` | `() → info` | Get host identification |
| `getTheme` | `() → theme` | Get current theme (light/dark) |
| `getLocale` | `() → locale` | Get host locale |
| `isInitialized` | `() → boolean` | Check if adapter is ready |
| `connect` | `() → void` | Manually initialize (auto-called normally) |

### Event Handlers (Host → App)

Set these as callbacks on `window.mcpApps`:

| Handler | Signature | When Fired |
|---------|-----------|------------|
| `onToolResult` | `(result) → void` | LLM calls a tool linked to this app |
| `onToolInput` | `(data) → void` | Host sends complete tool input data |
| `onToolInputPartial` | `(data) → void` | Host streams partial tool input |
| `onToolCancelled` | `(data) → void` | Host cancels a pending tool call |
| `onHostContextChanged` | `(context) → void` | Host context changes (theme, locale) |
| `onProgress` | `(data) → void` | Progress updates from the host |
| `onTeardown` | `async () → void` | Host requests app to clean up before removal |
| `onAppInputRequest` | `async (data, type) → response` | Server requests user input (hybrid flow) |

---

## wrapHtmlWithAdapters()

Injects the MCP Apps adapter script into existing HTML. Tries `<head>`, then `<body>`, then prepends.

```typescript
import { wrapHtmlWithAdapters } from 'simply-mcp';

const html = wrapHtmlWithAdapters('<html><body>...</body></html>', {
  openai: true,           // Enable ChatGPT extensions layer (default: true)
  mcpApps: true,          // Enable MCP Apps JSON-RPC adapter (default: true)
  customScript: '...',    // Additional script to include
  debug: false,           // Log adapter activity to console (default: false)
  toolCallTimeout: 30000, // Timeout for callTool() in ms (default: 30000)
});
```

There's also `createAdaptedDocument()` for building complete HTML documents from scratch:

```typescript
import { createAdaptedDocument } from 'simply-mcp';

const doc = createAdaptedDocument('<h1>Hello</h1>', {
  title: 'My App',
  styles: 'body { font-family: sans-serif; }',
  scripts: 'console.log("loaded")',
  adapterOptions: { debug: true },
});
```

---

## Hybrid Tool Execution (ctx.requestAppInput)

The handler pauses, sends data to the iframe, waits for user input, then resumes:

```typescript
export const selectChart = createTool({
  description: 'Generate chart with user selection',
  params: { query: { type: 'string' } },
  handler: async (params, ctx) => {
    const data = await fetchData(params.query);
    const response = await ctx.requestAppInput({
      data: { chartData: data },
      timeout: 120000,
    });
    if (response.action === 'cancel') return 'Cancelled';
    return { ...data, filters: response.data };
  },
});
```

**App-side handler:**
```javascript
window.mcpApps.onAppInputRequest = async (data, type) => {
  renderChart(data.chartData);
  const selection = await waitForUser();
  return { data: { filters: selection }, action: 'submit' };
};
```

Only available when the tool is linked to an App via the `tools` field in `createApp()`.

---

## Link Interception

The adapter automatically intercepts `<a href="https://...">` clicks and routes them through `window.mcpApps.openLink()` so they open in the host browser instead of trying to navigate within the iframe. This applies to both static links and dynamically created ones.

---

## OpenAI/ChatGPT Compatibility

Apps work in ChatGPT out of the box. The adapter uses the standard MCP Apps JSON-RPC protocol for core operations (callTool, sendMessage, openLink, updateModelContext). ChatGPT-exclusive features (checkout, file upload, modals) are handled natively by the `window.openai` runtime when present.

Configure server-level OpenAI options to enable widget mode:

```typescript
const server = createServer({
  name: 'my-server', version: '1.0.0', description: '...',
  openai: {
    widgetDomain: 'my-app.example.com',  // Widget serving domain
    widgetCSP: { connect_domains: ['api.example.com'] },
    fileParams: ['documentFile'],          // Params that accept file uploads
  },
});
```

---

## proxy_fetch Tool

When `csp.connectDomains` is set and `proxy: true` (default), the framework auto-injects a `proxy_fetch` tool. The adapter overrides `window.fetch` so that requests to listed domains are transparently proxied through the MCP server, avoiding CORS restrictions in the iframe.

```typescript
export const app = createApp({
  uri: 'ui://weather',
  name: 'Weather',
  source: html,
  tools: [getWeather],
  csp: { connectDomains: ['api.weather.gov'] },  // proxy_fetch auto-injected
  // proxy: false,  // Set to false to disable
});
```

App code uses normal `fetch()` — the adapter intercepts and routes through the server.
