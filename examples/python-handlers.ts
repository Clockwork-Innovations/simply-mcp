/**
 * Python Handlers Example
 *
 * Demonstrates using Python for tool handlers - useful for ML, data processing,
 * or integrating existing Python code.
 *
 * Run: npx simplymcp run examples/python-handlers.ts
 *
 * ## Interpreter discovery
 *
 * If `pythonPath` is omitted, the resolver picks the interpreter via this
 * precedence (highest → lowest), starting from the script's directory (or
 * `cwd` for inline code):
 *
 *   1. Explicit `pythonPath` on the handler config
 *   2. `process.env.SIMPLY_MCP_VENV` (bundler venv sidecar; phase-05)
 *   3. `<ancestor>/.venv/bin/python` (walk up to 8 hops)
 *   4. Nearest `pyproject.toml` → `uv python find` (cached by mtime)
 *   5. `<ancestor>/.python-version` → `pyenv` shim
 *   6. `python3` from `$PATH`
 *
 * Set `pythonPath` explicitly to bypass discovery — required when the project
 * `.venv` lacks the packages your handler needs.
 *
 * Full rules: `src/utils/python-venv.ts`.
 */
import { createServer, createTool } from '../src/index.js';

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
// Binary Return (RETURN_BYTES) and Structured Exceptions
// =============================================================================

/**
 * Demonstrates the framed-protocol features added in the v5.16 rewrite:
 *   - `RETURN_BYTES(b)` returns raw bytes; the resolver surfaces them as a
 *     base64-encoded `binary` content block.
 *   - `raise SomeException(...)` produces a structured `PythonHandlerError`
 *     on the TS side with `pythonType`, `pythonTraceback`, and the verbatim
 *     message — no stringy stderr parsing.
 */
export const checksumTool = createTool({
  description: 'Compute SHA-256 of provided text and return the digest as raw bytes',
  params: {
    text: { type: 'string', description: 'Text to hash' },
  },
  handler: {
    type: 'python',
    code: `
import hashlib
data = ARGS["text"].encode("utf-8")
if not data:
    raise ValueError("text must be non-empty")
RETURN_BYTES(hashlib.sha256(data).digest())
`,
  },
});

// =============================================================================
// Pool mode (warm-start) — heavy imports paid once
// =============================================================================

/**
 * `mode: 'pool'` reuses a long-lived interpreter across calls. Heavy imports
 * (`torch`, `numpy`, `pandas`, …) only pay their startup cost on the first
 * call; subsequent calls hit the warm sys.modules cache (~1 ms vs ~1.1 s
 * cold for `import torch`).
 *
 * Pool keys: (pythonPath, cwd, env). Tools sharing a key share workers.
 *
 * Requires torch installed in the chosen `pythonPath` venv.
 */
export const torchPredictTool = createTool({
  description: 'Run a torch tensor op (pool mode — first call cold, rest warm)',
  params: {
    n: { type: 'number', description: 'Tensor side length' },
  },
  handler: {
    type: 'python',
    mode: 'pool',
    maxConcurrent: 2,
    idleTimeoutMs: 60_000,
    code: `
import torch
n = int(ARGS["n"])
t = torch.arange(n * n, dtype=torch.float32).reshape(n, n)
RETURN({"sum": float(t.sum()), "shape": list(t.shape)})
`,
    // pythonPath: '/path/to/venv/bin/python',  // pin to a venv with torch
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
