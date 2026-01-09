"""
Permem Client - Core client class
"""

import httpx
from typing import Any

from .types import (
    PermemConfig,
    Memory,
    MemorizeResponse,
    MemorizeResult,
    RecallResponse,
    InjectResponse,
    ExtractResponse,
    ChatMessage,
)


class PermemError(Exception):
    """Custom exception for Permem errors."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class Permem:
    """
    Permem Client - Persistent memory for AI.

    Example:
        >>> mem = Permem(user_id="user-123")
        >>> await mem.memorize("User's name is Ashish")
        >>> result = await mem.recall("What is the user's name?")
    """

    def __init__(
        self,
        url: str | None = None,
        api_key: str | None = None,
        max_context_length: int = 8000,
        extract_threshold: float = 0.7,
    ):
        """
        Initialize Permem client.

        Args:
            url: Base URL of Permem server (default: http://localhost:3333)
            api_key: API key for authentication (optional)
            max_context_length: Maximum context length in tokens
            extract_threshold: Threshold for automatic extraction
        """
        self.config = PermemConfig(
            url=url or "http://localhost:3333",
            api_key=api_key,
            max_context_length=max_context_length,
            extract_threshold=extract_threshold,
        )
        self._client = httpx.AsyncClient(timeout=30.0)

    async def _request(
        self,
        method: str,
        path: str,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        """Make HTTP request to the API."""
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["x-api-key"] = self.config.api_key

        url = f"{self.config.url}{path}"

        response = await self._client.request(
            method=method,
            url=url,
            json=json,
            params=params,
            headers=headers,
        )

        if not response.is_success:
            try:
                error_data = response.json()
                message = error_data.get("error", f"HTTP {response.status_code}")
            except Exception:
                message = f"HTTP {response.status_code}"
            raise PermemError(message, response.status_code)

        return response.json()

    async def memorize(
        self,
        content: str,
        user_id: str,
        conversation_id: str | None = None,
        async_mode: bool = False,
    ) -> MemorizeResponse:
        """
        Store a memory.

        Args:
            content: Content to memorize
            user_id: User ID (required)
            conversation_id: Optional conversation ID
            async_mode: Fire-and-forget mode

        Returns:
            MemorizeResponse with stored memories
        """
        response = await self._request(
            "POST",
            "/v1/memories",
            json={
                "content": content,
                "userId": user_id,
                "conversationId": conversation_id,
                "async": async_mode,
            },
        )

        memories = [
            MemorizeResult(
                id=r["memory"]["id"],
                summary=r["memory"]["summary"],
                type=r["memory"]["type"],
                action=r["action"],
            )
            for r in response.get("results", [])
            if r.get("memory")
        ]

        return MemorizeResponse(
            stored=response.get("stored", False),
            count=response.get("stored_count", 0),
            memories=memories,
            duplicates=response.get("duplicates", 0),
        )

    async def recall(
        self,
        query: str,
        user_id: str,
        limit: int = 5,
        mode: str = "balanced",
        conversation_id: str | None = None,
    ) -> RecallResponse:
        """
        Recall memories by semantic search.

        Args:
            query: Search query
            user_id: User ID (required)
            limit: Number of results (default: 5)
            mode: Search mode ('focused', 'balanced', 'creative')
            conversation_id: Optional conversation ID

        Returns:
            RecallResponse with matching memories
        """
        params = {
            "q": query,
            "userId": user_id,
            "limit": str(limit),
            "mode": mode,
        }

        if conversation_id:
            params["conversationId"] = conversation_id

        response = await self._request("GET", "/v1/memories/search", params=params)

        return RecallResponse(memories=response.get("memories", []))

    async def inject(
        self,
        message: str,
        user_id: str,
        context_length: int = 0,
        conversation_id: str | None = None,
    ) -> InjectResponse:
        """
        Inject relevant memories before LLM call.

        Args:
            message: User's message
            user_id: User ID (required)
            context_length: Current context length in tokens
            conversation_id: Optional conversation ID

        Returns:
            InjectResponse with memories and injection text
        """
        response = await self._request(
            "POST",
            "/v1/auto/inbound",
            json={
                "message": message,
                "userId": user_id,
                "conversationId": conversation_id,
                "contextLength": context_length,
                "maxContextLength": self.config.max_context_length,
            },
        )

        return InjectResponse(
            memories=response.get("memories", []),
            injection_text=response.get("injectionText", ""),
            should_inject=response.get("shouldInject", False),
        )

    async def extract(
        self,
        messages: list[ChatMessage],
        user_id: str,
        context_length: int | None = None,
        conversation_id: str | None = None,
        extract_threshold: float | None = None,
        async_mode: bool = False,
    ) -> ExtractResponse:
        """
        Extract memories from conversation after LLM response.

        Args:
            messages: Chat messages
            user_id: User ID (required)
            context_length: Current context length (estimated if not provided)
            conversation_id: Optional conversation ID
            extract_threshold: Threshold for extraction
            async_mode: Fire-and-forget mode

        Returns:
            ExtractResponse with extracted memories
        """
        if context_length is None:
            context_length = sum(len(m["content"]) // 4 for m in messages)

        response = await self._request(
            "POST",
            "/v1/auto/outbound",
            json={
                "messages": messages,
                "userId": user_id,
                "conversationId": conversation_id,
                "contextLength": context_length,
                "maxContextLength": self.config.max_context_length,
                "extractThreshold": extract_threshold or self.config.extract_threshold,
                "async": async_mode,
            },
        )

        return ExtractResponse(
            should_extract=response.get("shouldExtract", False),
            extracted=response.get("extracted", []),
            skipped_duplicates=response.get("skippedDuplicates", []),
        )

    async def health(self) -> bool:
        """Check if server is healthy."""
        try:
            response = await self._request("GET", "/health")
            return response.get("status") == "ok"
        except Exception:
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()

    async def __aenter__(self) -> "Permem":
        return self

    async def __aexit__(self, *args) -> None:
        await self.close()
