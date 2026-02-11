import { writable } from 'svelte/store'
import type { NetworkStats } from '../lib/kaspa/types'

export const networkStats = writable<NetworkStats>({
  blocksPerSecond: 0,
  txPerSecond: 0,
  hashrate: '---',
  blueScore: 0,
  daaScore: 0,
  peerCount: 0,
  mempoolSize: 0,
  isConnected: false,
  isSynced: false,
  serverVersion: '',
})

export function updateStats(partial: Partial<NetworkStats>) {
  networkStats.update(s => ({ ...s, ...partial }))
}
