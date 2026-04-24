/**
 * Complete Simply-MCP Server Example
 *
 * Demonstrates all core features using factory functions:
 * - createServer() - Server configuration
 * - createTool() - Tool definitions
 * - createType() - Reusable parameter schemas
 * - createPrompt() - Prompt definitions
 * - createResource() - Resource definitions
 * - createApp() - App/UI definitions
 * - createRouter() - Tool grouping
 * - createCompletion() - Autocomplete
 *
 * Run: npx simplymcp run examples/complete.ts
 * Lint: npx simplymcp lint examples/complete.ts
 */

import {
  createServer,
  createTool,
  createType,
  createPrompt,
  createResource,
  createApp,
  createRouter,
  createCompletion,
} from 'simply-mcp';

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

export const server = createServer({
  name: 'complete-example',
  version: '1.0.0',
  description: 'Complete example demonstrating all Simply-MCP features',

  // Optional: HTTP mode with authentication
  // port: 3000,
  // auth: {
  //   type: 'apiKey',
  //   keys: [{ name: 'admin', key: 'secret-key', permissions: ['*'] }],
  // },
});

// ============================================================================
// REUSABLE PARAMETERS
// ============================================================================

// Define reusable parameter schemas with createType()
const emailParam = createType({
  type: 'string',
  description: 'Email address',
  format: 'email',
});

const locationParam = createType({
  type: 'string',
  description: 'City name',
  minLength: 1,
});

const userIdParam = createType({
  type: 'string',
  description: 'User ID',
  pattern: '^[a-zA-Z0-9-]+$',
});

// ============================================================================
// TOOLS
// ============================================================================

// Zero-param tool - name inferred as 'ping_tool'
export const pingTool = createTool({
  description: 'Health check endpoint',
  handler: () => ({ status: 'ok', timestamp: new Date().toISOString() }),
});

// Tool with parameters - full type inference
export const addTool = createTool({
  description: 'Add two numbers together',
  params: {
    a: { type: 'number', description: 'First number' },
    b: { type: 'number', description: 'Second number' },
  },
  handler: ({ a, b }) => ({ sum: a + b }),
});

// Tool with optional parameters
export const greetTool = createTool({
  description: 'Greet a user',
  params: {
    name: { type: 'string', description: 'Name to greet' },
    formal: { type: 'boolean', description: 'Use formal greeting', required: false },
  },
  handler: ({ name, formal }) => {
    const greeting = formal ? 'Good day' : 'Hello';
    return `${greeting}, ${name}!`;
  },
});

// Tool with annotations (for permission systems)
export const deleteUserTool = createTool({
  description: 'Delete a user account',
  params: {
    userId: userIdParam, // Reuse the param schema
  },
  annotations: {
    destructiveHint: true,
    requiresConfirmation: true,
    category: 'admin',
  },
  handler: ({ userId }) => ({ deleted: true, userId }),
});

// Tool demonstrating reusable email param
export const sendEmailTool = createTool({
  description: 'Send an email to a user',
  params: {
    to: emailParam, // Reuse the email param
    subject: { type: 'string', description: 'Subject line' },
    body: { type: 'string', description: 'Email body' },
  },
  handler: ({ to, subject, body }) => ({
    sent: true,
    to,
    subject,
    bodyLength: body.length,
  }),
});

// Weather tools for router example - reusing locationParam
export const getWeatherTool = createTool({
  description: 'Get weather for a location',
  params: {
    location: locationParam, // Reuse the location param
    units: { type: 'string', description: 'Temperature units', enum: ['celsius', 'fahrenheit'] as const },
  },
  handler: ({ location, units }) => {
    const temp = units === 'celsius' ? 22 : 72;
    return {
      location,
      temperature: temp,
      units,
      conditions: 'Sunny',
    };
  },
});

