import { writable, derived, get } from 'svelte/store'
import type { DagBlock } from '../lib/kaspa/types'

const MAX_BLOCKS = 150

export const blocks = writable<DagBlock[]>([])
export const blockMap = writable<Map<string, DagBlock>>(new Map())

// Rolling BPS/TPS calculation
const blockTimestamps = writable<number[]>([])
const txCounts = writable<number[]>([])

export const blocksPerSecond = writable(0)
export const txPerSecond = writable(0)

export function addBlock(block: DagBlock) {
  const now = Date.now()

  blocks.update(arr => {
    arr.push(block)
    if (arr.length > MAX_BLOCKS) {
      const removed = arr.shift()!
      blockMap.update(m => { m.delete(removed.hash); return m })
    }
    return arr
  })

  blockMap.update(m => {
    m.set(block.hash, block)
    return m
  })

  // Track timestamps for BPS calculation
  blockTimestamps.update(ts => {
    ts.push(now)
    // Keep last 3 seconds of timestamps
    const cutoff = now - 3000
    while (ts.length > 0 && ts[0] < cutoff) ts.shift()
    return ts
  })

  txCounts.update(tc => {
    tc.push(block.txCount)
    if (tc.length > 30) tc.shift()
    return tc
  })

  // Update BPS (blocks in last 3 seconds / 3)
  const timestamps = get(blockTimestamps)
  blocksPerSecond.set(timestamps.length / 3)

  // Update TPS
  const counts = get(txCounts)
  const totalTx = counts.reduce((a, b) => a + b, 0)
  txPerSecond.set(totalTx / 3)
}

export function clearBlocks() {
  blocks.set([])
  blockMap.set(new Map())
}
