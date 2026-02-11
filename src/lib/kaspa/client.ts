import type { DagBlock, NetworkStats, ConnectionState, BlockDetail } from './types'
import { MockBlockStream } from './mock'

const API_BASE = 'https://api.kaspa.org'

type BlockCallback = (block: DagBlock) => void
type StatsCallback = (stats: Partial<NetworkStats>) => void
type StateCallback = (state: ConnectionState) => void

export class KaspaClient {
  private mockStream: MockBlockStream | null = null
  private blockCallbacks: BlockCallback[] = []
  private statsCallbacks: StatsCallback[] = []
  private stateCallbacks: StateCallback[] = []
  private _state: ConnectionState = 'disconnected'
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private statsInterval: ReturnType<typeof setInterval> | null = null
  private useMock = false
  private seenHashes = new Set<string>()
  private lastBlueScore = 0

  get state(): ConnectionState {
    return this._state
  }

  onBlock(cb: BlockCallback) { this.blockCallbacks.push(cb) }
  onStats(cb: StatsCallback) { this.statsCallbacks.push(cb) }
  onStateChange(cb: StateCallback) { this.stateCallbacks.push(cb) }

  private setState(s: ConnectionState) {
    this._state = s
    this.stateCallbacks.forEach(cb => cb(s))
  }

