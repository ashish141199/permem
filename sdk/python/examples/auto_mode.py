"""
Auto Mode Example - Automatic memory injection and extraction

Run: python examples/auto_mode.py
"""

import asyncio
from permem import Permem

USER_ID = "demo-user"


async def chat_with_memory():
    async with Permem() as mem:
        user_message = "My name is Ashish and I love Python"

        # BEFORE LLM call - inject relevant memories
        context = await mem.inject(user_message, user_id=USER_ID)

        system_prompt = "You are a helpful assistant."
        if context.should_inject:
            system_prompt += "\n\n" + context.injection_text
            print(f"Injecting memories: {len(context.memories)}")

        # ... call your LLM here with system_prompt ...
        assistant_response = "Nice to meet you, Ashish! Python is great."

        # AFTER LLM response - extract new memories
        extraction = await mem.extract(
            [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": assistant_response},
            ],
            user_id=USER_ID,
        )

        if extraction.should_extract:
            print(f"Extracted: {len(extraction.extracted)} new memories")


if __name__ == "__main__":
    asyncio.run(chat_with_memory())
