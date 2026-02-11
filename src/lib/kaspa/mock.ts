import type { DagBlock } from './types'

let mockBlueScore = 91_200_000
let mockDaaScore = 91_500_000
let mockBlockCount = 0

function randomHash(): string {
  const chars = '0123456789abcdef'
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)]
  }
  return hash
}

const recentHashes: string[] = []

export function generateMockBlock(): DagBlock {
  const hash = randomHash()
  const numParents = Math.min(recentHashes.length, Math.floor(Math.random() * 3) + 1)
  const parentHashes: string[] = []

  // Pick random recent parents
  const available = [...recentHashes]
  for (let i = 0; i < numParents && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * Math.min(available.length, 5))
    parentHashes.push(available.splice(idx, 1)[0])
  }

  recentHashes.push(hash)
  if (recentHashes.length > 20) recentHashes.shift()

  mockBlueScore++
  mockDaaScore++
  mockBlockCount++

  const isBlue = Math.random() > 0.15 // ~85% blue

  return {
    hash,
    parentHashes,
    blueScore: mockBlueScore,
    daaScore: mockDaaScore,
    timestamp: Date.now(),
    txCount: Math.floor(Math.random() * 5),
    isBlue,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    opacity: 0,
    scale: 0.5,
    glowIntensity: 1,
    addedAt: performance.now()
  }
}

export class MockBlockStream {
  private interval: ReturnType<typeof setInterval> | null = null
  private callback: ((block: DagBlock) => void) | null = null

  start(callback: (block: DagBlock) => void) {
    this.callback = callback
    // ~10 blocks per second = 100ms between blocks
    this.interval = setInterval(() => {
      if (this.callback) {
        this.callback(generateMockBlock())
      }
    }, 100)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
