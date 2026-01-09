# Permem CLI Chat (TypeScript)

A simple CLI chat agent with persistent memory using the Permem SDK.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

3. Make sure Permem server is running (or use hosted version)

## Usage

```bash
bun start
```

Commands:
- Type your message and press Enter
- `clear` - Reset conversation
- `exit` - Save memories and quit
- `Ctrl+C` - Save memories and quit

## How it Works

1. **inject()** - Before each LLM call, retrieves relevant memories from Permem
2. **LLM Call** - Sends message with memory context to the LLM
3. **extract()** - After every 10 messages (or on exit), extracts new memories

Memories persist across sessions, so the assistant remembers previous conversations.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PERMEM_URL` | Permem server URL | `http://localhost:3333` |
| `PERMEM_API_KEY` | API key for authentication | - |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM | Required |
| `USER_ID` | User identifier for memories | `cli-chat-user` |
| `MAX_CONTEXT_TOKENS` | Max context window size | `8000` |
| `EXTRACT_MESSAGE_THRESHOLD` | Extract after N messages | `10` |
