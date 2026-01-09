"""
Permem SDK Unit Tests
"""

import pytest
from unittest.mock import AsyncMock, patch
from permem import Permem, PermemError


class TestPermemClass:
    """Tests for Permem class."""

    def test_creates_instance_with_defaults(self):
        """Test default configuration."""
        mem = Permem()
        assert mem.config.url == "http://localhost:3333"
        assert mem.config.max_context_length == 8000

    def test_creates_instance_with_custom_config(self):
        """Test custom configuration."""
        mem = Permem(
            url="https://api.example.com",
            api_key="secret",
            max_context_length=4000,
        )
        assert mem.config.url == "https://api.example.com"
        assert mem.config.api_key == "secret"
        assert mem.config.max_context_length == 4000


@pytest.mark.asyncio
class TestMemorize:
    """Tests for memorize method."""

    async def test_memorize_sends_correct_request(self):
        """Test that memorize sends the correct request."""
        mem = Permem()

        mock_response = {
            "stored": True,
            "stored_count": 1,
            "duplicates": 0,
            "results": [
                {
                    "action": "NEW",
                    "memory": {"id": "mem-1", "summary": "Test", "type": "fact"},
                }
            ],
        }

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await mem.memorize("Test memory", user_id="test-user")

            mock_request.assert_called_once_with(
                "POST",
                "/v1/memories",
                json={
                    "content": "Test memory",
                    "userId": "test-user",
                    "conversationId": None,
                    "async": False,
                },
            )

            assert result.stored is True
            assert result.count == 1
            assert len(result.memories) == 1


@pytest.mark.asyncio
class TestRecall:
    """Tests for recall method."""

    async def test_recall_sends_correct_request(self):
        """Test that recall sends the correct request."""
        mem = Permem()

        mock_response = {
            "memories": [
                {"id": "mem-1", "summary": "Test", "type": "fact", "similarity": 0.85}
            ]
        }

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await mem.recall("test query", user_id="test-user", limit=5, mode="balanced")

            mock_request.assert_called_once()
            call_args = mock_request.call_args
            assert call_args[0][0] == "GET"
            assert call_args[0][1] == "/v1/memories/search"

            assert len(result.memories) == 1


@pytest.mark.asyncio
class TestInject:
    """Tests for inject method."""

    async def test_inject_sends_correct_request(self):
        """Test that inject sends the correct request."""
        mem = Permem()

        mock_response = {
            "memories": [],
            "injectionText": "",
            "shouldInject": False,
        }

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await mem.inject("Hello", user_id="test-user")

            assert result.should_inject is False


@pytest.mark.asyncio
class TestExtract:
    """Tests for extract method."""

    async def test_extract_sends_correct_request(self):
        """Test that extract sends the correct request."""
        mem = Permem()

        mock_response = {
            "shouldExtract": False,
            "extracted": [],
            "skippedDuplicates": [],
        }

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = mock_response
            result = await mem.extract(
                [{"role": "user", "content": "Hi"}],
                user_id="test-user"
            )

            assert result.should_extract is False


@pytest.mark.asyncio
class TestHealth:
    """Tests for health method."""

    async def test_health_returns_true_on_success(self):
        """Test health returns true when server is healthy."""
        mem = Permem()

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.return_value = {"status": "ok"}
            result = await mem.health()
            assert result is True

    async def test_health_returns_false_on_error(self):
        """Test health returns false when server is down."""
        mem = Permem()

        with patch.object(mem, "_request", new_callable=AsyncMock) as mock_request:
            mock_request.side_effect = Exception("Connection refused")
            result = await mem.health()
            assert result is False
