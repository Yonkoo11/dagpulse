export interface DagBlock {
  hash: string
  parentHashes: string[]
  blueScore: number
  daaScore: number
  timestamp: number
  txCount: number
  isBlue: boolean
  // Canvas rendering state
  x: number
  y: number
  targetX: number
  targetY: number
  opacity: number
  scale: number
  glowIntensity: number
  addedAt: number
}

export interface NetworkStats {
  blocksPerSecond: number
  txPerSecond: number
  hashrate: string
  blueScore: number
  daaScore: number
  peerCount: number
  mempoolSize: number
  blocksSeen: number
  isConnected: boolean
  isSynced: boolean
  serverVersion: string
}

export interface BlockTransaction {
  id: string
  inputs: number
  outputs: number
  amount: number
}

export interface BlockDetail {
  hash: string
  parentHashes: string[]
  blueScore: number
  daaScore: number
  timestamp: number
  transactions: BlockTransaction[]
  isBlue: boolean
  nonce: string
  bits: number
  version: number
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
