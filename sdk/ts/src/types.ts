/**
 * Permem SDK Types
 * All TypeScript type definitions for the SDK
 */

// ============ Configuration Types ============

/**
 * Configuration options for initializing Permem
 */
export interface PermemConfig {
  /** Base URL of the Permem server (default: http://localhost:3333) */
  url?: string;
  /** API key for authentication (optional, for future use) */
  apiKey?: string;
  /** Maximum context length in tokens (default: 8000) */
  maxContextLength?: number;
  /** Threshold for automatic extraction (default: 0.7 = 70% of maxContextLength) */
  extractThreshold?: number;
}

/**
 * Options for recall/search operations
 */
export interface RecallOptions {
  /** User ID (required) */
  userId: string;
  /** Number of results to return (default: 5) */
  limit?: number;
  /** Search mode: focused (strict), balanced, creative (loose) */
  mode?: 'focused' | 'balanced' | 'creative';
  /** Filter by conversation ID */
  conversationId?: string;
}

/**
 * Options for memorize/store operations
 */
export interface MemorizeOptions {
  /** User ID (required) */
  userId: string;
  /** Conversation ID to associate with memory */
  conversationId?: string;
  /** Async mode - return immediately without waiting (default: false) */
  async?: boolean;
}

/**
 * Options for inject (before LLM) operations
 */
export interface InjectOptions {
  /** User ID (required) */
  userId: string;
  /** Current context length in tokens */
  contextLength?: number;
  /** Conversation ID */
  conversationId?: string;
}

/**
 * Options for extract (after LLM) operations
 */
export interface ExtractOptions {
  /** User ID (required) */
  userId: string;
  /** Current context length in tokens */
  contextLength?: number;
  /** Conversation ID */
  conversationId?: string;
  /** Extraction threshold (0-1) */
  extractThreshold?: number;
  /** Async mode - return immediately without waiting */
  async?: boolean;
}

// ============ Response Types ============

/**
 * A memory object returned by the API
 */
export interface Memory {
  id: string;
  summary: string;
  type: MemoryType;
  importance: ImportanceLevel;
  importanceScore: number;
  similarity?: number;
  createdAt: string;
  topics?: string[];
  emotions?: string[];
  entities?: {
    people: string[];
    places: string[];
    organizations: string[];
    things: string[];
  };
}

/**
 * Memory type classification
 */
export type MemoryType =
  | 'core'
  | 'fact'
  | 'decision'
  | 'preference'
  | 'note'
  | 'event'
  | 'insight'
  | 'goal'
  | 'relationship'
  | 'emotion';

/**
 * Importance level classification
 */
export type ImportanceLevel =
  | 'trivial'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Response from memorize operation
 */
export interface MemorizeResponse {
  /** Whether any memories were stored */
  stored: boolean;
  /** Number of memories stored */
  count: number;
  /** Memories that were created or updated */
  memories: Array<{
    id: string;
    summary: string;
    type: MemoryType;
    action: 'NEW' | 'UPDATE' | 'DUPLICATE' | 'CONTRADICTION';
  }>;
  /** Number of duplicates skipped */
  duplicates: number;
}

/**
 * Response from recall operation
 */
export interface RecallResponse {
  /** Retrieved memories sorted by relevance */
  memories: Memory[];
}

/**
 * Response from inject operation
 */
export interface InjectResponse {
  /** Retrieved memories */
  memories: Memory[];
  /** Pre-formatted text to inject into LLM context */
  injectionText: string;
  /** Whether injection is recommended */
  shouldInject: boolean;
}

/**
 * Response from extract operation
 */
export interface ExtractResponse {
  /** Whether extraction was performed */
  shouldExtract: boolean;
  /** Extracted memories */
  extracted: Array<{
    id: string;
    summary: string;
    type: MemoryType;
    action: string;
  }>;
  /** Summaries of skipped duplicates */
  skippedDuplicates: string[];
}

/**
 * Chat message format for extract
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ============ Internal Types ============

/**
 * Internal resolved configuration with all defaults applied
 */
export interface ResolvedConfig {
  url: string;
  apiKey?: string;
  maxContextLength: number;
  extractThreshold: number;
}
