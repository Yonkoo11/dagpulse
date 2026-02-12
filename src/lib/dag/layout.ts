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

// DAA score-based layout: blocks at the same DAA score are parallel columns
export function layoutBlocks(blocks: DagBlock[], config: LayoutConfig): void {
  if (blocks.length === 0) return

  const centerY = config.height / 2

  // Group blocks by daaScore (blocks at same DAA score are parallel)
  const columns = new Map<number, DagBlock[]>()
  for (const block of blocks) {
    const score = block.daaScore
    if (!columns.has(score)) columns.set(score, [])
    columns.get(score)!.push(block)
  }

  // Sort columns by daaScore
  const sortedScores = [...columns.keys()].sort((a, b) => a - b)

  // Position each column
  for (let i = 0; i < sortedScores.length; i++) {
    const score = sortedScores[i]
    const colBlocks = columns.get(score)!
    const x = i * BLOCK_SPACING_X

    for (let j = 0; j < colBlocks.length; j++) {
      const block = colBlocks[j]
      const spread = colBlocks.length - 1
      const yOffset = spread === 0 ? 0 : (j - spread / 2) * BLOCK_SPACING_Y
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
