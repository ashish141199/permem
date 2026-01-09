# PERMEM

**Automatic memory for any LLM.** Two methods. Batteries included.

Unlike other memory solutions, Permem is fully automatic — it decides what to store, extracts rich context (type, importance, emotions, entities, topics), handles deduplication, and builds a knowledge graph. All behind the scenes.

## Quick Start

### 1. Get your API key

Sign up free at **[permem.dev](https://permem.dev)** → copy your API key from your dashboard.

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
import Permem from 'permem'

const permem = new Permem('pk_your_api_key')

// Before LLM call - inject relevant memories
const { injectionText, shouldInject } = await permem.inject(userMessage, { userId })

// After LLM response - extract new memories
await permem.extract(messages, { userId })
```

**Python:**
```python
from permem import Permem

permem = Permem("pk_your_api_key")

# Before LLM call - inject relevant memories
result = await permem.inject(user_message, user_id=user_id)

# After LLM response - extract new memories
await permem.extract(messages, user_id=user_id)
```

That's it. Permem handles everything else automatically.

---

## How It Works

```
User Message → inject() → [Relevant Memories] → LLM → Response → extract() → [New Memories Stored]
```

1. **`inject()`** - Call before your LLM. Retrieves semantically relevant memories and formats them for your system prompt.

2. **`extract()`** - Call after your LLM response. Analyzes the conversation, identifies new facts, skips duplicates, and stores memories with rich metadata.

---

## Full Example

```typescript
import Permem from 'permem'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const permem = new Permem(process.env.PERMEM_API_KEY)

async function chat(userMessage: string, userId: string) {
  // 1. Inject relevant memories before LLM call
  const { injectionText, shouldInject } = await permem.inject(userMessage, { userId })

  // 2. Build system prompt with memories
  let systemPrompt = "You are a helpful assistant."
  if (shouldInject) {
    systemPrompt += `\n\nRelevant context about this user:\n${injectionText}`
  }

  // 3. Call your LLM
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: userMessage
  })

  // 4. Extract new memories from conversation (fire and forget)
  await permem.extract([
    { role: 'user', content: userMessage },
    { role: 'assistant', content: text }
  ], { userId, async: true })

  return text
}
```

**Python:**
```python
from permem import Permem
from openai import AsyncOpenAI

permem = Permem(os.environ["PERMEM_API_KEY"])
openai = AsyncOpenAI()

async def chat(user_message: str, user_id: str) -> str:
    # 1. Inject relevant memories before LLM call
    inject_result = await permem.inject(user_message, user_id=user_id)

    # 2. Build system prompt with memories
    system_prompt = "You are a helpful assistant."
    if inject_result.should_inject:
        system_prompt += f"\n\nRelevant context about this user:\n{inject_result.injection_text}"

    # 3. Call your LLM
    response = await openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    assistant_message = response.choices[0].message.content

    # 4. Extract new memories from conversation (fire and forget)
    await permem.extract([
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_message}
    ], user_id=user_id, async_mode=True)

    return assistant_message
```

---

## What Makes Permem Different

### Fully Automatic
Other solutions require you to decide what to store. Permem's AI analyzes conversations and automatically:
- Identifies facts worth remembering
- Classifies memory types (fact, preference, goal, relationship, etc.)
- Scores importance (trivial → critical)
- Detects and skips duplicates
- Updates contradicting information

### Rich Metadata
Every memory includes automatically extracted context:
```typescript
{
  summary: "User works at Google as a software engineer",
  type: "fact",
  importance: "high",
  importanceScore: 8,
  emotions: ["pride"],
  entities: { people: ["User"], organizations: ["Google"] },
  topics: ["career", "technology"],
  createdAt: "2024-01-15T..."
}
```

### Knowledge Graph
Memories aren't isolated — they're linked into a graph. Related memories connect automatically. Visualize the full graph per user or across your entire project in the dashboard.

---

## API Reference

### Primary Methods (Automatic)

#### `inject(message, options)`
Retrieve relevant memories before your LLM call.

```typescript
const { memories, injectionText, shouldInject } = await permem.inject(
  "What's my brother's name?",
  {
    userId: 'user-123',
    contextLength: 1000,      // Current context token count (optional)
    conversationId: 'conv-1'  // Filter by conversation (optional)
  }
)
```

#### `extract(messages, options)`
Extract and store memories after your LLM response.

```typescript
await permem.extract(messages, {
  userId: 'user-123',
  conversationId: 'conv-1',   // Associate memories with conversation (optional)
  extractThreshold: 0.7,      // Minimum importance to store (optional)
  async: true                 // Fire and forget (optional)
})
```

### Advanced Methods (Manual Control)

For when you need direct control, or want to use these as tools for AI agents:

#### `memorize(content, options)`
Manually store content as memories.

```typescript
await permem.memorize("User's brother is named Aditya", { userId: 'user-123' })
// AI extracts: "Brother's name is Aditya"
// Automatically skips if duplicate exists
```

#### `recall(query, options)`
Manually search memories by semantic similarity.

```typescript
const { memories } = await permem.recall("family members", {
  userId: 'user-123',
  limit: 5,
  mode: 'balanced'  // 'focused' | 'balanced' | 'creative'
})
```

---

## Configuration

### Environment Variables

```bash
PERMEM_API_KEY=pk_your_api_key    # Your API key from permem.dev
PERMEM_URL=https://api.permem.dev # API endpoint (optional, for self-hosting)
```

### Direct Configuration

**TypeScript:**
```typescript
import Permem from 'permem'

const permem = new Permem('pk_your_api_key', {
  url: 'https://api.permem.dev',  // Optional
  maxContextLength: 8000          // Optional
})
```

**Python:**
```python
from permem import Permem

permem = Permem(
    api_key="pk_your_api_key",
    url="https://api.permem.dev",  # Optional
    max_context_length=8000        # Optional
)
```

---

## Dashboard

Your dashboard at [permem.dev](https://permem.dev) provides:

- **API Key** — Copy and manage your project's API key
- **Memory Stats** — Track usage against your limit (1000 free)
- **Recent Memories** — Browse all stored memories
- **Knowledge Graph** — Visualize memory connections per user

---

## Self-Hosting

Permem is open source. To self-host:

1. Clone the core repo: `git clone https://github.com/ashish141199/permem-core`
2. Set up PostgreSQL with pgvector
3. Configure your OpenAI API key for embeddings
4. Run the server

See [permem-core](https://github.com/ashish141199/permem-core) for detailed setup instructions.

---

## License

MIT
