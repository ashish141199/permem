"""
Permem SDK Types
"""

from dataclasses import dataclass, field
from typing import Literal, TypedDict


@dataclass
class PermemConfig:
    """Configuration for Permem client."""
    url: str = "http://localhost:3333"
    api_key: str | None = None
    max_context_length: int = 8000
    extract_threshold: float = 0.7


class Memory(TypedDict, total=False):
    """A memory object."""
    id: str
    summary: str
    type: str
    importance: str
    importance_score: int
    similarity: float
    created_at: str
    topics: list[str]
    emotions: list[str]
    entities: dict


class MemorizeResult(TypedDict, total=False):
    """Result from memorize operation."""
    id: str
    summary: str
    type: str
    action: str


@dataclass
class MemorizeResponse:
    """Response from memorize operation."""
    stored: bool
    count: int
    memories: list[MemorizeResult]
    duplicates: int


@dataclass
class RecallResponse:
    """Response from recall operation."""
    memories: list[Memory]


@dataclass
class InjectResponse:
    """Response from inject operation."""
    memories: list[Memory]
    injection_text: str
    should_inject: bool


class ExtractedMemory(TypedDict):
    """Extracted memory from outbound."""
    id: str
    summary: str
    type: str
    action: str


@dataclass
class ExtractResponse:
    """Response from extract operation."""
    should_extract: bool
    extracted: list[ExtractedMemory]
    skipped_duplicates: list[str]


class ChatMessage(TypedDict):
    """Chat message format."""
    role: Literal["user", "assistant", "system"]
    content: str