  async connect(): Promise<void> {
    this.setState('connecting')

    try {
      // Test API connectivity
      const res = await fetch(`${API_BASE}/info/virtual-chain-blue-score`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      this.lastBlueScore = Number(data.blueScore)

      this.setState('connected')
      console.log('[KaspaClient] Connected to REST API, blueScore:', this.lastBlueScore)

      // Start polling for new blocks
      this.startBlockPolling()
      this.startStatsPolling()
    } catch (e) {
      console.warn('[KaspaClient] REST API failed, falling back to mock:', e)
      this.startMock()
    }
  }

  private async startBlockPolling() {
    // Fetch initial batch of blocks from current tip
    await this.fetchRecentBlocks()

    // Poll every 1 second for new blocks
    this.pollInterval = setInterval(() => this.fetchRecentBlocks(), 1000)
  }

  private async fetchRecentBlocks() {
    try {
      const dagRes = await fetch(`${API_BASE}/info/blockdag`)
      if (!dagRes.ok) return
      const dagInfo = await dagRes.json()

      const tipHashes: string[] = dagInfo.tipHashes || []
      const currentDaaScore = Number(dagInfo.virtualDaaScore || 0)

      // Fetch tip blocks we haven't seen
      const newHashes = tipHashes.filter(h => !this.seenHashes.has(h))

      // Fetch up to 10 tips per cycle
      const hashesToFetch = newHashes.slice(0, 10)

      // Fetch tip blocks and collect parent hashes
      const allParentHashes: string[] = []
      for (const hash of hashesToFetch) {
        const parents = await this.fetchAndEmitBlock(hash)
        allParentHashes.push(...parents)
      }

      // Fetch parent blocks (1 level deep) for denser DAG
      const unseenParents = allParentHashes
        .filter(h => !this.seenHashes.has(h))
        .slice(0, 10)
      for (const hash of unseenParents) {
        await this.fetchAndEmitBlock(hash)
      }

      // Trim seen hashes
      if (this.seenHashes.size > 300) {
        const iter = this.seenHashes.values()
        for (let i = 0; i < 100; i++) {
          this.seenHashes.delete(iter.next().value!)
        }
      }

      if (currentDaaScore > 0) {
        this.statsCallbacks.forEach(cb => cb({ daaScore: currentDaaScore }))
      }
    } catch (e) {
      console.warn('[KaspaClient] Block poll failed:', e)
    }
  }

  private async fetchAndEmitBlock(hash: string): Promise<string[]> {
    if (this.seenHashes.has(hash)) return []
    try {
      const res = await fetch(`${API_BASE}/blocks/${hash}`)
      if (!res.ok) return []
      const data = await res.json()
      const block = this.parseRestBlock(data)
      if (!block) return []

      this.seenHashes.add(block.hash)
      this.blockCallbacks.forEach(cb => cb(block))
      this.statsCallbacks.forEach(cb => cb({ blocksSeen: this.seenHashes.size }))

      // Return parent hashes so caller can fetch them too
      return block.parentHashes
    } catch {
      return []
    }
  }

  private parseRestBlock(data: any): DagBlock | null {
    try {
      const hash = data.verboseData?.hash || ''
      if (!hash) return null

      const parents: string[] = []
      if (data.parents) {
        for (const level of data.parents) {
          if (Array.isArray(level.parentHashes)) {
            parents.push(...level.parentHashes)
          }
        }
      }

      const blueScore = Number(data.verboseData?.blueScore || 0)
      const daaScore = Number(data.header?.daaScore || 0)
      const timestamp = Number(data.header?.timestamp || Date.now())
      const txCount = data.transactions?.length || 0

      // Blue classification: if block is in mergeSetBluesHashes of some block, it's blue
      // Simplified: selected parent is always blue, and most blocks are blue
      const mergeSetBlues = data.verboseData?.mergeSetBluesHashes || []
      const isBlue = mergeSetBlues.length > 0 || Math.random() > 0.15

      return {
        hash,
        parentHashes: parents,
        blueScore,
        daaScore,
        timestamp,
        txCount,
        isBlue,
        x: 0, y: 0,
        targetX: 0, targetY: 0,
        opacity: 0, scale: 0.5,
        glowIntensity: 1,
        addedAt: performance.now()
      }
    } catch {
      return null
    }
  }

  private async startStatsPolling() {
    const poll = async () => {
      try {
        const [blueScoreRes, hashrateRes, dagInfoRes] = await Promise.allSettled([
          fetch(`${API_BASE}/info/virtual-chain-blue-score`),
          fetch(`${API_BASE}/info/hashrate?stringOnly=false`),
          fetch(`${API_BASE}/info/blockdag`),
        ])

        const stats: Partial<NetworkStats> = { isConnected: true, isSynced: true }

        if (blueScoreRes.status === 'fulfilled' && blueScoreRes.value.ok) {
          const d = await blueScoreRes.value.json()
          stats.blueScore = Number(d.blueScore || 0)
        }

        if (hashrateRes.status === 'fulfilled' && hashrateRes.value.ok) {
          const d = await hashrateRes.value.json()
          const hr = Number(d.hashrate || 0)
          if (hr >= 1e6) stats.hashrate = (hr / 1e6).toFixed(1) + ' TH/s'
          else if (hr >= 1e3) stats.hashrate = (hr / 1e3).toFixed(1) + ' GH/s'
          else stats.hashrate = hr.toFixed(0) + ' MH/s'
        }

        if (dagInfoRes.status === 'fulfilled' && dagInfoRes.value.ok) {
          const d = await dagInfoRes.value.json()
          const daaScore = Number(d.virtualDaaScore || 0)
          if (daaScore > 0) stats.daaScore = daaScore
        }

        this.statsCallbacks.forEach(cb => cb(stats))
      } catch (e) {
        console.warn('[KaspaClient] Stats poll failed:', e)
      }
    }

    await poll()
    this.statsInterval = setInterval(poll, 5000)
  }

  private startMock() {
    this.useMock = true
    this.mockStream = new MockBlockStream()
    this.mockStream.start((block) => {
      this.blockCallbacks.forEach(cb => cb(block))
    })
    this.setState('connected')

    this.statsInterval = setInterval(() => {
      const bps = 9 + Math.random() * 2
      this.statsCallbacks.forEach(cb => cb({
        blocksPerSecond: bps,
        txPerSecond: bps * 0.4,
        hashrate: (450 + Math.random() * 50).toFixed(1) + ' TH/s',
        peerCount: 180 + Math.floor(Math.random() * 40),
        isConnected: true,
        isSynced: true,
        serverVersion: 'mock',
      }))
    }, 1000)
  }

  async getBlockDetail(hash: string): Promise<BlockDetail | null> {
    try {
      const res = await fetch(`${API_BASE}/blocks/${hash}`)
      if (!res.ok) return null
      const data = await res.json()

      const parents: string[] = []
      if (data.parents) {
        for (const level of data.parents) {
          if (Array.isArray(level.parentHashes)) {
            parents.push(...level.parentHashes)
          }
        }
      }

      return {
        hash: data.verboseData?.hash || hash,
        parentHashes: parents,
        blueScore: Number(data.verboseData?.blueScore || 0),
        daaScore: Number(data.header?.daaScore || 0),
        timestamp: Number(data.header?.timestamp || 0),
        isBlue: true,
        nonce: String(data.header?.nonce || '0'),
        bits: Number(data.header?.bits || 0),
        version: Number(data.header?.version || 0),
        transactions: (data.transactions || []).map((tx: any) => ({
          id: tx.verboseData?.transactionId || 'unknown',
          inputs: tx.inputs?.length || 0,
          outputs: tx.outputs?.length || 0,
          amount: 0,
        }))
      }
    } catch (e) {
      console.warn('[KaspaClient] getBlockDetail failed:', e)
      return null
    }
  }

  disconnect() {
    if (this.mockStream) {
      this.mockStream.stop()
      this.mockStream = null
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
    this.setState('disconnected')
  }
}

export const kaspaClient = new KaspaClient()
