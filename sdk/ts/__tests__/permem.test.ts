/**
 * Permem SDK Unit Tests
 */

import { describe, test, expect, beforeAll, afterAll, mock } from 'bun:test';
import { Permem, PermemError, configure, memorize, recall, inject, extract } from '../src/index.js';

// Mock server URL for testing
const TEST_URL = 'http://localhost:3333';

// Mock fetch for unit tests
const originalFetch = globalThis.fetch;

describe('Permem SDK', () => {
  describe('Permem Class', () => {
    test('creates instance with default config', () => {
      const mem = new Permem();
      const config = mem.getConfig();

      expect(config.url).toBe('http://localhost:3333');
      expect(config.maxContextLength).toBe(8000);
      expect(config.extractThreshold).toBe(0.7);
    });

    test('creates instance with custom config', () => {
      const mem = new Permem({
        url: 'https://api.example.com',
        apiKey: 'secret-key',
        maxContextLength: 4000,
      });
      const config = mem.getConfig();

      expect(config.url).toBe('https://api.example.com');
      expect(config.apiKey).toBe('secret-key');
      expect(config.maxContextLength).toBe(4000);
    });
  });

  describe('Memorize', () => {
    test('memorize sends correct request with userId in options', async () => {
      let capturedRequest: { url: string; method: string; body: unknown } | null = null;

      globalThis.fetch = async (url, options) => {
        capturedRequest = {
          url: url as string,
          method: options?.method || 'GET',
          body: options?.body ? JSON.parse(options.body as string) : null,
        };
        return new Response(
          JSON.stringify({
            stored: true,
            stored_count: 1,
            duplicates: 0,
            results: [
              {
                action: 'NEW',
                memory: { id: 'mem-1', summary: "User's name is Ashish", type: 'core' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const mem = new Permem({ url: TEST_URL });
      const result = await mem.memorize("User's name is Ashish", { userId: 'test-user' });

      expect(capturedRequest?.url).toBe(`${TEST_URL}/v1/memories`);
      expect(capturedRequest?.method).toBe('POST');
      expect(capturedRequest?.body).toEqual({
        content: "User's name is Ashish",
        userId: 'test-user',
        conversationId: undefined,
        async: false,
      });

      expect(result.stored).toBe(true);
      expect(result.count).toBe(1);
      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].summary).toBe("User's name is Ashish");

      globalThis.fetch = originalFetch;
    });
  });

  describe('Recall', () => {
    test('recall sends correct request with userId in options', async () => {
      let capturedUrl: string | null = null;

      globalThis.fetch = async (url) => {
        capturedUrl = url as string;
        return new Response(
          JSON.stringify({
            memories: [
              {
                id: 'mem-1',
                summary: "User's name is Ashish",
                type: 'core',
                similarity: 0.85,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const mem = new Permem({ url: TEST_URL });
      const result = await mem.recall("What is the user's name?", { userId: 'test-user', limit: 5, mode: 'balanced' });

      expect(capturedUrl).toContain('/v1/memories/search');
      expect(capturedUrl).toContain('q=What');
      expect(capturedUrl).toContain('userId=test-user');
      expect(capturedUrl).toContain('limit=5');
      expect(capturedUrl).toContain('mode=balanced');

      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].summary).toBe("User's name is Ashish");

      globalThis.fetch = originalFetch;
    });
  });

  describe('Inject', () => {
    test('inject sends correct request with userId in options', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      globalThis.fetch = async (url, options) => {
        capturedBody = options?.body ? JSON.parse(options.body as string) : null;
        return new Response(
          JSON.stringify({
            memories: [{ id: 'mem-1', summary: 'Test memory', type: 'fact', similarity: 0.8 }],
            injectionText: '<relevant_memories>\n- Test memory\n</relevant_memories>',
            shouldInject: true,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const mem = new Permem({ url: TEST_URL, maxContextLength: 8000 });
      const result = await mem.inject('Hello!', { userId: 'test-user', contextLength: 100 });

      expect(capturedBody?.message).toBe('Hello!');
      expect(capturedBody?.userId).toBe('test-user');
      expect(capturedBody?.contextLength).toBe(100);
      expect(capturedBody?.maxContextLength).toBe(8000);

      expect(result.shouldInject).toBe(true);
      expect(result.injectionText).toContain('relevant_memories');
      expect(result.memories).toHaveLength(1);

      globalThis.fetch = originalFetch;
    });
  });

  describe('Extract', () => {
    test('extract sends correct request with userId in options', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      globalThis.fetch = async (url, options) => {
        capturedBody = options?.body ? JSON.parse(options.body as string) : null;
        return new Response(
          JSON.stringify({
            shouldExtract: true,
            extracted: [{ id: 'mem-1', summary: 'New memory', type: 'fact', action: 'NEW' }],
            skippedDuplicates: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const mem = new Permem({ url: TEST_URL });
      const messages = [
        { role: 'user' as const, content: 'My favorite color is blue' },
        { role: 'assistant' as const, content: "I'll remember that!" },
      ];
      const result = await mem.extract(messages, { userId: 'test-user', contextLength: 6000 });

      expect(capturedBody?.messages).toEqual(messages);
      expect(capturedBody?.userId).toBe('test-user');
      expect(capturedBody?.contextLength).toBe(6000);

      expect(result.shouldExtract).toBe(true);
      expect(result.extracted).toHaveLength(1);

      globalThis.fetch = originalFetch;
    });
  });

  describe('Error Handling', () => {
    test('throws PermemError on HTTP error', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const mem = new Permem({ url: TEST_URL });

      try {
        await mem.recall('test', { userId: 'test-user' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PermemError);
        expect((error as PermemError).message).toBe('User not found');
        expect((error as PermemError).statusCode).toBe(404);
      }

      globalThis.fetch = originalFetch;
    });

    test('health returns false on connection error', async () => {
      globalThis.fetch = async () => {
        throw new Error('Connection refused');
      };

      const mem = new Permem({ url: 'http://invalid-url:9999' });
      const isHealthy = await mem.health();

      expect(isHealthy).toBe(false);

      globalThis.fetch = originalFetch;
    });
  });

  describe('Singleton Functions', () => {
    // Setup mock before configuring singleton
    const mockFetch = async (url: string | URL | Request) => {
      const path = (url as string).split('?')[0];

      if (path.endsWith('/v1/memories')) {
        return new Response(
          JSON.stringify({
            stored: true,
            stored_count: 1,
            duplicates: 0,
            results: [{ action: 'NEW', memory: { id: '1', summary: 'Test', type: 'fact' } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (path.includes('/v1/memories/search')) {
        return new Response(JSON.stringify({ memories: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (path.endsWith('/v1/auto/inbound')) {
        return new Response(
          JSON.stringify({ memories: [], injectionText: '', shouldInject: false }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (path.endsWith('/v1/auto/outbound')) {
        return new Response(
          JSON.stringify({ shouldExtract: false, extracted: [], skippedDuplicates: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    test('configure and memorize work with userId in options', async () => {
      globalThis.fetch = mockFetch;
      configure({ url: 'http://mock-server' });
      const result = await memorize('Test memory', { userId: 'singleton-user' });
      expect(result.stored).toBe(true);
      globalThis.fetch = originalFetch;
    });

    test('recall function works with userId in options', async () => {
      globalThis.fetch = mockFetch;
      configure({ url: 'http://mock-server' });
      const result = await recall('test query', { userId: 'singleton-user' });
      expect(result.memories).toBeDefined();
      globalThis.fetch = originalFetch;
    });

    test('inject function works with userId in options', async () => {
      globalThis.fetch = mockFetch;
      configure({ url: 'http://mock-server' });
      const result = await inject('Hello', { userId: 'singleton-user' });
      expect(result.shouldInject).toBeDefined();
      globalThis.fetch = originalFetch;
    });

    test('extract function works with userId in options', async () => {
      globalThis.fetch = mockFetch;
      configure({ url: 'http://mock-server' });
      const result = await extract([{ role: 'user', content: 'Hi' }], { userId: 'singleton-user' });
      expect(result.shouldExtract).toBeDefined();
      globalThis.fetch = originalFetch;
    });
  });
});