export const getForecastTool = createTool({
  description: 'Get weather forecast',
  params: {
    location: locationParam, // Reuse the location param
    days: { type: 'number', description: 'Number of days' },
  },
  handler: ({ location, days }) => {
    const forecasts = Array.from({ length: days }, (_, i) => ({
      day: `Day ${i + 1}`,
      high: 75 + Math.floor(Math.random() * 10),
      low: 60 + Math.floor(Math.random() * 10),
    }));
    return { location, forecasts };
  },
});

// ============================================================================
// PROMPTS
// ============================================================================

export const greetingPrompt = createPrompt({
  name: 'greeting',
  description: 'Generate a personalized greeting',
  args: {
    name: { description: 'Person to greet' },
    style: { description: 'Greeting style', enum: ['formal', 'casual', 'friendly'] as const },
  },
  handler: ({ name, style }) => {
    const greetings = {
      formal: `Good day, ${name}. How may I assist you today?`,
      casual: `Hey ${name}! What's up?`,
      friendly: `Hi ${name}! Great to see you!`,
    };
    return greetings[style] || greetings.casual;
  },
});

// ============================================================================
// RESOURCES
// ============================================================================

// Static resource with createResource
export const appConfigResource = createResource({
  uri: 'config://app',
  name: 'App Configuration',
  description: 'Application configuration settings',
  mimeType: 'application/json',
  value: { version: '1.0.0', environment: 'development', features: ['auth', 'logging'] },
});

// Dynamic resource with createResource - types inferred from URI
export const serverStatsResource = createResource({
  uri: 'stats://server',
  name: 'Server Stats',
  description: 'Real-time server statistics',
  mimeType: 'application/json',
  handler: () => ({
    uptime: process.uptime(),
    requests: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
  }),
});

// Resource with URI parameters - automatic type inference!
export const userResource = createResource({
  uri: 'api://users/{userId}',
  name: 'User',
  description: 'Get user by ID',
  mimeType: 'application/json',
  // userId is automatically typed as string from the URI template
  handler: ({ userId }) => ({
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
  }),
});

// Resource with multiple URI parameters
export const userPostResource = createResource({
  uri: 'api://users/{userId}/posts/{postId}',
  name: 'User Post',
  description: 'Get a specific post by user',
  mimeType: 'application/json',
  // Both userId and postId are typed as string
  handler: ({ userId, postId }) => ({
    id: postId,
    userId,
    title: `Post ${postId} by User ${userId}`,
    content: 'Example content...',
  }),
});

// ============================================================================
// APPS (UI)
// ============================================================================

// App with inline HTML source
export const dashboardApp = createApp({
  uri: 'ui://dashboard',
  name: 'Dashboard',
  description: 'Server status dashboard',
  source: `
    <div style="font-family: system-ui; padding: 2rem; background: #f5f5f5;">
      <h1 style="color: #333;">Server Dashboard</h1>
      <p>Status: <span style="color: green;">Online</span></p>
    </div>
  `,
  size: { width: 400, height: 200 },
});

// App with tools (links tools to UI)
export const calculatorApp = createApp({
  uri: 'ui://calculator',
  name: 'Calculator',
  description: 'Simple calculator UI',
  component: './components/Calculator.tsx',
  tools: [addTool], // Tools this app can call
  size: { width: 300, height: 400 },
});

// ============================================================================
// ROUTERS (Tool Grouping)
// ============================================================================

// Router groups related tools
export const weatherRouter = createRouter({
  name: 'weather',
  description: 'Weather information tools',
  tools: [getWeatherTool, getForecastTool],
});

// ============================================================================
// COMPLETIONS (Autocomplete)
// ============================================================================

export const cityComplete = createCompletion({
  name: 'city_autocomplete',
  description: 'Autocomplete city names',
  ref: { type: 'argument', name: 'location' },
  handler: async (value) => {
    const cities = [
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Phoenix',
      'Philadelphia',
      'San Antonio',
      'San Diego',
      'Dallas',
      'San Jose',
    ];
    return cities.filter((c) => c.toLowerCase().startsWith(value.toLowerCase()));
  },
});
