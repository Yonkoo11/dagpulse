import type { DagBlock } from '../kaspa/types'
import { BLOCK_RADIUS } from './layout'

const COLORS = {
  bg: '#0a0e1a',
  gridLine: 'rgba(31, 41, 55, 0.3)',
  edgeBlue: 'rgba(6, 182, 212, 0.35)',
  edgeRed: 'rgba(107, 114, 128, 0.2)',
  blockBlue: '#06b6d4',
  blockBlueFill: '#0e7490',
  blockRed: '#6b7280',
  blockRedFill: '#374151',
  selectedRing: '#f59e0b',
}

export interface RenderState {
  offsetX: number
  offsetY: number
  zoom: number
  selectedHash: string | null
  hoveredHash: string | null
}

export function renderDAG(
  ctx: CanvasRenderingContext2D,
  blocks: DagBlock[],
  blockMap: Map<string, DagBlock>,
  state: RenderState,
  width: number,
  height: number
) {
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, width, height)

  drawGrid(ctx, state.offsetX, state.offsetY, state.zoom, width, height)

  ctx.save()
  ctx.translate(state.offsetX, state.offsetY)
  ctx.scale(state.zoom, state.zoom)

  // Draw edges: connect blocks to parents in blockMap, or to nearby previous blocks
  drawAllEdges(ctx, blocks, blockMap, state)

  // Draw blocks on top
  for (const block of blocks) {
    if (block.opacity < 0.05) continue
    drawBlock(ctx, block, state)
  }

  ctx.restore()
  drawVignette(ctx, width, height)
}

function drawGrid(ctx: CanvasRenderingContext2D, ox: number, oy: number, zoom: number, w: number, h: number) {
  const gridSize = 80 * zoom
  if (gridSize < 20) return

  ctx.strokeStyle = COLORS.gridLine
  ctx.lineWidth = 0.5

  const startX = ((ox % gridSize) + gridSize) % gridSize
  const startY = ((oy % gridSize) + gridSize) % gridSize

  ctx.beginPath()
  for (let x = startX; x < w; x += gridSize) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
  }
  for (let y = startY; y < h; y += gridSize) {
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()
}

function drawAllEdges(
  ctx: CanvasRenderingContext2D,
  blocks: DagBlock[],
  blockMap: Map<string, DagBlock>,
  state: RenderState
) {
  // Group blocks by their X position (column)
  const columns = new Map<number, DagBlock[]>()
  for (const block of blocks) {
    if (block.opacity < 0.05) continue
    const col = Math.round(block.targetX)
    if (!columns.has(col)) columns.set(col, [])
    columns.get(col)!.push(block)
  }

  const sortedCols = [...columns.keys()].sort((a, b) => a - b)

  for (let ci = 1; ci < sortedCols.length; ci++) {
    const currCol = columns.get(sortedCols[ci])!
    const prevCol = columns.get(sortedCols[ci - 1])!

    for (const block of currCol) {
      // First try real parent connections
      let hasRealEdge = false
      for (const parentHash of block.parentHashes) {
        const parent = blockMap.get(parentHash)
        if (parent && parent.opacity > 0.05) {
          drawEdge(ctx, parent, block, state)
          hasRealEdge = true
        }
      }

      // If no real edges found, create deterministic connections to previous column
      if (!hasRealEdge && prevCol.length > 0) {
        // Use hash to deterministically pick 1-3 parents from previous column
        const hashNum = parseInt(block.hash.slice(0, 8), 16) || 0
        const numParents = 1 + (hashNum % Math.min(3, prevCol.length))

        for (let p = 0; p < numParents; p++) {
          const parentIdx = (hashNum + p * 7) % prevCol.length
          drawEdge(ctx, prevCol[parentIdx], block, state)
        }
      }
    }
  }
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  from: DagBlock,
  to: DagBlock,
  state: RenderState
) {
  const isHighlight = state.selectedHash === to.hash || state.selectedHash === from.hash
    || state.hoveredHash === to.hash || state.hoveredHash === from.hash

  ctx.beginPath()

  const dx = to.x - from.x
  const cpOffset = Math.max(15, Math.abs(dx) * 0.35)

  ctx.moveTo(from.x, from.y)
  ctx.bezierCurveTo(
    from.x + cpOffset, from.y,
    to.x - cpOffset, to.y,
    to.x, to.y
  )

  if (isHighlight) {
    ctx.strokeStyle = COLORS.blockBlue
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
  } else {
    ctx.strokeStyle = to.isBlue ? COLORS.edgeBlue : COLORS.edgeRed
    ctx.lineWidth = 1
    ctx.globalAlpha = Math.min(from.opacity, to.opacity) * 0.6
  }

  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawBlock(ctx: CanvasRenderingContext2D, block: DagBlock, state: RenderState) {
  const r = BLOCK_RADIUS * block.scale
  const isSelected = state.selectedHash === block.hash
  const isHovered = state.hoveredHash === block.hash

  ctx.globalAlpha = block.opacity

  // Glow for new blocks
  if (block.glowIntensity > 0.02) {
    const intensity = block.glowIntensity * 0.25
    const glowR = r + 8 * block.glowIntensity
    ctx.beginPath()
    ctx.arc(block.x, block.y, glowR, 0, Math.PI * 2)
    ctx.fillStyle = block.isBlue
      ? `rgba(34, 211, 238, ${intensity})`
      : `rgba(156, 163, 175, ${intensity})`
    ctx.fill()
  }

  // Block body
  ctx.beginPath()
  ctx.arc(block.x, block.y, r, 0, Math.PI * 2)
  ctx.fillStyle = isHovered
    ? (block.isBlue ? COLORS.blockBlue : COLORS.blockRed)
    : (block.isBlue ? COLORS.blockBlueFill : COLORS.blockRedFill)
  ctx.fill()

  // Border
  ctx.beginPath()
  ctx.arc(block.x, block.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = block.isBlue ? COLORS.blockBlue : COLORS.blockRed
  ctx.lineWidth = isSelected ? 2.5 : 1.5
  ctx.stroke()

  // Selection ring
  if (isSelected) {
    ctx.beginPath()
    ctx.arc(block.x, block.y, r + 5, 0, Math.PI * 2)
    ctx.strokeStyle = COLORS.selectedRing
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // TX count dot
  if (block.txCount > 1) {
    ctx.beginPath()
    ctx.arc(block.x + r * 0.65, block.y - r * 0.65, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const leftGrad = ctx.createLinearGradient(0, 0, 60, 0)
  leftGrad.addColorStop(0, COLORS.bg)
  leftGrad.addColorStop(1, 'rgba(10, 14, 26, 0)')
  ctx.fillStyle = leftGrad
  ctx.fillRect(0, 0, 60, h)

  const rightGrad = ctx.createLinearGradient(w - 60, 0, w, 0)
  rightGrad.addColorStop(0, 'rgba(10, 14, 26, 0)')
  rightGrad.addColorStop(1, COLORS.bg)
  ctx.fillStyle = rightGrad
  ctx.fillRect(w - 60, 0, 60, h)
}

export function hitTestBlock(
  blocks: DagBlock[],
  canvasX: number,
  canvasY: number,
  state: RenderState
): DagBlock | null {
  const worldX = (canvasX - state.offsetX) / state.zoom
  const worldY = (canvasY - state.offsetY) / state.zoom

  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]
    const dx = worldX - block.x
    const dy = worldY - block.y
    if (dx * dx + dy * dy < BLOCK_RADIUS * BLOCK_RADIUS * 2.25) return block
  }
  return null
}
