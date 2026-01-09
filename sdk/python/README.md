# Permem Python SDK

Persistent memory for AI - add memory to any LLM in one line.

## Installation

```bash
pip install permem
```

## Quick Start

```python
import asyncio
import permem

async def main():
    # Store a memory
    await permem.memorize("User's name is Ashish")

    # Recall memories
    result = await permem.recall("What is the user's name?")
    for memory in result.memories:
        print(memory["summary"])

asyncio.run(main())
```

## Usage Modes

### Tools Mode (Manual Control)

```python
from permem import Permem

async def main():
    mem = Permem(user_id="user-123")

    # Store memories
    await mem.memorize("User prefers dark mode")

    # Search memories
    result = await mem.recall("user preferences", limit=5)
```

### Auto Mode (Automatic Memory Management)

```python
from permem import Permem

async def chat_with_memory():
    mem = Permem(user_id="user-123")

    user_message = "My favorite color is blue"

    # Before LLM call - get relevant memories
    context = await mem.inbound(user_message)
    if context.should_inject:
        system_prompt += context.injection_text

    # ... call your LLM ...

    # After LLM response - extract new memories
    messages = [
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_response}
    ]
    await mem.outbound(messages)
```

## Configuration

### Environment Variables

```bash
export PERMEM_URL="http://localhost:3333"
export PERMEM_USER_ID="default"
export PERMEM_API_KEY="your-api-key"
```

### Programmatic Configuration

```python
from permem import Permem, configure

# Configure singleton
configure(
    url="http://localhost:3333",
    user_id="user-123",
    api_key="your-api-key"
)

# Or create instance
mem = Permem(
    url="http://localhost:3333",
    user_id="user-123",
    api_key="your-api-key",
    max_context_length=8000
)
```

## API Reference

### memorize(content, conversation_id=None, async_mode=False)

Store a memory.

### recall(query, limit=5, mode="balanced", conversation_id=None)

Search memories by semantic similarity.

Modes:
- `"focused"` - Higher precision, fewer results
- `"balanced"` - Default balance
- `"creative"` - Broader matches

### inbound(message, context_length=0, conversation_id=None)

Get relevant memories before LLM call.

### outbound(messages, context_length=None, conversation_id=None, extract_threshold=None, async_mode=False)

Extract memories from conversation after LLM response.

### health()

Check if the Permem server is healthy.

## License

MIT
