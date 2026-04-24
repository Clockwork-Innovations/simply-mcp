# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0-rc.1]

### Changed
- **Breaking: Docker and Firecracker execution modes removed** — QuickJS (WASM) is the sole execution backend; covers Node.js, Bun, and Cloudflare Workers.
- **Breaking: `--http` and `--http-stateless` CLI flags removed** — use `createServer({ port })` / `createServer({ stateful: true })` instead.
- **`bash_vfs` → `skills_vfs` rename** — all user-facing vocabulary (docs, README, SKILL.md, examples) updated to reflect the skills-as-VFS paradigm.

### Fixed
- `toolMeta` channel implemented end-to-end (`IExecutionResult.toolMeta`); `_getToolsDescription` variadic fix for QuickJS dispatch protocol.

### Infrastructure
- Full unit + integration test suite green.
