# Testing Simply-MCP Servers with Anthropic Agent SDK

Complete example of testing Simply-MCP servers using the Anthropic Agent SDK (the same client Claude Code uses).

## Code Execution Server Example (Primary Pattern)

```typescript
// code-execution-server.ts
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'code-execution-test-server',
  version: '1.0.0',
  description: 'Test server with code execution',
  codeExecution: {
    timeout: 30000,
    introspectTools: true,
    captureOutput: true,
    embedInstructionsInDescription: true,
  },
  codeExecutionOnly: true,
});

export const greetTool = createTool({
  name: 'greet',  // Explicit name for code execution
  description: 'Greet a person',
  params: { name: { type: 'string', description: 'Name to greet' } },
  handler: async ({ name }) => `Hello, ${name}`
});

export const addTool = createTool({
  name: 'add',  // Explicit name for code execution
  description: 'Add two numbers',
  params: {
    a: { type: 'number', description: 'First number' },
    b: { type: 'number', description: 'Second number' }
  },
  handler: async ({ a, b }) => a + b
});

```

When tested, the AI will compose multiple function calls in a single code_executor invocation:
```javascript
// AI-generated JavaScript in code_executor
const greeting = await greet({ name: "World" });
const sum = await add({ a: 2, b: 3 });
return { greeting, sum };
```

## Traditional Test Server Example

```typescript
// test-server.ts
import { createServer, createTool } from 'simply-mcp';

export const server = createServer({
  name: 'integration-test-server',
  version: '1.0.0',
  description: 'Integration test server for Simply-MCP',
});

export const greetTool = createTool({
  description: 'Greets a person by name',
  params: {
    name: { type: 'string', description: 'The name to greet' }
  },
  handler: async ({ name }) => {
    return `Hello, ${name}! Welcome to Simply-MCP.`;
  }
});
// Tool name: 'greet_tool' (auto-inferred)
```

## Agent SDK Test Client

```typescript
// run-test.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const CLI_PATH = resolve('/path/to/simply-mcp/dist/src/cli/index.js');
const TEST_SERVER_PATH = resolve(__dirname, 'test-server.ts');

const allMessages: any[] = [];

async function runTest() {
  // MCP Server Configuration
  const mcpConfig = {
    'integration-test-server': {
      type: 'stdio' as const,
      command: 'node',
      args: [CLI_PATH, 'run', TEST_SERVER_PATH],
      env: {
        NODE_ENV: 'test',
        MCP_TIMEOUT: '30000', // Required: 30 second timeout
      },
    },
  };

  console.log('Testing MCP server with Agent SDK...\n');

  try {
    // Query with Agent SDK
    for await (const message of query({
      prompt: `Test the integration-test-server:
1. What tools do you see?
2. Use the greet tool with name "Production Test"`,
      options: {
        mcpServers: mcpConfig,
        model: 'haiku', // Use 'haiku', 'sonnet', or 'opus'
        permissionMode: 'bypassPermissions', // CRITICAL: Required for autonomous testing
      },
    })) {
      // Store raw message
      allMessages.push(message);

      // Print raw message
      console.log('📩 RAW MESSAGE:');
      console.log(JSON.stringify(message, null, 2));
      console.log('─'.repeat(80) + '\n');

      // Parse messages by type
      if (message.type === 'system' && message.subtype === 'init') {
        // Contains mcp_servers, tools arrays
        console.log('System Init:', message.mcp_servers, message.tools);
      }

      if (message.type === 'assistant' && message.message) {
        // Text and tool_use are in message.message.content array
        const content = message.message.content;
        if (Array.isArray(content)) {
          content.forEach((block) => {
            if (block.type === 'text') {
              console.log('Text:', block.text);
            }
            if (block.type === 'tool_use') {
              console.log('Tool Call:', block.name, block.input);
            }
          });
        }
      }

      if (message.type === 'user' && message.message) {
        // Tool results are in message.message.content array
        const content = message.message.content;
        if (Array.isArray(content)) {
          content.forEach((block) => {
            if (block.type === 'tool_result') {
              console.log('Tool Result:', block.content);
            }
          });
        }
      }
    }

    // Save messages
    writeFileSync('raw-messages.json', JSON.stringify(allMessages, null, 2));
    console.log(`\n✅ Test complete! ${allMessages.length} messages received`);

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

runTest()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('Fatal:', error);
    process.exit(1);
  });
```

