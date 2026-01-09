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

async def chat_with_memory(user_message: str, user_id: str):
    async with Permem(api_key="pk_your_api_key") as mem:
        # Before LLM call - inject relevant memories
        context = await mem.inject(user_message, user_id=user_id)

        system_prompt = "You are a helpful assistant."
        if context.should_inject:
            system_prompt += f"\n\n{context.injection_text}"

        # ... call your LLM ...
        assistant_response = "Nice to meet you!"

        # After LLM response - extract new memories
        messages = [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": assistant_response}
        ]
        await mem.extract(messages, user_id=user_id)
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

### inject(message, user_id, context_length=0, conversation_id=None)

Get relevant memories before LLM call. Returns `InjectResponse` with `memories`, `injection_text`, and `should_inject`.

### extract(messages, user_id, context_length=None, conversation_id=None, extract_threshold=None, async_mode=False)

Extract memories from conversation after LLM response. Returns `ExtractResponse` with `should_extract`, `extracted`, and `skipped_duplicates`.

### health()

Check if the Permem server is healthy.

## License

MIT
