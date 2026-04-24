/**
 * Oversized-description reproducer.
 *
 * Registers a single tool whose `description` deliberately exceeds the
 * 2048-char ceiling that Claude Code enforces on MCP tool descriptions
 * (see skills/build-a-simply-mcp-server/references/claude-code-desc-truncation.md).
 *
 * Boot this server and inspect what the client actually receives:
 *
 *   simply-mcp inspect examples/oversized-description.ts  # prints length/tokens
 *
 *   simply-mcp examples/oversized-description.ts          # stdio
 *   # ...then from an MCP client, call tools/list — CC clients will show
 *   # the description truncated with "…[truncated]" while other clients
 *   # (Claude Desktop, Inspector) will show the full body.
 *
 * After patching CC via scripts/patch-claude-desc-limit.sh, the same
 * tools/list call returns the full description up to 15KB.
 */

import { createServer, createTool } from 'simply-mcp';

const paddingLine = 'This line exists solely to push the description past the Claude Code 2KB MCP description truncation limit. ';
const oversizedDescription = [
  '# Oversized tool description fixture.',
  '',
  'This description is intentionally longer than 2048 chars so that Claude',
  'Code clients truncate it. Use this server to verify the detection flow',
  'documented in references/claude-code-desc-truncation.md.',
  '',
  paddingLine.repeat(25),
].join('\n');

export const server = createServer({
  name: 'oversized-desc-demo',
  version: '1.0.0',
});

export const ping = createTool({
  description: oversizedDescription,
  params: {},
  handler: () => 'pong',
});