## Package Configuration

```json
{
  "name": "simply-mcp-agent-sdk-test",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --import tsx run-test.ts"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.2",
    "tsx": "^4.19.2"
  }
}
```

## Critical Settings

### 1. Permission Mode (REQUIRED)

```typescript
permissionMode: 'bypassPermissions'  // ✅ Correct - tools execute automatically
permissionMode: 'requirePermissions' // ❌ Wrong - requires manual approval
dangerouslySkipPermissions: true     // ❌ Wrong option name
```

### 2. Model Names

```typescript
model: 'haiku'  // ✅ Correct - defaults to latest
model: 'sonnet' // ✅ Correct - defaults to latest
model: 'opus'   // ✅ Correct - defaults to latest
model: 'claude-3-5-haiku-20241022' // ❌ Wrong - don't use full names
```

### 3. MCP Timeout

```typescript
env: {
  MCP_TIMEOUT: '30000' // ✅ Required - 30 seconds for server startup
}
```

## Expected Output

### Successful Test Output

```
📩 RAW MESSAGE:
{
  "type": "system",
  "subtype": "init",
  "tools": [
    "mcp__integration-test-server__greet"
  ],
  "mcp_servers": [
    {
      "name": "integration-test-server",
      "status": "connected"
    }
  ],
  "permissionMode": "bypassPermissions"
}

📩 RAW MESSAGE:
{
  "type": "assistant",
  "message": {
    "content": [
      {
        "type": "tool_use",
        "name": "mcp__integration-test-server__greet",
        "input": { "name": "Production Test" }
      }
    ]
  }
}

📩 RAW MESSAGE:
{
  "type": "user",
  "message": {
    "content": [
      {
        "type": "tool_result",
        "content": [
          {
            "type": "text",
            "text": "Hello, Production Test! Welcome to Simply-MCP."
          }
        ]
      }
    ]
  }
}

✅ Test complete! 10 messages received
```

## Validation Checklist

- ✅ Server connects (`status: "connected"`)
- ✅ Tools discovered (check `tools` array)
- ✅ Tools execute (`type: "tool_use"`)
- ✅ Tool results return (`type: "tool_result"`)
- ✅ No permission denials (`permission_denials: []`)

## Running the Test

```bash
# Install dependencies
npm install

# Run test
npm test

# Review raw messages
cat raw-messages.json
```

## Troubleshooting

**Server not connecting:**
- Verify CLI path is correct
- Check MCP_TIMEOUT is set to 30000
- Ensure server validates with `--dry-run`

**Permission denied errors:**
- Set `permissionMode: 'bypassPermissions'` ✅
- NOT `dangerouslySkipPermissions` ❌
- **Symptom:** Tool calls return "Claude requested permissions but you haven't granted it yet"
- **Fix:** Add `permissionMode: 'bypassPermissions'` to query options

**No response text / Empty messages:**
- **Symptom:** `message.content` is undefined, response length is 0
- **Cause:** Wrong message structure - text is NOT in `message.content`
- **Fix:** Text is in `message.message.content[]` array with `block.type === 'text'`
- **Example:**
  ```typescript
  // ❌ WRONG - text is NOT here
  if (message.type === 'text') {
    text = message.content; // undefined!
  }

  // ✅ CORRECT - text is in nested content array
  if (message.type === 'assistant' && message.message) {
    message.message.content.forEach(block => {
      if (block.type === 'text') {
        text += block.text; // ✅ works!
      }
    });
  }
  ```

**No tools discovered:**
- Validate server: `npx simply-mcp test-server.ts --dry-run`
- Check tools use `createTool()` factory and are exported
- Verify parameter schemas use IType (the unified type interface)
- **Note:** Tools are in `message.tools` array as strings (e.g., `'mcp__server-name__tool-name'`)

## Reference Implementation

See the complete working example at:
- `simply-mcp-ts-dev/tests/agent-sdk/` (full implementation)
