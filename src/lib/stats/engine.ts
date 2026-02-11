export class RollingAverage {
  private values: number[] = []
  private windowMs: number

  constructor(windowMs = 3000) {
    this.windowMs = windowMs
  }

  add(value: number, timestamp = Date.now()) {
    this.values.push(value)
    // Keep reasonable buffer
    if (this.values.length > 100) this.values.shift()
  }

  get average(): number {
    if (this.values.length === 0) return 0
    return this.values.reduce((a, b) => a + b, 0) / this.values.length
  }

  get count(): number {
    return this.values.length
  }
}

export function formatHashrate(hashrate: number): string {
  if (hashrate >= 1e18) return (hashrate / 1e18).toFixed(1) + ' EH/s'
  if (hashrate >= 1e15) return (hashrate / 1e15).toFixed(1) + ' PH/s'
  if (hashrate >= 1e12) return (hashrate / 1e12).toFixed(1) + ' TH/s'
  if (hashrate >= 1e9) return (hashrate / 1e9).toFixed(1) + ' GH/s'
  if (hashrate >= 1e6) return (hashrate / 1e6).toFixed(1) + ' MH/s'
  return hashrate.toFixed(0) + ' H/s'
}

export function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(1)
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function truncateHash(hash: string, len = 8): string {
  if (hash.length <= len * 2 + 3) return hash
  return hash.slice(0, len) + '...' + hash.slice(-len)
}
