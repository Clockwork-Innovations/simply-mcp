/**
 * Python Handlers Example
 *
 * Demonstrates using Python for tool handlers - useful for ML, data processing,
 * or integrating existing Python code.
 *
 * Run: npx simplymcp run examples/python-handlers.ts
 */
import { createServer, createTool } from 'simply-mcp';

// =============================================================================
// Server Configuration
// =============================================================================

export const server = createServer({
  name: 'python-handlers-demo',
  version: '1.0.0',
  description: 'Demonstrates Python handler types for tools',
});

// =============================================================================
// Inline Python Code
// =============================================================================

/**
 * Simple inline Python - good for one-liners
 */
export const doubleTool = createTool({
  description: 'Double a number using Python',
  params: {
    x: { type: 'number', description: 'Number to double' },
  },
  handler: {
    type: 'python',
    code: 'RETURN({"doubled": ARGS["x"] * 2})',
  },
});

/**
 * Multi-line inline Python
 */
export const statisticsTool = createTool({
  description: 'Calculate basic statistics for a list of numbers',
  params: {
    numbers: { type: 'array', items: { type: 'number' }, description: 'Numbers to analyze' },
  },
  handler: {
    type: 'python',
    code: `
data = ARGS["numbers"]
if not data:
    RETURN({"error": "Empty data"})

result = {
    "count": len(data),
    "sum": sum(data),
    "min": min(data),
    "max": max(data),
    "mean": sum(data) / len(data),
}
RETURN(result)
`,
  },
});

// =============================================================================
// Python Script File
// =============================================================================

/**
 * For complex logic, use a separate Python file.
 * The script has access to ARGS dict and RETURN() function.
 */
export const analyzeTool = createTool({
  description: 'Analyze data using external Python script',
  params: {
    data: { type: 'array', items: { type: 'number' }, description: 'Data to analyze' },
    algorithm: {
      type: 'string',
      description: 'Analysis algorithm',
      enum: ['basic', 'extended'] as const,
      required: false,
    },
  },
  handler: {
    type: 'python',
    script: './handlers/analyze.py',
    timeout: 30000,
  },
});

// =============================================================================
// Python with Custom Environment
// =============================================================================

/**
 * Pass custom environment variables or use a specific Python interpreter
 */
export const mlPredictTool = createTool({
  description: 'Run ML prediction (requires numpy/sklearn)',
  params: {
    features: { type: 'array', items: { type: 'number' }, description: 'Feature values' },
  },
  handler: {
    type: 'python',
    code: `
import json
features = ARGS["features"]

# Simple linear prediction (replace with actual ML model)
prediction = sum(features) * 0.5 + 10

RETURN({
    "prediction": prediction,
    "confidence": 0.85,
    "features_used": len(features)
})
`,
    timeout: 60000,
    pythonPath: 'python3',  // Or path to venv: './venv/bin/python'
    env: {
      PYTHONDONTWRITEBYTECODE: '1',
    },
  },
});

// =============================================================================
// TypeScript Tool for Comparison
// =============================================================================

/**
 * Same logic in TypeScript - for comparison
 */
export const doubleTypescriptTool = createTool({
  description: 'Double a number using TypeScript',
  params: {
    x: { type: 'number', description: 'Number to double' },
  },
  handler: ({ x }) => ({ doubled: x * 2 }),
});
