/**
 * Auto Mode Example - Automatic memory injection and extraction
 *
 * Run: npx ts-node examples/auto-mode.ts
 */

import { Permem } from '../src'

const USER_ID = 'demo-user'

async function chatWithMemory() {
  const mem = new Permem()

  const userMessage = 'My name is Ashish and I love TypeScript'

  // BEFORE LLM call - inject relevant memories
  const context = await mem.inject(userMessage, { userId: USER_ID })

  let systemPrompt = 'You are a helpful assistant.'
  if (context.shouldInject) {
    systemPrompt += '\n\n' + context.injectionText
    console.log('Injecting memories:', context.memories.length)
  }

  // ... call your LLM here with systemPrompt ...
  const assistantResponse = "Nice to meet you, Ashish! TypeScript is great."

  // AFTER LLM response - extract new memories
  const extraction = await mem.extract([
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantResponse },
  ], { userId: USER_ID })

  if (extraction.shouldExtract) {
    console.log('Extracted:', extraction.extracted.length, 'new memories')
  }

  await mem.close()
}

chatWithMemory().catch(console.error)
