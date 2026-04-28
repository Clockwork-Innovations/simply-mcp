# Authentication — Full Reference

All auth types require HTTP transport (`port` set in `createServer()`).

## API Key Auth

```typescript
export const server = createServer({
  name: 'my-server', version: '1.0.0', port: 3000,
  auth: {
    type: 'apiKey',
    keys: [
      { name: 'admin', key: 'sk-admin-123', permissions: ['*'] },
      { name: 'readonly', key: 'sk-read-456', permissions: ['read:*'] },
    ],
    allowAnonymous: false,  // default
  },
});
```

## OAuth 2.1 (built-in provider)

```typescript
export const server = createServer({
  name: 'my-server', version: '1.0.0', port: 3000,
  auth: {
    type: 'oauth2',
    issuerUrl: 'https://auth.example.com',
    clients: [{
      clientId: 'my-app',
      clientSecret: process.env.CLIENT_SECRET!,
      redirectUris: ['http://localhost:3000/callback'],
      scopes: ['read', 'write', 'tools:execute'],
    }],
    tokenExpiration: 3600,         // 1 hour (default)
    refreshTokenExpiration: 86400, // 24 hours (default)
  },
});
```

## OIDC Resource Server (Google, Auth0, Okta, Keycloak)

Delegates auth to an external provider — your server only validates tokens.

```typescript
export const server = createServer({
  name: 'my-server', version: '1.0.0', port: 3000,
  auth: {
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    resourceServerUrl: 'https://mcp.example.com',
    scopesSupported: ['openid', 'email', 'tools:read', 'tools:execute'],
    defaultToolScopes: ['openid'],
  },
});
```

## Per-Tool & Per-Router Scopes

```typescript
// Tool-level
export const executeCode = createTool({
  description: 'Execute code',
  requiredScopes: ['tools:execute'],
  params: { code: { type: 'string' } },
  handler: ({ code }) => `Executed: ${code}`,
});

// Router-level (applies to all tools in router)
export const adminTools = createRouter({
  name: 'admin',
  description: 'Admin tools',
  tools: [deleteUser, resetPassword],
  requiredScopes: ['admin:*'],
});
```

**Scope wildcard rules:**
- `*` — universal wildcard, matches anything
- `tools:*` — matches `tools:read`, `tools:execute` (sub-scopes only)
- `tools:*` does NOT match bare `tools`
- `admin:read` does NOT match `admin:read:secret` (no wildcard = exact depth)

## OAuth Metadata Generation

```bash
npx simply-mcp generate-metadata \
  --resource https://mcp.example.com \
  --auth-server https://accounts.google.com \
  --scopes "openid,email,tools:read" \
  --output .well-known/
```

Generates RFC 9728 Protected Resource Metadata and RFC 8414 Authorization Server Metadata for static hosting.

## Security Settings (OWASP MCP Top 10)

Simply-MCP includes built-in security controls aligned with the [OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/). Most are enabled by default.

### Server Options

```typescript
export const server = createServer({
  name: 'my-server', version: '1.0.0', port: 3000,

  // Network binding — defaults to localhost only (OWASP MCP07)
  host: '127.0.0.1',          // Set '0.0.0.0' to listen on all interfaces

  // Tool description sanitization — strips injection tags (OWASP MCP03)
  // Removes: <IMPORTANT>, <system>, <instructions>, [INST], <|im_start|>, etc.
  sanitizeDescriptions: true,  // default: true

  // Tool output sanitization — strips injection tags from results (OWASP MCP06)
  // OPT-IN: legit markdown/transcripts/security-research output contain these
  // tokens and would be silently mangled. Enable only when untrusted tool output
  // flows back into an LLM.
  sanitizeOutput: false,       // default: false

  // Schema integrity — SHA-256 pins tool schemas at registration (OWASP MCP03)
  // Detects rug pull attacks (tool definitions changing after approval)
  schemaIntegrity: true,       // default: true

  // Secret scanning — detects credential patterns in output (OWASP MCP01)
  // Patterns: OpenAI, Anthropic, AWS, GitHub, Slack, JWT, PEM, Google, Stripe keys
  // Redacts with [REDACTED:<type>]
  secretScanning: false,       // default: false (opt-in, may have false positives)

  // Session binding — binds sessions to IP + User-Agent fingerprint
  sessionBinding: true,        // default: true (prevents session hijacking)
  // sessionBinding: { sessionTtlMs: 1800000, cleanupIntervalMs: 300000 },
});
```

### What Each Control Does

| Option | OWASP Risk | Default | Effect |
|--------|-----------|---------|--------|
| `host` | MCP07 | `'127.0.0.1'` | HTTP server bind address — localhost only by default |
| `sanitizeDescriptions` | MCP03 | `true` | Strips prompt injection tags from tool descriptions before they reach the LLM |
| `sanitizeOutput` | MCP06 | `false` | Opt-in. Strips injection patterns (`<IMPORTANT>`, `<\|im_start\|>`, `<system>`) from tool return values. Off by default because it mangles legitimate markdown/transcript/security-research payloads — enable only when untrusted output is fed back into an LLM |
| `schemaIntegrity` | MCP03 | `true` | SHA-256 hashes tool schemas at registration; detects mutations |
| `secretScanning` | MCP01 | `false` | Scans tool output and error messages for credential patterns, redacts them |
| `sessionBinding` | MCP07 | `true` | Binds sessions to IP+User-Agent; rejects hijacked sessions |

### Input Sanitization

The `InputSanitizer` validates tool parameters automatically. It detects:
- SQL injection patterns
- Shell injection (`$()`, backticks, `&&`, `|`, `rm -rf`, etc.)
- XSS (`<script>`, event handlers, `javascript:` protocol)
- Path traversal (`../`)
- CRLF injection (`\r\n`, URL-encoded variants)
- Template injection (`${...}`, `{{...}}`, `#{...}`)

### Audit Logging

Security events are logged when auth is configured:

```typescript
// Event types logged automatically:
// authentication.success/failure/missing
// authorization.granted/denied
// tool.executed/failed
// tool.registered, tool.schema_changed, tool.description_sanitized
// ratelimit.exceeded/warning
// session.created/terminated
// security.violation, security.secret_detected
// oauth.* events
```

### Production Checklist

- [ ] Set `auth` (API key or OAuth) — never deploy without authentication
- [ ] Keep `sanitizeDescriptions: true` (default). Set `sanitizeOutput: true` only if untrusted tool output is fed back into an LLM — it will mangle markdown/transcripts that legitimately contain `<IMPORTANT>`/`<|im_start|>`/`<system>` tokens.
- [ ] Keep `host: '127.0.0.1'` unless you need external access
- [ ] Enable `secretScanning: true` if tools process credentials
- [ ] Use `requiredScopes` on sensitive tools
- [ ] Set `allowAnonymous: false` (default) in auth config
- [ ] Use short-lived tokens with OAuth, not long-lived API keys for production
