# OAuth 2.1 Authentication

Secure authentication for HTTP mode servers.

## Overview

Simply-MCP supports two OAuth modes aligned with the [November 2025 MCP specification](https://modelcontextprotocol.io/specification/draft/basic/authorization):

| Mode | `auth.type` | Use Case |
|------|-------------|----------|
| **Built-in Provider** | `'oauth2'` | MCP server handles auth itself (standalone, dev, testing) |
| **External Provider (OIDC)** | `'oidc'` | Delegate to Google, Auth0, Okta, Keycloak, Azure AD |

## Mode 1: Built-in Provider (`type: 'oauth2'`)

The MCP server acts as both authorization server and resource server.

```typescript
import { createServer } from 'simply-mcp';

export const server = createServer({
  name: 'oauth-server',
  version: '1.0.0',
  port: 3000,
  auth: {
    type: 'oauth2',
    provider: {
      authorizationUrl: 'https://provider.com/oauth/authorize',
      tokenUrl: 'https://provider.com/oauth/token',
      clientId: process.env.OAUTH_CLIENT_ID!,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      scopes: ['read', 'write'],
    },
    scopeMapping: {
      'tools/call': ['write'],
      'resources/read': ['read'],
    },
  },
});
```

## Mode 2: External Provider (`type: 'oidc'`)

The MCP server is a **resource server only** — auth is delegated to an external OIDC-compliant provider. Tokens are verified locally via the provider's JWKS endpoint.

### Google

```typescript
export const server = createServer({
  name: 'my-mcp-server',
  version: '1.0.0',
  port: 3000,
  auth: {
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    resourceServerUrl: 'https://mcp.example.com',
    scopesSupported: ['openid', 'email', 'tools:read', 'tools:execute'],
  },
});
```

### Auth0

```typescript
auth: {
  type: 'oidc',
  issuer: 'https://my-tenant.auth0.com',
  resourceServerUrl: 'https://mcp.example.com',
  scopesSupported: ['openid', 'tools:*'],
}
```

### Manual Endpoints (non-OIDC)

For providers that don't support OIDC discovery:

```typescript
auth: {
  type: 'oidc',
  endpoints: {
    authorizationUrl: 'https://custom-auth.example.com/authorize',
    tokenUrl: 'https://custom-auth.example.com/token',
    jwksUri: 'https://custom-auth.example.com/.well-known/jwks.json',
  },
  resourceServerUrl: 'https://mcp.example.com',
  scopesSupported: ['read', 'write'],
}
```

### How OIDC Mode Works

1. Client discovers authorization server via `/.well-known/oauth-protected-resource` (RFC 9728)
2. Client authenticates with the external provider (Google, Auth0, etc.)
3. Client sends Bearer token to MCP server
4. MCP server verifies the JWT locally using the provider's JWKS public keys
5. Scopes from the JWT are checked against per-tool requirements

## Per-Tool IAM (Scope-Based Access Control)

Control which tools require which OAuth scopes. Four levels of configuration, most specific wins:

### 1. Server-Level Defaults

```typescript
export const server = createServer({
  name: 'my-api',
  version: '1.0.0',
  port: 3000,
  auth: {
    type: 'oidc',
    issuer: 'https://accounts.google.com',
    resourceServerUrl: 'https://mcp.example.com',
    scopesSupported: ['openid', 'read', 'write', 'admin'],
    defaultToolScopes: ['read'],  // ALL tools require 'read' by default
  },
  toolScopes: {
    'admin-*': ['admin'],           // Pattern: admin-users, admin-config, etc.
    'delete-*': ['admin', 'write'], // Pattern: delete-records, delete-user
  },
});
```

### 2. Tool-Level Scopes

```typescript
import { createTool } from 'simply-mcp';

export const adminTool = createTool({
  description: 'Admin operation',
  requiredScopes: ['admin'],  // Overrides server default
  params: { action: { type: 'string' } },
  handler: (params) => `Admin: ${params.action}`,
});
```

### 3. Router-Level Scopes

```typescript
import { createRouter } from 'simply-mcp';

export const premiumRouter = createRouter({
  requiredScopes: ['premium'],  // All tools in this router require 'premium'
  tools: [tool1, tool2, tool3],
});
```

### Resolution Priority

| Priority | Source | Example |
|----------|--------|---------|
| 1 (highest) | Tool `requiredScopes` | `createTool({ requiredScopes: ['admin'] })` |
| 2 | Router `requiredScopes` | `createRouter({ requiredScopes: ['premium'] })` |
| 3 | Server `toolScopes` pattern | `toolScopes: { 'admin-*': ['admin'] }` |
| 4 (lowest) | Server `defaultToolScopes` | `defaultToolScopes: ['read']` |

### Wildcard Scopes

Granted scopes support wildcards:
- `tools:*` matches `tools:read`, `tools:write`, `tools:execute`
- `*` matches everything (universal access)

## Static Metadata Generation

Generate `.well-known` files for CDN hosting (Cloudflare Pages, S3, etc.):

```bash
simplymcp generate-metadata \
  --resource https://mcp.example.com \
  --auth-server https://accounts.google.com \
  --scopes "openid,email,tools:read" \
  --output ./dist
```

Or programmatically:

```typescript
import { generateProtectedResourceMetadata, writeMetadataFiles } from 'simply-mcp';

await writeMetadataFiles('./dist', {
  protectedResource: {
    resource: 'https://mcp.example.com',
    authorizationServers: ['https://accounts.google.com'],
    scopesSupported: ['openid', 'email', 'tools:read'],
  },
});
```

## Authorization Flow

### Built-in Provider (`oauth2`)
1. Client requests authorization URL from server
2. User authorizes in browser
3. Provider redirects with authorization code
4. Server exchanges code for tokens (with PKCE S256)
5. Tokens stored for subsequent requests

### External Provider (`oidc`)
1. Client fetches `/.well-known/oauth-protected-resource` from MCP server
2. Client discovers external authorization server
3. Client authenticates with external provider
4. Client sends Bearer token to MCP server
5. MCP server verifies JWT locally via JWKS

## Token Refresh

Tokens are automatically refreshed when expired:

```typescript
auth: {
  type: 'oauth2',
  provider: { /* ... */ },
  tokenRefresh: {
    enabled: true,
    beforeExpiry: 300,  // Refresh 5 minutes before expiry
  },
}
```

## Security Notes

- Always use HTTPS in production
- Store secrets in environment variables
- PKCE S256 is mandatory (OAuth 2.1)
- Validate redirect URIs
- Token rotation is automatic
- RFC 8707 Resource Indicators bind tokens to specific servers
- JWT verification uses Web Crypto API (no external dependencies)

## Spec References

- [MCP Authorization (Nov 2025)](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [RFC 8707 — Resource Indicators](https://www.rfc-editor.org/rfc/rfc8707)
- [RFC 9728 — Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [RFC 8414 — Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)
- [SEP-991 — Client ID Metadata Documents](https://github.com/nichochar/mcp-spec-discussions/discussions/991)
