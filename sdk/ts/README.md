# Permem SDK

> Persistent memory for AI - add memory to any LLM in one line

[![npm version](https://badge.fury.io/js/permem.svg)](https://www.npmjs.com/package/permem)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install permem
# or
yarn add permem
# or
bun add permem
```

## Quick Start

```typescript
import permem from 'permem'

// Store a memory
await permem.memorize("User's name is Ashish")

// Recall memories
const { memories } = await permem.recall("What is the user's name?")
console.log(memories[0].summary) // "User's name is Ashish"
```

That's it. Zero config. Just works.

## Usage Modes

### 1. Simple Tools (memorize/recall)

Perfect for explicit memory management:

```typescript
import { memorize, recall } from 'permem'

// Store memories explicitly
await memorize("User prefers dark mode")
await memorize("User's favorite language is TypeScript")

// Search memories semantically
const { memories } = await recall("What are the user's preferences?", {
  limit: 5,
  mode: 'balanced' // 'focused' | 'balanced' | 'creative'
})
```

### 2. Auto Mode (inbound/outbound)

Perfect for chat applications - automatically handles memory injection and extraction:

```typescript
import permem from 'permem'

async function chat(userMessage: string) {
  // INBOUND: Get relevant memories before LLM call
  const { injectionText, shouldInject } = await permem.inbound(userMessage)

  // Build your prompt with memories
  let systemPrompt = "You are a helpful assistant."
  if (shouldInject) {
    systemPrompt += `\n\n${injectionText}`
  }

  // Call your LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  })

  // OUTBOUND: Extract and store new memories
  await permem.outbound([
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response.choices[0].message.content }
  ])

  return response.choices[0].message.content
}
```

## Configuration

### Zero Config (Default)

```typescript
import permem from 'permem'
// Uses http://localhost:3333, userId: 'default'
```

### Environment Variables

```bash
PERMEM_URL=http://localhost:3333
PERMEM_USER_ID=my-user-id
PERMEM_API_KEY=optional-api-key
```

### Programmatic Config

```typescript
import { Permem } from 'permem'

const mem = new Permem({
  url: 'https://api.permem.io',
  userId: 'user-123',
  apiKey: 'your-api-key',
  maxContextLength: 8000,
  extractThreshold: 0.7
})

await mem.memorize("Custom instance memory")
```

### Configure Singleton

```typescript
import { configure, memorize, recall } from 'permem'

configure({
  url: 'https://api.permem.io',
  userId: 'user-123'
})

// Now all singleton functions use this config
await memorize("This uses the configured instance")
```

## API Reference

### memorize(content, options?)

Store a memory.

```typescript
await memorize("User loves TypeScript", {
  conversationId: 'conv-123',
  async: true // Fire-and-forget mode
})
```

**Returns:** `{ stored: boolean, count: number, memories: Memory[], duplicates: number }`

### recall(query, options?)

Search memories semantically.

```typescript
const { memories } = await recall("programming preferences", {
  limit: 10,
  mode: 'creative', // Lower similarity threshold
  conversationId: 'conv-123'
})
```

**Returns:** `{ memories: Memory[] }`

### inbound(message, options?)

Retrieve relevant memories before LLM call.

```typescript
const result = await inbound("Hello, what's my name?", {
  contextLength: 500,
  conversationId: 'conv-123'
})

// result.memories - Array of relevant memories
// result.injectionText - Pre-formatted text to inject
// result.shouldInject - Whether injection is recommended
```

### outbound(messages, options?)

Extract memories from conversation after LLM response.

```typescript
await outbound([
  { role: 'user', content: 'I work at Google' },
  { role: 'assistant', content: 'That\'s great!' }
], {
  contextLength: 1000,
  extractThreshold: 0.7,
  async: true // Fire-and-forget
})
```

**Returns:** `{ shouldExtract: boolean, extracted: Memory[], skippedDuplicates: string[] }`

## Types

```typescript
interface Memory {
  id: string
  summary: string
  type: 'core' | 'fact' | 'preference' | 'event' | 'insight' | ...
  importance: 'trivial' | 'low' | 'medium' | 'high' | 'critical'
  importanceScore: number
  similarity?: number
  createdAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
```

## Error Handling

```typescript
import { PermemError } from 'permem'

try {
  await memorize("test")
} catch (error) {
  if (error instanceof PermemError) {
    console.log(error.message)    // Error message
    console.log(error.statusCode) // HTTP status code
  }
}
```

## Server Setup

The SDK connects to a Permem server. Run the server locally:

```bash
# Clone and setup
git clone https://github.com/ashish141199/permem.git
cd permem
bun install

# Configure database (PostgreSQL with pgvector)
cp .env.example .env
# Edit .env with your database URL

# Run migrations
bun run db:migrate

# Start server
bun run server
```

Server runs at `http://localhost:3333` by default.

## License

MIT
