import type { DagBlock, NetworkStats, ConnectionState, BlockDetail } from './types'
import { MockBlockStream } from './mock'

const API_BASE = 'https://api.kaspa.org'

type BlockCallback = (block: DagBlock) => void
type StatsCallback = (stats: Partial<NetworkStats>) => void
type StateCallback = (state: ConnectionState) => void
type BatchCallback = (blocks: DagBlock[]) => void

export class KaspaClient {
  private mockStream: MockBlockStream | null = null
  private blockCallbacks: BlockCallback[] = []
  private batchCallbacks: BatchCallback[] = []
  private statsCallbacks: StatsCallback[] = []
  private stateCallbacks: StateCallback[] = []
  private _state: ConnectionState = 'disconnected'
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private statsInterval: ReturnType<typeof setInterval> | null = null
  private useMock = false
  private seenHashes = new Set<string>()
  private lastBlueScore = 0
  private initialFetchDone = false

  get state(): ConnectionState {
    return this._state
  }

  onBlock(cb: BlockCallback) { this.blockCallbacks.push(cb) }
  onBatch(cb: BatchCallback) { this.batchCallbacks.push(cb) }
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
    // Fetch initial subgraph from current tip
    await this.fetchRecentBlocks()
    this.initialFetchDone = true

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

      if (!this.initialFetchDone) {
        // Initial fetch: pick first tip and walk parents to depth 3 (capped at 80 blocks)
        const startHash = tipHashes[0]
        if (startHash) {
          const subgraph = await this.fetchSubgraph(startHash, 3, 80)
          this.classifyBlueRed(subgraph)
          // Emit all blocks as a batch
          for (const block of subgraph) {
            this.seenHashes.add(block.hash)
          }
          this.batchCallbacks.forEach(cb => cb(subgraph))
          for (const block of subgraph) {
            this.blockCallbacks.forEach(cb => cb(block))
          }
          this.statsCallbacks.forEach(cb => cb({ blocksSeen: this.seenHashes.size }))
        }
      } else {
        // Subsequent polls: fetch new tips and their parents (depth 1-2)
        const newHashes = tipHashes.filter(h => !this.seenHashes.has(h))
        const hashesToFetch = newHashes.slice(0, 10)

        if (hashesToFetch.length > 0) {
          const allNewBlocks: DagBlock[] = []
          for (const hash of hashesToFetch) {
            const subgraph = await this.fetchSubgraph(hash, 1, 15)
            // Filter to only truly new blocks
            const newBlocks = subgraph.filter(b => !this.seenHashes.has(b.hash))
            allNewBlocks.push(...newBlocks)
            for (const block of newBlocks) {
              this.seenHashes.add(block.hash)
            }
          }

          if (allNewBlocks.length > 0) {
            this.classifyBlueRed(allNewBlocks)
            this.batchCallbacks.forEach(cb => cb(allNewBlocks))
            for (const block of allNewBlocks) {
              this.blockCallbacks.forEach(cb => cb(block))
            }
            this.statsCallbacks.forEach(cb => cb({ blocksSeen: this.seenHashes.size }))
          }
        }
      }

      // Trim seen hashes to prevent unbounded growth
      if (this.seenHashes.size > 500) {
        const iter = this.seenHashes.values()
        for (let i = 0; i < 200; i++) {
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

  /**
   * Recursively fetch a block and its parents up to maxDepth.
   * Caps total blocks to maxBlocks to avoid exploding with K=10 parents.
   */
  private async fetchSubgraph(startHash: string, maxDepth: number, maxBlocks = 80): Promise<DagBlock[]> {
    const result: DagBlock[] = []
    const visited = new Set<string>()
    let currentLevel = [startHash]

    for (let depth = 0; depth <= maxDepth && currentLevel.length > 0 && result.length < maxBlocks; depth++) {
      const nextLevel: string[] = []
      // Cap blocks per level to prevent exponential blowup (K=10 parents per block)
      const levelHashes = currentLevel.slice(0, Math.max(5, maxBlocks - result.length))

      // Fetch blocks in parallel (batches of 5)
      for (let i = 0; i < levelHashes.length && result.length < maxBlocks; i += 5) {
        const batch = levelHashes.slice(i, i + 5)
        const promises = batch.map(async (hash) => {
          if (visited.has(hash) || this.seenHashes.has(hash)) return null
          visited.add(hash)
          try {
            const res = await fetch(`${API_BASE}/blocks/${hash}`)
            if (!res.ok) return null
            const data = await res.json()
            return { data, hash }
          } catch {
            return null
          }
        })

        const results = await Promise.all(promises)
        for (const item of results) {
          if (!item || result.length >= maxBlocks) continue
          const block = this.parseRestBlock(item.data)
          if (!block) continue
          result.push(block)

          // Queue parents for next depth level (limit to first 3 parents to keep graph manageable)
          if (depth < maxDepth) {
            for (const parentHash of block.parentHashes.slice(0, 3)) {
              if (!visited.has(parentHash) && !this.seenHashes.has(parentHash)) {
                nextLevel.push(parentHash)
              }
            }
          }
        }
      }

      currentLevel = nextLevel
    }

    return result
  }

  /**
   * Second pass: classify blocks as blue or red based on merge set data.
   * A block appearing in any other block's mergeSetReds is red.
   * Otherwise it's blue.
   */
  private classifyBlueRed(blocks: DagBlock[]) {
    const redSet = new Set<string>()

    // Collect all hashes that appear in red merge sets
    for (const block of blocks) {
      for (const redHash of block.mergeSetReds) {
        redSet.add(redHash)
      }
    }

    // Apply classification
    for (const block of blocks) {
      if (redSet.has(block.hash)) {
        block.isBlue = false
      }
      // blocks default to isBlue=true from parseRestBlock
    }
  }

  private parseRestBlock(data: any): DagBlock | null {
    try {
      const hash = data.verboseData?.hash || ''
      if (!hash) return null

      const parents: string[] = []
      const parentLevels = data.header?.parents || data.parents || []
      for (const level of parentLevels) {
        if (Array.isArray(level.parentHashes)) {
          parents.push(...level.parentHashes)
        }
      }

      const blueScore = Number(data.verboseData?.blueScore || 0)
      const daaScore = Number(data.header?.daaScore || 0)
      const timestamp = Number(data.header?.timestamp || Date.now())
      const txCount = data.transactions?.length || 0

      const mergeSetBlues: string[] = data.verboseData?.mergeSetBluesHashes || []
      const mergeSetReds: string[] = data.verboseData?.mergeSetRedsHashes || []
      const selectedParentHash: string | null = (parentLevels[0]?.parentHashes?.[0]) || null

      return {
        hash,
        parentHashes: parents,
        blueScore,
        daaScore,
        timestamp,
        txCount,
        isBlue: true, // default to blue, classifyBlueRed will fix
        mergeSetBlues,
        mergeSetReds,
        isVirtualChain: false, // set later by markVirtualChain
        selectedParentHash,
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
      const parentLevels = data.header?.parents || data.parents || []
      for (const level of parentLevels) {
        if (Array.isArray(level.parentHashes)) {
          parents.push(...level.parentHashes)
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
