# MCP Compliance Report: Simply-MCP

**Status:** ✅ Tier 1 Compatible Community Framework
**Spec Version:** 2025-11-25
**Last Audit:** April 28, 2026

This document tracks the compliance of `simply-mcp` with the Model Context Protocol (MCP) core specification and Specification Enhancement Proposals (SEPs).

## Core Protocol Support

| Feature | Support | Details |
| :--- | :---: | :--- |
| **JSON-RPC 2.0** | ✅ | Full bidirectional async support |
| **Initialization** | ✅ | Version negotiation & capability discovery |
| **Tools** | ✅ | Full schema validation via Zod; execution & error handling |
| **Resources** | ✅ | List, read, and template support; subscription updates |
| **Prompts** | ✅ | List and get; dynamic argument validation |
| **Transports** | ✅ | Native support for Stdio and SSE (via Hono) |

## Specification Enhancement Proposals (SEPs)

| SEP # | Name | Support | Implementation Detail |
| :--- | :--- | :---: | :--- |
| **SEP-1865** | **MCP Apps (Rich UI)** | ✅ | Full `ui://` resource and App bridge support |
| **SEP-1036** | **URL Elicitation** | ✅ | Secure out-of-band interaction mode |
| **SEP-1577** | **Sampling with Tools** | ✅ | `createMessage` with `includeContext` support |
| **SEP-2339** | **Task Continuity** | ✅ | Async background tasks with polling/cancellation |
| **SEP-1303** | **Validation Errors** | ✅ | Tool errors returned as standard execution failures |
| **SEP-986** | **Tool Naming** | ✅ | Automated `snake_case` enforcement & warnings |
| **SEP-1411** | **Structured Content** | ✅ | Separation of display text vs. programmatic results |
| **SEP-973** | **Icons** | ✅ | Multi-theme icon support for all primitives |
| **SEP-991** | **CIMD (OAuth Meta)** | ✅ | Client ID Metadata Document validation |
| **SEP-1046** | **OAuth Credentials** | ✅ | Client credentials grant flow support |
| **SEP-1413** | **Namespacing** | ✅ | `router__tool` format for multi-router servers |

## Security & Verification

- **Content Security Policy:** Implements SEP-1865 compliant `connect-src 'none'` for sandboxed UI.
- **Output Sanitization:** Optional built-in sanitization for LLM tool results.
- **Validation:** 100% test coverage for protocol-level message handling.

## Tier 1 Compatibility Statement

`simply-mcp` satisfies all technical requirements for a **Tier 1 Reference Implementation** as defined by the MCP SDK tiering system:
1. Full coverage of the 2025-11-25 specification.
2. Support for all Standards Track SEPs.
3. Bidirectional transport support (Stdio/SSE).
4. Production-ready security defaults and validation.
