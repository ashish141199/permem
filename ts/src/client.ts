/**
 * Permem Client
 * Core client class for interacting with the Permem API
 */

import type {
  PermemConfig,
  ResolvedConfig,
  RecallOptions,
  MemorizeOptions,
  InjectOptions,
  ExtractOptions,
  MemorizeResponse,
  RecallResponse,
  InjectResponse,
  ExtractResponse,
  ChatMessage,
} from './types.js';

// Default configuration values
const DEFAULTS = {
  url: 'http://localhost:3333',
  maxContextLength: 8000,
  extractThreshold: 0.7,
} as const;

/**
 * Permem Client Class
 * Provides simple methods for storing and retrieving memories
 */
export class Permem {
  private config: ResolvedConfig;

  /**
   * Create a new Permem instance
   * @param config - Configuration options (all optional with sensible defaults)
   * @example
   * // Zero config - just works
   * const mem = new Permem()
   *
   * // With custom config
   * const mem = new Permem({ url: 'https://api.permem.io', apiKey: 'xxx' })
   */
  constructor(config: PermemConfig = {}) {
    this.config = {
      url: config.url || DEFAULTS.url,
      apiKey: config.apiKey,
      maxContextLength: config.maxContextLength || DEFAULTS.maxContextLength,
      extractThreshold: config.extractThreshold || DEFAULTS.extractThreshold,
    };
  }

  // ============ Core Methods ============

  /**
   * Store a memory
   * @param content - The content to memorize
   * @param options - Settings including userId (required)
   * @example
   * await mem.memorize("User's name is Ashish", { userId: 'user-123' })
   */
  async memorize(content: string, options: MemorizeOptions): Promise<MemorizeResponse> {
    const response = await this.request<{
      stored: boolean;
      stored_count: number;
      duplicates: number;
      results: Array<{
        action: string;
        memory: { id: string; summary: string; type: string } | null;
      }>;
    }>('POST', '/v1/memories', {
      content,
      userId: options.userId,
      conversationId: options.conversationId,
      async: options.async || false,
    });

    return {
      stored: response.stored,
      count: response.stored_count || 0,
      memories: response.results
        .filter((r) => r.memory)
        .map((r) => ({
          id: r.memory!.id,
          summary: r.memory!.summary,
          type: r.memory!.type as MemorizeResponse['memories'][0]['type'],
          action: r.action as MemorizeResponse['memories'][0]['action'],
        })),
      duplicates: response.duplicates || 0,
    };
  }

  /**
   * Recall memories by semantic search
   * @param query - Search query
   * @param options - Settings including userId (required)
   * @example
   * const result = await mem.recall("What is the user's name?", { userId: 'user-123' })
   */
  async recall(query: string, options: RecallOptions): Promise<RecallResponse> {
    const params = new URLSearchParams({
      q: query,
      userId: options.userId,
    });

    if (options.limit) params.set('limit', options.limit.toString());
    if (options.mode) params.set('mode', options.mode);
    if (options.conversationId) {
      params.set('conversationId', options.conversationId);
    }

    const response = await this.request<{ memories: RecallResponse['memories'] }>(
      'GET',
      `/v1/memories/search?${params.toString()}`
    );

    return { memories: response.memories };
  }

  // ============ Auto Mode Methods ============

  /**
   * Inject - retrieve relevant memories before sending to LLM
   * Call this before your LLM request to inject context
   * @param message - The user's message
   * @param options - Settings including userId (required)
   * @example
   * const { injectionText, shouldInject } = await mem.inject("What's my name?", { userId: 'user-123' })
   * if (shouldInject) {
   *   systemPrompt += injectionText
   * }
   */
  async inject(message: string, options: InjectOptions): Promise<InjectResponse> {
    const response = await this.request<InjectResponse>('POST', '/v1/auto/inbound', {
      message,
      userId: options.userId,
      conversationId: options.conversationId,
      contextLength: options.contextLength || 0,
      maxContextLength: this.config.maxContextLength,
    });

    return response;
  }

  /**
   * Extract - extract memories from conversation after LLM response
   * Call this after receiving LLM response to store new memories
   * @param messages - Array of chat messages
   * @param options - Settings including userId (required)
   * @example
   * const messages = [
   *   { role: 'user', content: 'My name is Ashish' },
   *   { role: 'assistant', content: 'Nice to meet you, Ashish!' }
   * ]
   * await mem.extract(messages, { userId: 'user-123' })
   */
  async extract(messages: ChatMessage[], options: ExtractOptions): Promise<ExtractResponse> {
    const response = await this.request<ExtractResponse>('POST', '/v1/auto/outbound', {
      messages,
      userId: options.userId,
      conversationId: options.conversationId,
      contextLength: options.contextLength || this.estimateTokens(messages),
      maxContextLength: this.config.maxContextLength,
      extractThreshold: options.extractThreshold || this.config.extractThreshold,
      async: options.async || false,
    });

    return response;
  }

  // ============ Utility Methods ============

  /**
   * Check if the Permem server is healthy
   */
  async health(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>('GET', '/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ResolvedConfig> {
    return { ...this.config };
  }

  // ============ Private Methods ============

  /**
   * Make HTTP request to the API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const response = await fetch(`${this.config.url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new PermemError(
        (error as { error?: string }).error || `HTTP ${response.status}`,
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Estimate token count for messages (rough approximation: 4 chars = 1 token)
   */
  private estimateTokens(messages: ChatMessage[]): number {
    const text = messages.map((m) => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }
}

/**
 * Custom error class for Permem errors
 */
export class PermemError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'PermemError';
    this.statusCode = statusCode;
  }
}
