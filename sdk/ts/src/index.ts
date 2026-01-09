/**
 * Permem SDK
 * Persistent memory for AI - add memory to any LLM in one line
 *
 * @example Zero-config usage (singleton)
 * ```typescript
 * import permem from 'permem'
 *
 * // Store a memory
 * await permem.memorize("User's name is Ashish", { userId: 'user-123' })
 *
 * // Recall memories
 * const { memories } = await permem.recall("What is the user's name?", { userId: 'user-123' })
 *
 * // Auto mode - inject (before LLM call)
 * const { injectionText } = await permem.inject("Hello!", { userId: 'user-123' })
 *
 * // Auto mode - extract (after LLM response)
 * await permem.extract(messages, { userId: 'user-123' })
 * ```
 *
 * @example Custom configuration
 * ```typescript
 * import { Permem } from 'permem'
 *
 * const mem = new Permem({
 *   url: 'https://api.permem.io',
 *   apiKey: 'your-api-key'
 * })
 *
 * await mem.memorize("User prefers dark mode", { userId: 'user-123' })
 * ```
 */

// Re-export client class and error
export { Permem, PermemError } from './client.js';

// Re-export all types
export type {
  PermemConfig,
  RecallOptions,
  MemorizeOptions,
  InjectOptions,
  ExtractOptions,
  Memory,
  MemoryType,
  ImportanceLevel,
  MemorizeResponse,
  RecallResponse,
  InjectResponse,
  ExtractResponse,
  ChatMessage,
} from './types.js';

// Import for singleton
import { Permem } from './client.js';
import type {
  MemorizeOptions,
  RecallOptions,
  InjectOptions,
  ExtractOptions,
  ChatMessage,
  PermemConfig,
} from './types.js';

// ============ Singleton Instance ============

/**
 * Default singleton instance for zero-config usage
 * Configure via environment variables or use configure()
 *
 * Environment variables:
 * - PERMEM_URL: Server URL (default: http://localhost:3333)
 * - PERMEM_API_KEY: API key (optional)
 */
let instance: Permem | null = null;

/**
 * Get or create the singleton instance
 */
function getInstance(): Permem {
  if (!instance) {
    instance = new Permem({
      url: typeof process !== 'undefined' ? process.env?.PERMEM_URL : undefined,
      apiKey: typeof process !== 'undefined' ? process.env?.PERMEM_API_KEY : undefined,
    });
  }
  return instance;
}

/**
 * Configure the singleton instance
 * Call this before using the singleton methods if you need custom config
 * @param config - Configuration options
 * @example
 * import { configure } from 'permem'
 * configure({ url: 'https://api.permem.io', apiKey: 'xxx' })
 */
export function configure(config: PermemConfig): void {
  instance = new Permem(config);
}

// ============ Singleton Methods ============

/**
 * Store a memory using the singleton instance
 * @param content - Content to memorize
 * @param options - Settings including userId (required)
 * @example
 * await memorize("User's name is Ashish", { userId: 'user-123' })
 */
export async function memorize(content: string, options: MemorizeOptions) {
  return getInstance().memorize(content, options);
}

/**
 * Recall memories using the singleton instance
 * @param query - Search query
 * @param options - Settings including userId (required)
 * @example
 * const { memories } = await recall("What is the user's name?", { userId: 'user-123' })
 */
export async function recall(query: string, options: RecallOptions) {
  return getInstance().recall(query, options);
}

/**
 * Inject - retrieve relevant memories before LLM call
 * @param message - User's message
 * @param options - Settings including userId (required)
 * @example
 * const { injectionText, shouldInject } = await inject("Hello!", { userId: 'user-123' })
 */
export async function inject(message: string, options: InjectOptions) {
  return getInstance().inject(message, options);
}

/**
 * Extract - extract memories from conversation after LLM response
 * @param messages - Chat messages
 * @param options - Settings including userId (required)
 * @example
 * await extract([{ role: 'user', content: 'Hi' }], { userId: 'user-123' })
 */
export async function extract(messages: ChatMessage[], options: ExtractOptions) {
  return getInstance().extract(messages, options);
}

/**
 * Check if server is healthy
 */
export async function health() {
  return getInstance().health();
}

// ============ Default Export ============

/**
 * Default export - the singleton instance
 * Provides the simplest possible API
 * @example
 * import permem from 'permem'
 * await permem.memorize("Hello", { userId: 'user-123' })
 */
const permem = {
  memorize,
  recall,
  inject,
  extract,
  health,
  configure,
};

export default permem;
