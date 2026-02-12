import type { DagBlock } from '../kaspa/types'
import { BLOCK_RADIUS } from './layout'

const COLORS = {
  bg: '#0a0e1a',
  gridLine: 'rgba(31, 41, 55, 0.3)',
  edgeBlue: 'rgba(6, 182, 212, 0.45)',
  edgeRed: 'rgba(107, 114, 128, 0.25)',
  blockBlue: '#06b6d4',
  blockBlueFill: '#0e7490',
  blockRed: '#ef4444',
  blockRedFill: 'rgba(239, 68, 68, 0.4)',
  selectedRing: '#f59e0b',
  virtualChain: '#f59e0b',
  virtualChainEdge: 'rgba(245, 158, 11, 0.7)',
  mergeSetBlueHighlight: 'rgba(6, 182, 212, 0.15)',
  mergeSetRedHighlight: 'rgba(239, 68, 68, 0.15)',
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

  // Draw merge set highlights for selected block (behind everything)
  if (state.selectedHash) {
    const selectedBlock = blockMap.get(state.selectedHash)
    if (selectedBlock) {
      drawMergeSetHighlights(ctx, selectedBlock, blockMap)
    }
  }

  // Draw edges: only real parent edges (no synthetic)
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

function drawMergeSetHighlights(
  ctx: CanvasRenderingContext2D,
  selectedBlock: DagBlock,
  blockMap: Map<string, DagBlock>
) {
  const highlightR = BLOCK_RADIUS + 10

  // Highlight blue merge set blocks
  for (const blueHash of selectedBlock.mergeSetBlues) {
    const block = blockMap.get(blueHash)
    if (block && block.opacity > 0.05) {
      ctx.beginPath()
      ctx.arc(block.x, block.y, highlightR, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.mergeSetBlueHighlight
      ctx.fill()
    }
  }

  // Highlight red merge set blocks
  for (const redHash of selectedBlock.mergeSetReds) {
    const block = blockMap.get(redHash)
    if (block && block.opacity > 0.05) {
      ctx.beginPath()
      ctx.arc(block.x, block.y, highlightR, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.mergeSetRedHighlight
      ctx.fill()
    }
  }
}

function drawAllEdges(
  ctx: CanvasRenderingContext2D,
  blocks: DagBlock[],
  blockMap: Map<string, DagBlock>,
  state: RenderState
) {
  // Collect edges, separate by draw priority
  type Edge = { from: DagBlock; to: DagBlock }
  const normalEdges: Edge[] = []
  const highlightEdges: Edge[] = []
  const virtualChainEdges: Edge[] = []

  for (const block of blocks) {
    if (block.opacity < 0.05) continue

    for (const parentHash of block.parentHashes) {
      const parent = blockMap.get(parentHash)
      if (!parent || parent.opacity < 0.05) continue

      const edge = { from: parent, to: block }
      const isHL = state.selectedHash === block.hash || state.selectedHash === parent.hash
        || state.hoveredHash === block.hash || state.hoveredHash === parent.hash

      // Check if this is a virtual chain edge (both blocks on virtual chain, connected via selectedParent)
      const isVirtualChainEdge = block.isVirtualChain && parent.isVirtualChain
        && block.selectedParentHash === parent.hash

      if (isVirtualChainEdge) {
        virtualChainEdges.push(edge)
      } else if (isHL) {
        highlightEdges.push(edge)
      } else {
        normalEdges.push(edge)
      }
    }
  }

  // Draw normal edges first, then highlighted, then virtual chain on top
  for (const e of normalEdges) drawEdge(ctx, e.from, e.to, state, false)
  for (const e of highlightEdges) drawEdge(ctx, e.from, e.to, state, false)
  for (const e of virtualChainEdges) drawEdge(ctx, e.from, e.to, state, true)
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  from: DagBlock,
  to: DagBlock,
  state: RenderState,
  isVirtualChain: boolean
) {
  const isSelected = state.selectedHash === to.hash || state.selectedHash === from.hash
  const isHovered = state.hoveredHash === to.hash || state.hoveredHash === from.hash
  const isHighlight = isSelected || isHovered

  ctx.beginPath()

  const dx = to.x - from.x
  const cpOffset = Math.max(15, Math.abs(dx) * 0.35)

  ctx.moveTo(from.x, from.y)
  ctx.bezierCurveTo(
    from.x + cpOffset, from.y,
    to.x - cpOffset, to.y,
    to.x, to.y
  )

  if (isVirtualChain) {
    ctx.strokeStyle = COLORS.virtualChainEdge
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.85
  } else if (isSelected) {
    ctx.strokeStyle = COLORS.selectedRing
    ctx.lineWidth = 2.5
    ctx.globalAlpha = 0.9
  } else if (isHovered) {
    ctx.strokeStyle = COLORS.blockBlue
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
  } else {
    ctx.strokeStyle = to.isBlue ? COLORS.edgeBlue : COLORS.edgeRed
    ctx.lineWidth = 1
    ctx.globalAlpha = Math.min(from.opacity, to.opacity) * 0.6
  }

  ctx.stroke()

  // Draw directional arrow at the endpoint (pointing toward child)
  if (isHighlight || isVirtualChain || ctx.globalAlpha > 0.3) {
    ctx.fillStyle = ctx.strokeStyle
    drawArrowHead(ctx, from, to, cpOffset, isHighlight || isVirtualChain)
  }

  ctx.globalAlpha = 1
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  from: DagBlock,
  to: DagBlock,
  cpOffset: number,
  isHighlight: boolean
) {
  // Get tangent direction at the endpoint using the bezier derivative
  // For a cubic bezier at t=1, tangent = 3 * (P3 - P2)
  const cp2x = to.x - cpOffset
  const cp2y = to.y
  const tanX = to.x - cp2x
  const tanY = to.y - cp2y

  const len = Math.sqrt(tanX * tanX + tanY * tanY)
  if (len < 0.01) return

  const nx = tanX / len
  const ny = tanY / len

  const arrowSize = isHighlight ? 6 : 4
  const offset = BLOCK_RADIUS + 2

  // Arrow tip position (just outside the block)
  const tipX = to.x - nx * offset
  const tipY = to.y - ny * offset

  // Perpendicular
  const px = -ny
  const py = nx

  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(tipX - nx * arrowSize - px * arrowSize * 0.5, tipY - ny * arrowSize - py * arrowSize * 0.5)
  ctx.lineTo(tipX - nx * arrowSize + px * arrowSize * 0.5, tipY - ny * arrowSize + py * arrowSize * 0.5)
  ctx.closePath()
  ctx.fill()
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
      : `rgba(239, 68, 68, ${intensity * 0.6})`
    ctx.fill()
  }

  // Virtual chain: gold/amber outer glow (always visible)
  if (block.isVirtualChain) {
    ctx.beginPath()
    ctx.arc(block.x, block.y, r + 4, 0, Math.PI * 2)
    ctx.strokeStyle = COLORS.virtualChain
    ctx.lineWidth = 2
    ctx.globalAlpha = block.opacity * 0.6
    ctx.stroke()
    ctx.globalAlpha = block.opacity
  }

  // Block body
  ctx.beginPath()
  ctx.arc(block.x, block.y, r, 0, Math.PI * 2)
  if (block.isBlue) {
    ctx.fillStyle = isHovered ? COLORS.blockBlue : COLORS.blockBlueFill
  } else {
    ctx.fillStyle = isHovered ? COLORS.blockRed : COLORS.blockRedFill
  }
  ctx.fill()

  // Border
  ctx.beginPath()
  ctx.arc(block.x, block.y, r, 0, Math.PI * 2)
  ctx.strokeStyle = block.isBlue ? COLORS.blockBlue : COLORS.blockRed
  ctx.lineWidth = block.isVirtualChain ? 3 : (isSelected ? 2.5 : 1.5)
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

  const topGrad = ctx.createLinearGradient(0, 0, 0, 40)
  topGrad.addColorStop(0, COLORS.bg)
  topGrad.addColorStop(1, 'rgba(10, 14, 26, 0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, w, 40)

  const bottomGrad = ctx.createLinearGradient(0, h - 40, 0, h)
  bottomGrad.addColorStop(0, 'rgba(10, 14, 26, 0)')
  bottomGrad.addColorStop(1, COLORS.bg)
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, h - 40, w, 40)
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
