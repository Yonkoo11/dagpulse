import type { DagBlock } from '../kaspa/types'

const BLOCK_SPACING_X = 55
const BLOCK_SPACING_Y = 46
const BLOCK_RADIUS = 14

export interface LayoutConfig {
  width: number
  height: number
  offsetX: number
  offsetY: number
  zoom: number
}

// Simple sequential layout: each block gets the next X position
// Blocks arriving together get stacked vertically
export function layoutBlocks(blocks: DagBlock[], config: LayoutConfig): void {
  if (blocks.length === 0) return

  const centerY = config.height / 2

  // Group blocks into columns based on arrival time batches
  const columns: DagBlock[][] = []
  let currentBatch: DagBlock[] = []
  let lastAddedAt = 0

  for (const block of blocks) {
    // New column if enough time passed since last block
    if (currentBatch.length > 0 && (block.addedAt - lastAddedAt) > 20) {
      columns.push(currentBatch)
      currentBatch = []
    }
    currentBatch.push(block)
    lastAddedAt = block.addedAt
  }
  if (currentBatch.length > 0) columns.push(currentBatch)

  // Position each column
  for (let col = 0; col < columns.length; col++) {
    const colBlocks = columns[col]
    const x = col * BLOCK_SPACING_X

    for (let i = 0; i < colBlocks.length; i++) {
      const block = colBlocks[i]
      const spread = colBlocks.length - 1
      const yOffset = spread === 0 ? 0 : (i - spread / 2) * BLOCK_SPACING_Y
      block.targetX = x
      block.targetY = centerY + yOffset
    }
  }
}

// Smoothly interpolate block positions
export function animateBlocks(blocks: DagBlock[], dt: number): void {
  const now = performance.now()
  const lerpSpeed = 1 - Math.pow(0.001, dt / 1000)

  for (const block of blocks) {
    // Position lerp
    block.x += (block.targetX - block.x) * lerpSpeed
    block.y += (block.targetY - block.y) * lerpSpeed

    // Fade in
    const age = now - block.addedAt
    if (age < 500) {
      block.opacity = Math.min(1, age / 300)
      block.scale = 0.5 + Math.min(0.5, age / 300) * 0.5
    } else {
      block.opacity = 1
      block.scale = 1
    }

    // Glow decay
    if (age < 1500) {
      block.glowIntensity = 1 - (age / 1500)
    } else {
      block.glowIntensity = 0
    }
  }
}

export function getAutoScrollX(blocks: DagBlock[]): number {
  if (blocks.length === 0) return 0
  let maxX = 0
  for (const b of blocks) {
    if (b.targetX > maxX) maxX = b.targetX
  }
  return maxX
}

export { BLOCK_RADIUS, BLOCK_SPACING_X, BLOCK_SPACING_Y }
