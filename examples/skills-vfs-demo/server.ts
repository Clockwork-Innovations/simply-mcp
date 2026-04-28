/**
 * Phase-04 live-test fixture: 3 skills + 1 aliased tool.
 *
 * Three skills — `deploy`, `release-notes`, `oncall-runbook` — land on the
 * agent as `/skills/<slug>/SKILL.md` + siblings. The `deployService` tool
 * registers a `deploy` bash alias so SKILL.md can instruct the agent to call
 * it by name.
 *
 * Run: `npx simplymcp examples/skills-vfs-demo/server.ts`
 */

import {
  createServer,
  createTool,
  createSkill,
  createResource,
} from '../../src/index.js';

// Skill-member tools: `skill:` membership auto-hides from `tools/list`,
// so the agent discovers them via SKILL.md documentation and invokes
// them through `skills_vfs "<alias> …"` rather than as top-level MCP tools.
export const deployService = createTool({
  name: 'deploy_service',
  description: 'Deploy a named service to an env.',
  skill: 'deploy',
  params: {
    name: { type: 'string', description: 'Service name (e.g. billing-api).' },
    env: {
      type: 'string',
      description: 'Target env from the env-matrix.',
      default: 'staging',
    },
  },
  bash: {
    alias: 'deploy',
    args: (argv) => ({ name: argv[0], env: argv[1] ?? 'staging' }),
  },
  handler: async ({ name, env }) => {
    return `ok: deployed ${name} to ${env}`;
  },
});

export const releaseNotesTool = createTool({
  name: 'release_notes',
  description: 'Draft a release-notes blurb from a PR number.',
  skill: 'release_notes',
  params: {
    prNumber: { type: 'string', description: 'PR number (no #).' },
  },
  bash: {
    alias: 'release-notes',
    args: (argv) => ({ prNumber: argv[0] }),
  },
  handler: async ({ prNumber }) => {
    return `Add skills-vfs live-test fixture (#${prNumber}).`;
  },
});

export const deploySkill = createSkill({
  name: 'deploy',
  description: 'Promote a built artifact to an environment.',
  skill: './skills/deploy.md',
  subResources: {
    'env-matrix': './skills/deploy-env-matrix.md',
  },
});

export const releaseNotesSkill = createSkill({
  name: 'release_notes',
  description: 'Draft release-notes blurbs from merged PRs.',
  skill: './skills/release-notes.md',
});

export const oncallRunbookSkill = createSkill({
  name: 'oncall_runbook',
  description: 'First responder procedure for billing-api alerts.',
  skill: './skills/oncall-runbook.md',
  subResources: {
    'contacts.md': './skills/oncall-contacts.md',
  },
});

// --- payment_void: e2e exercise covering SKILL.md + references/ + scripts/ ---
//
// The tool validates both args strictly, so a task that names a PRO-tier
// customer by payment id forces the agent to:
//   1. cat /skills/payment_void/SKILL.md           — procedure
//   2. cat /skills/payment_void/references/approval-codes  — the code
//   3. cat /skills/payment_void/scripts/void-payment — the arg order
// then dispatch `void-payment <paymentId> <approvalCode>`. Any single
// missing step yields an error from the handler.

export const voidPayment = createTool({
  name: 'void_payment',
  description: 'Void a customer payment using the tier-specific approval code.',
  skill: 'payment_void',
  params: {
    paymentId: {
      type: 'string',
      description: 'Payment id; must start with `p_`.',
    },
    approvalCode: {
      type: 'string',
      description: 'Tier approval code from references/approval-codes.',
    },
  },
  bash: {
    alias: 'void-payment',
    args: (argv) => ({ paymentId: argv[0], approvalCode: argv[1] }),
  },
  handler: async ({ paymentId, approvalCode }) => {
    if (!paymentId || !paymentId.startsWith('p_')) {
      return `error: paymentId "${paymentId}" must start with p_ — likely args are in the wrong order`;
    }
    if (!approvalCode || !approvalCode.startsWith('TIER-')) {
      return `error: approvalCode "${approvalCode}" is not a TIER-* code — check references/approval-codes`;
    }
    return `voided payment ${paymentId} with code ${approvalCode}`;
  },
});

export const voidApprovalCodes = createResource({
  uri: 'doc://payment-void/approval-codes',
  name: 'approval-codes',
  description: 'Per-tier approval codes required by void-payment.',
  mimeType: 'text/plain',
  value:
    'tier        approval-code\n' +
    'STANDARD    TIER-STD-2F3K\n' +
    'PRO         TIER-PRO-9Q7X\n' +
    'ENTERPRISE  TIER-ENT-4H8M\n',
});

export const paymentVoidSkill = createSkill({
  name: 'payment_void',
  description: 'Void a customer payment using a tier-specific approval code.',
  skill: './skills/payment-void.md',
  references: [voidApprovalCodes],
});

export const server = createServer({
  name: 'skills-vfs-demo',
  version: '0.1.0',
  description: 'Skills-as-VFS live-test fixture (phase-04).',
});
