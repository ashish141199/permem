/**
 * Basic Permem Usage Example
 *
 * Run: npx ts-node examples/basic.ts
 */

import permem from '../src'

const USER_ID = 'demo-user'

async function main() {
  // Configure (optional - uses localhost:3333 by default)
  permem.configure({
    url: 'http://localhost:3333',
  })

  // Store a memory
  const stored = await permem.memorize("User's favorite color is blue", { userId: USER_ID })
  console.log('Stored:', stored.count, 'memories')

  // Recall memories
  const result = await permem.recall('favorite color', { userId: USER_ID })
  console.log('Found:', result.memories.length, 'memories')
  for (const memory of result.memories) {
    console.log('-', memory.summary)
  }
}

main().catch(console.error)
