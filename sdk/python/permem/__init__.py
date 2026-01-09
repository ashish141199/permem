"""
Permem SDK - Persistent memory for AI

Add memory to any LLM in one line.

Example:
    >>> import permem
    >>> await permem.memorize("User's name is Ashish", user_id="user-123")
    >>> result = await permem.recall("What is the user's name?", user_id="user-123")
"""

from .client import Permem, PermemError
from .types import (
    PermemConfig,
    Memory,
    MemorizeResponse,
    RecallResponse,
    InjectResponse,
    ExtractResponse,
    ChatMessage,
)

__version__ = "0.1.0"
__all__ = [
    "Permem",
    "PermemError",
    "PermemConfig",
    "Memory",
    "MemorizeResponse",
    "RecallResponse",
    "InjectResponse",
    "ExtractResponse",
    "ChatMessage",
    # Singleton functions
    "configure",
    "memorize",
    "recall",
    "inject",
    "extract",
]

# Singleton instance
_instance: Permem | None = None


def _get_instance() -> Permem:
    """Get or create the singleton instance."""
    global _instance
    if _instance is None:
        import os
        _instance = Permem(
            url=os.environ.get("PERMEM_URL"),
            api_key=os.environ.get("PERMEM_API_KEY"),
        )
    return _instance


def configure(
    url: str | None = None,
    api_key: str | None = None,
    **kwargs
) -> None:
    """Configure the singleton instance."""
    global _instance
    _instance = Permem(url=url, api_key=api_key, **kwargs)


async def memorize(content: str, user_id: str, **kwargs) -> MemorizeResponse:
    """Store a memory using the singleton instance."""
    return await _get_instance().memorize(content, user_id=user_id, **kwargs)


async def recall(query: str, user_id: str, **kwargs) -> RecallResponse:
    """Recall memories using the singleton instance."""
    return await _get_instance().recall(query, user_id=user_id, **kwargs)


async def inject(message: str, user_id: str, **kwargs) -> InjectResponse:
    """Inject relevant memories before LLM call."""
    return await _get_instance().inject(message, user_id=user_id, **kwargs)


async def extract(messages: list[ChatMessage], user_id: str, **kwargs) -> ExtractResponse:
    """Extract memories from conversation after LLM response."""
    return await _get_instance().extract(messages, user_id=user_id, **kwargs)
