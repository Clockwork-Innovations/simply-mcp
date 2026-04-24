/**
 * Skill Progressive Disclosure Playground
 *
 * Demonstrates the Anthropic-style progressive disclosure system for skills.
 *
 * Run with: npx simply-mcp dev examples/skill-playground.ts
 *
 * ## How it works:
 *
 * 1. Skills appear as tools in tools/list with camelCase naming (e.g., `codeReview`)
 * 2. When the LLM calls the skill tool:
 *    - Returns the SKILL.md content
 *    - Registers sub-resources (skill://code_review/checklist)
 *    - Activates skill-specific tools (check_security)
 *    - Sends notifications so client refreshes tool/resource lists
 *
 * ## Test scenario:
 *
 * 1. Connect to server
 * 2. Call tools/list - see `codeReview` tool
 * 3. Call `codeReview` tool
 * 4. Observe: Returns skill markdown content
 * 5. Call tools/list again - now includes `check_security`
 * 6. Call resources/list - now includes `skill://code_review/checklist`
 * 7. Call `check_security` tool - works!
 * 8. Read `skill://code_review/checklist` resource - returns checklist content
 */

import { createServer, createTool, createSkill } from 'simply-mcp';

// ============================================================================
// Skill-specific tools (activated when skill is invoked)
// ============================================================================

/**
 * Security check tool - available after codeReview skill is activated
 */
export const checkSecurityTool = createTool({
  name: 'check_security',
  description: 'Check code for security vulnerabilities',
  params: {
    file: {
      type: 'string',
      description: 'File path to analyze'
    },
    severity: {
      type: 'string',
      description: 'Minimum severity level',
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  handler: async ({ file, severity }) => {
    // Simulated security analysis
    return {
      file,
      severity,
      vulnerabilities: [],
      score: 100,
      message: `Security analysis complete for ${file}. No ${severity}+ vulnerabilities found.`
    };
  }
});

/**
 * Pattern analysis tool - available after codeReview skill is activated
 */
export const analyzePatternsTool = createTool({
  name: 'analyze_patterns',
  description: 'Analyze code for patterns and anti-patterns',
  params: {
    file: {
      type: 'string',
      description: 'File path to analyze'
    }
  },
  handler: async ({ file }) => {
    // Simulated pattern analysis
    return {
      file,
      patterns: [
        { name: 'Factory Pattern', count: 2, quality: 'good' },
        { name: 'Singleton', count: 1, quality: 'acceptable' }
      ],
      antiPatterns: [],
      suggestions: ['Consider using dependency injection for better testability']
    };
  }
});

// ============================================================================
// Skills with progressive disclosure
// ============================================================================

/**
 * Code Review Skill - demonstrates full progressive disclosure
 *
 * When invoked:
 * - Returns skill markdown from file
 * - Registers sub-resources (checklist)
 * - Activates skill tools (check_security, analyze_patterns)
 */
export const codeReviewSkill = createSkill({
  name: 'code_review',
  description: 'Review code for quality, security, and best practices. Use when reviewing PRs or auditing code.',
  skill: './skills/code-review.md',

  // Sub-resources registered on skill activation
  subResources: {
    'checklist': './skills/code-review-checklist.md',
    'quick-tips': `## Quick Code Review Tips

1. Read the PR description first
2. Understand the "why" before the "what"
3. Check for tests
4. Look for security issues
5. Consider maintainability`
  },

  // Skill-specific tools activated when skill is invoked
  skillTools: ['check_security', 'analyze_patterns']
});

/**
 * Simple skill without progressive disclosure (for comparison)
 */
export const quickCheckSkill = createSkill({
  name: 'quick_check',
  description: 'Quick code sanity check. Use for simple reviews.',
  skill: `# Quick Check

Just verify:
- No obvious bugs
- Code compiles
- Basic error handling

This is a minimal skill without sub-resources or tools.`
});

// ============================================================================
// Server configuration
// ============================================================================

export const server = createServer({
  name: 'skill-playground',
  version: '1.0.0',
  description: 'Demonstrates skill progressive disclosure'
});
