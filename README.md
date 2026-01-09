# Permem

Add persistent memory to any LLM in one line.

```typescript
await permem.memorize("User's name is Ashish", { userId: 'user-123' })
```

## Get Started

### 1. Get your API key

Sign up free at **[permem.dev](https://permem.dev)** → copy your API key.

### 2. Install

```bash
# TypeScript / JavaScript
npm install permem

# Python
pip install permem
```

### 3. Use

**TypeScript:**
```typescript
import permem from 'permem'

// Store a memory
await permem.memorize("User loves coffee", { userId: 'user-123' })

// Recall memories
const { memories } = await permem.recall("What does the user like?", { userId: 'user-123' })
```

**Python:**
```python
from permem import permem

# Store a memory
await permem.memorize("User loves coffee", user_id="user-123")

# Recall memories
result = await permem.recall("What does the user like?", user_id="user-123")
```

## Environment Variables

```bash
PERMEM_URL=https://api.permem.dev    # API endpoint
PERMEM_API_KEY=your-api-key          # Your API key from permem.dev
```

Or configure directly:

```typescript
import { configure } from 'permem'
configure({ url: 'https://api.permem.dev', apiKey: 'your-api-key' })
```

---

## Core Methods

### `memorize(content, options)`

Store a memory. AI automatically extracts facts and deduplicates.

```typescript
await permem.memorize("My brother's name is Aditya and I love hiking", {
  userId: 'user-123'
})
// Extracts: "Brother's name is Aditya" + "Loves hiking"
// Skips duplicates automatically
```

### `recall(query, options)`

Search memories by semantic similarity.

```typescript
const { memories } = await permem.recall("family members", {
  userId: 'user-123',
  limit: 5,
  mode: 'balanced'  // 'focused' | 'balanced' | 'creative'
})

for (const m of memories) {
  console.log(m.summary, m.type, m.similarity)
}
```

---

## Auto Mode

For chat applications - automatically inject context and extract memories.

### `inject(message, options)`

Call **before** sending to LLM. Returns relevant memories to add to context.

```typescript
const { injectionText, shouldInject } = await permem.inject(
  "What's my brother's name?",
  { userId: 'user-123' }
)

if (shouldInject) {
  systemPrompt += injectionText
}
```

### `extract(messages, options)`

Call **after** LLM response. Extracts and stores new memories from conversation.

```typescript
await permem.extract([
  { role: 'user', content: 'I just got a new job at Google' },
  { role: 'assistant', content: 'Congratulations on your new job at Google!' }
], {
  userId: 'user-123',
  async: true  // Fire and forget
})
```

---

## Full Example

```typescript
import permem from 'permem'

async function chat(userMessage: string, userId: string) {
  // 1. Inject relevant memories
  const { injectionText, shouldInject } = await permem.inject(userMessage, { userId })

  // 2. Build prompt with memories
  let systemPrompt = "You are a helpful assistant."
  if (shouldInject) {
    systemPrompt += `\n\nUser context:\n${injectionText}`
  }

  // 3. Call your LLM
  const response = await llm.chat({
    system: systemPrompt,
    message: userMessage
  })

  // 4. Extract memories from conversation
  await permem.extract([
    { role: 'user', content: userMessage },
    { role: 'assistant', content: response }
  ], { userId, async: true })

  return response
}
```

---

## License

MIT
