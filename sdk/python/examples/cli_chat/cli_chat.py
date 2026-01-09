#!/usr/bin/env python3
"""
CLI Chat Agent with Permem Memory Integration

Uses the Permem SDK for automatic memory injection and extraction.

Features:
- inject() before LLM call to get relevant memories
- extract() after LLM response to store new memories
- Conversation history with automatic context management
"""

import asyncio
import os
import time
from typing import List, Dict

from dotenv import load_dotenv
from openai import AsyncOpenAI
from permem import Permem

load_dotenv()

# Configuration
USER_ID = os.getenv("USER_ID", "cli-chat-user")
MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "8000"))
EXTRACT_MESSAGE_THRESHOLD = int(os.getenv("EXTRACT_MESSAGE_THRESHOLD", "10"))

# Initialize OpenAI client (using OpenRouter)
openai = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Conversation state
messages: List[Dict[str, str]] = []
conversation_id = f"conv-{int(time.time() * 1000)}"
last_extraction_count = 0


def estimate_tokens(text: str) -> int:
    """Estimate token count (rough: 4 chars = 1 token)"""
    return len(text) // 4 + 1


def get_context_length() -> int:
    """Get current context length"""
    return sum(estimate_tokens(m["content"]) for m in messages)


def should_extract() -> bool:
    """Check if we should extract memories"""
    messages_since_extraction = len(messages) - last_extraction_count
    return messages_since_extraction >= EXTRACT_MESSAGE_THRESHOLD


async def extract_memories(permem: Permem, force: bool = False) -> None:
    """Extract memories from conversation"""
    global last_extraction_count, messages

    if not messages:
        return
    if not force and len(messages) <= last_extraction_count:
        return
    if not force and not should_extract():
        return

    try:
        result = await permem.extract(
            messages,
            user_id=USER_ID,
            conversation_id=conversation_id,
        )

        if result.extracted and len(result.extracted) > 0:
            print(f"\n[Permem] Extracted {len(result.extracted)} memories:")
            for m in result.extracted:
                print(f"  + {m['summary']}")

        if result.skipped_duplicates and len(result.skipped_duplicates) > 0:
            print(f"[Permem] Skipped {len(result.skipped_duplicates)} duplicates")

        if (result.extracted and len(result.extracted) > 0) or (
            result.skipped_duplicates and len(result.skipped_duplicates) > 0
        ):
            last_extraction_count = len(messages)

            # Trim old messages to keep context manageable
            if len(messages) > 10:
                messages = messages[-10:]
                last_extraction_count = len(messages)
                print("[Permem] Trimmed to last 10 messages")
            print("")
    except Exception:
        # Silent fail - memory is optional
        pass


async def chat(permem: Permem, user_message: str) -> str:
    """Generate AI response with memory integration"""
    global messages

    # 1. INJECT: Get relevant memories before LLM call
    memory_context = ""
    try:
        inject_result = await permem.inject(
            user_message,
            user_id=USER_ID,
            context_length=get_context_length(),
            conversation_id=conversation_id,
        )

        if inject_result.should_inject and inject_result.injection_text:
            memory_context = inject_result.injection_text
    except Exception:
        # Silent fail
        pass

    # 2. Build system prompt with memories
    system_prompt = "You are a helpful assistant with long-term memory."
    if memory_context:
        system_prompt += f"\n\nRelevant memories about this user:\n{memory_context}\n\nUse these to personalize your responses."

    # 3. Add user message to history
    messages.append({"role": "user", "content": user_message})

    # 4. Generate response
    response = await openai.chat.completions.create(
        model="google/gemini-2.0-flash-001",
        messages=[{"role": "system", "content": system_prompt}] + messages,
    )

    assistant_message = response.choices[0].message.content or ""

    # 5. Add assistant response to history
    messages.append({"role": "assistant", "content": assistant_message})

    # 6. EXTRACT: Store new memories if threshold reached
    await extract_memories(permem)

    return assistant_message


async def main():
    """Main CLI loop"""
    global messages, conversation_id, last_extraction_count

    async with Permem(
        url=os.getenv("PERMEM_URL", "http://localhost:3333"),
        api_key=os.getenv("PERMEM_API_KEY"),
        max_context_length=MAX_CONTEXT_TOKENS,
    ) as permem:
        print("================================")
        print("  Permem CLI Chat")
        print("================================")
        print(f"User: {USER_ID}")
        print(f"Server: {permem.url}")
        print('Commands: "exit", "clear"\n')

        while True:
            try:
                user_input = input("You: ").strip()

                if not user_input:
                    continue

                if user_input.lower() == "exit":
                    print("Saving memories...")
                    await extract_memories(permem, force=True)
                    print("Goodbye!")
                    break

                if user_input.lower() == "clear":
                    messages = []
                    conversation_id = f"conv-{int(time.time() * 1000)}"
                    last_extraction_count = 0
                    print("Conversation cleared.\n")
                    continue

                response = await chat(permem, user_input)
                print(f"\nAssistant: {response}\n")

            except KeyboardInterrupt:
                print("\nSaving memories...")
                await extract_memories(permem, force=True)
                print("Goodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
