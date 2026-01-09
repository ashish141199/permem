"""
Basic Permem Usage Example

Run: python examples/basic.py
"""

import asyncio
import permem

USER_ID = "demo-user"


async def main():
    # Configure (optional - uses localhost:3333 by default)
    permem.configure(url="http://localhost:3333")

    # Store a memory
    stored = await permem.memorize("User's favorite color is blue", user_id=USER_ID)
    print(f"Stored: {stored.count} memories")

    # Recall memories
    result = await permem.recall("favorite color", user_id=USER_ID)
    print(f"Found: {len(result.memories)} memories")
    for memory in result.memories:
        print(f"- {memory.get('summary')}")


if __name__ == "__main__":
    asyncio.run(main())
