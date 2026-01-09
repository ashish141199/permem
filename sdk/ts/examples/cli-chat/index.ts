#!/usr/bin/env node
/**
 * CLI Chat Agent with Permem Memory Integration
 *
 * Uses the Permem SDK for automatic memory injection and extraction.
 *
 * Features:
 * - inject() before LLM call to get relevant memories
 * - extract() after LLM response to store new memories
 * - Conversation history with automatic context management
 */

import { Permem } from 'permem';
import { generateText, type CoreMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import * as readline from 'readline';
import 'dotenv/config';

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Configuration
const USER_ID = process.env.USER_ID || 'cli-chat-user';
const MAX_CONTEXT_TOKENS = parseInt(process.env.MAX_CONTEXT_TOKENS || '8000', 10);
const EXTRACT_MESSAGE_THRESHOLD = parseInt(process.env.EXTRACT_MESSAGE_THRESHOLD || '10', 10);

// Initialize Permem SDK
const permem = new Permem({
  url: process.env.PERMEM_URL || 'http://localhost:3333',
  apiKey: process.env.PERMEM_API_KEY,
  maxContextLength: MAX_CONTEXT_TOKENS,
});

// Conversation state
let messages: CoreMessage[] = [];
let conversationId = `conv-${Date.now()}`;
let lastExtractionCount = 0;

/**
 * Estimate token count (rough: 4 chars = 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get current context length
 */
function getContextLength(): number {
  return messages.reduce((sum, m) => {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    return sum + estimateTokens(content);
  }, 0);
}

/**
 * Check if we should extract memories
 */
function shouldExtract(): boolean {
  const messagesSinceExtraction = messages.length - lastExtractionCount;
  return messagesSinceExtraction >= EXTRACT_MESSAGE_THRESHOLD;
}

/**
 * Extract memories from conversation
 */
async function extractMemories(force: boolean = false): Promise<void> {
  if (messages.length === 0) return;
  if (!force && messages.length <= lastExtractionCount) return;
  if (!force && !shouldExtract()) return;

  try {
    const formattedMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    const result = await permem.extract(formattedMessages, {
      userId: USER_ID,
      conversationId,
    });

    if (result.extracted?.length > 0) {
      console.log(`\n[Permem] Extracted ${result.extracted.length} memories:`);
      result.extracted.forEach((m) => {
        console.log(`  + ${m.summary}`);
      });
    }

    if (result.skippedDuplicates?.length > 0) {
      console.log(`[Permem] Skipped ${result.skippedDuplicates.length} duplicates`);
    }

    if (result.extracted?.length > 0 || result.skippedDuplicates?.length > 0) {
      lastExtractionCount = messages.length;

      // Trim old messages to keep context manageable
      if (messages.length > 10) {
        messages = messages.slice(-10);
        lastExtractionCount = messages.length;
        console.log('[Permem] Trimmed to last 10 messages');
      }
      console.log('');
    }
  } catch (error) {
    // Silent fail - memory is optional
  }
}

/**
 * Generate AI response with memory integration
 */
async function chat(userMessage: string): Promise<string> {
  // 1. INJECT: Get relevant memories before LLM call
  let memoryContext = '';
  try {
    const injectResult = await permem.inject(userMessage, {
      userId: USER_ID,
      contextLength: getContextLength(),
      conversationId,
    });

    if (injectResult.shouldInject && injectResult.injectionText) {
      memoryContext = injectResult.injectionText;
    }
  } catch {
    // Silent fail
  }

  // 2. Build system prompt with memories
  let systemPrompt = 'You are a helpful assistant with long-term memory.';
  if (memoryContext) {
    systemPrompt += `\n\nRelevant memories about this user:\n${memoryContext}\n\nUse these to personalize your responses.`;
  }

  // 3. Add user message to history
  messages.push({ role: 'user', content: userMessage });

  // 4. Generate response
  const { text } = await generateText({
    model: openrouter.chat('google/gemini-2.0-flash-001'),
    system: systemPrompt,
    messages,
  });

  // 5. Add assistant response to history
  messages.push({ role: 'assistant', content: text });

  // 6. EXTRACT: Store new memories if threshold reached
  await extractMemories();

  return text;
}

/**
 * Main CLI loop
 */
async function main() {
  console.log('================================');
  console.log('  Permem CLI Chat');
  console.log('================================');
  console.log(`User: ${USER_ID}`);
  console.log(`Server: ${permem.url}`);
  console.log('Commands: "exit", "clear"\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let isClosing = false;

  rl.on('close', async () => {
    if (!isClosing) {
      isClosing = true;
      console.log('\nSaving memories...');
      await extractMemories(true);
      console.log('Goodbye!');
      process.exit(0);
    }
  });

  const prompt = () => {
    if (isClosing) return;

    rl.question('You: ', async (input) => {
      if (isClosing) return;

      const trimmed = input.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'exit') {
        console.log('Saving memories...');
        await extractMemories(true);
        console.log('Goodbye!');
        isClosing = true;
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'clear') {
        messages = [];
        conversationId = `conv-${Date.now()}`;
        lastExtractionCount = 0;
        console.log('Conversation cleared.\n');
        prompt();
        return;
      }

      try {
        const response = await chat(trimmed);
        console.log(`\nAssistant: ${response}\n`);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      }

      prompt();
    });
  };

  prompt();
}

main();
