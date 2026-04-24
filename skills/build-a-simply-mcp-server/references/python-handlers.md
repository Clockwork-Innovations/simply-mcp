# Python Handlers — Full Reference

Tools can delegate execution to Python for ML/data processing tasks.

## Inline Python

```typescript
export const doubleTool = createTool({
  description: 'Double a number',
  params: { x: { type: 'number', description: 'Number to double' } },
  handler: {
    type: 'python',
    code: 'RETURN({"doubled": ARGS["x"] * 2})',
  },
});
```

## Python Script File

```typescript
export const analyzeTool = createTool({
  description: 'Analyze data array',
  params: { data: { type: 'array', items: { type: 'number' }, description: 'Numbers' } },
  handler: {
    type: 'python',
    script: './handlers/analyze.py',
    timeout: 30000,
  },
});
```

**Script** (`handlers/analyze.py`):
```python
data = ARGS["data"]
RETURN({
    "count": len(data),
    "sum": sum(data),
    "mean": sum(data) / len(data) if data else None,
})
```

`ARGS` and `RETURN` are injected by the callPython wrapper.

## Handler Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'python'` | required | Handler type |
| `code` | `string` | - | Inline Python (exclusive with `script`) |
| `script` | `string` | - | Path to .py file (exclusive with `code`) |
| `timeout` | `number` | 30000 | Execution timeout (ms) |
| `pythonPath` | `string` | `'python3'` | Python executable |
| `cwd` | `string` | script dir | Working directory |
| `env` | `Record<string,string>` | - | Extra environment variables |

## When to Use

- **ML/AI tasks**: NumPy, scikit-learn, PyTorch
- **Data processing**: Pandas, complex calculations
- **Existing Python code**: Wrap scripts without rewriting
- **Polyglot servers**: Mix TypeScript orchestration with Python computation
