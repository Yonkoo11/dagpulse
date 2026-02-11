<script lang="ts">
  import { blocksPerSecond, txPerSecond } from '../stores/dag'
  import { networkStats } from '../stores/stats'
  import { formatNumber } from '../lib/stats/engine'

  interface StatItem {
    label: string
    value: string
    accent?: boolean
  }

  let stats: StatItem[] = $derived([
    { label: 'Blocks/sec', value: $blocksPerSecond.toFixed(1), accent: true },
    { label: 'TX/sec', value: $txPerSecond.toFixed(1) },
    { label: 'Blue Score', value: $networkStats.blueScore > 0 ? formatNumber($networkStats.blueScore) : '---' },
    { label: 'DAA Score', value: $networkStats.daaScore > 0 ? formatNumber($networkStats.daaScore) : '---' },
    { label: 'Hashrate', value: $networkStats.hashrate },
    { label: 'Peers', value: $networkStats.peerCount > 0 ? String($networkStats.peerCount) : '---' },
  ])
</script>

<div class="w-56 bg-surface/60 backdrop-blur border-r border-border flex flex-col overflow-y-auto">
  <div class="p-3 border-b border-border">
    <h2 class="text-xs font-semibold text-text-dim uppercase tracking-wider">Network Stats</h2>
  </div>

  <div class="flex-1 p-3 space-y-3">
    {#each stats as stat}
      <div class="animate-fade-in">
        <div class="text-[10px] text-text-dim uppercase tracking-wider mb-0.5">{stat.label}</div>
        <div class="text-xl font-bold tabular-nums {stat.accent ? 'text-accent' : 'text-text'}">
          {stat.value}
        </div>
      </div>
    {/each}
  </div>

  <!-- Speed comparison -->
  <div class="p-3 border-t border-border">
    <h3 class="text-[10px] text-text-dim uppercase tracking-wider mb-2">Confirmation Speed</h3>
    <div class="space-y-1.5">
      <div class="flex items-center gap-2">
        <div class="w-full bg-bg rounded-full h-2 overflow-hidden">
          <div class="h-full bg-accent rounded-full" style="width: 2%"></div>
        </div>
        <span class="text-[10px] text-accent font-mono whitespace-nowrap">KAS 1s</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-full bg-bg rounded-full h-2 overflow-hidden">
          <div class="h-full bg-purple-500/60 rounded-full" style="width: 12%"></div>
        </div>
        <span class="text-[10px] text-text-dim font-mono whitespace-nowrap">ETH 12s</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-full bg-bg rounded-full h-2 overflow-hidden">
          <div class="h-full bg-orange-500/60 rounded-full" style="width: 100%"></div>
        </div>
        <span class="text-[10px] text-text-dim font-mono whitespace-nowrap">BTC 10m</span>
      </div>
    </div>
  </div>
</div>
