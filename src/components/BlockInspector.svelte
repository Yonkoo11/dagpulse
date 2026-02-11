<script lang="ts">
  import { selectedBlock, showInspector, selectBlock } from '../stores/ui'
  import { truncateHash, formatTimestamp } from '../lib/stats/engine'

  function close() {
    selectBlock(null)
  }

  function copyHash() {
    if ($selectedBlock) {
      navigator.clipboard.writeText($selectedBlock.hash)
    }
  }
</script>

{#if $showInspector && $selectedBlock}
  <div class="h-44 bg-surface/80 backdrop-blur border-t border-border flex flex-col animate-fade-in overflow-hidden">
    <div class="flex items-center justify-between px-4 py-2 border-b border-border">
      <h3 class="text-xs font-semibold text-text-dim uppercase tracking-wider">Block Inspector</h3>
      <button onclick={close} class="text-text-dim hover:text-text transition-colors text-sm cursor-pointer">
        &times;
      </button>
    </div>

    <div class="flex-1 px-4 py-2 grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto">
      <!-- Hash -->
      <div class="col-span-2">
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Block Hash</div>
        <button onclick={copyHash} class="text-xs font-mono text-accent hover:text-accent-glow transition-colors cursor-pointer bg-transparent border-none p-0" title="Click to copy">
          {truncateHash($selectedBlock.hash, 16)}
        </button>
      </div>

      <!-- Blue Score -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Blue Score</div>
        <div class="text-sm font-bold tabular-nums text-text">{$selectedBlock.blueScore.toLocaleString()}</div>
      </div>

      <!-- DAA Score -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">DAA Score</div>
        <div class="text-sm font-bold tabular-nums text-text">{$selectedBlock.daaScore.toLocaleString()}</div>
      </div>

      <!-- Timestamp -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Timestamp</div>
        <div class="text-sm font-mono text-text">{formatTimestamp($selectedBlock.timestamp)}</div>
      </div>

      <!-- TX Count -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Transactions</div>
        <div class="text-sm font-bold tabular-nums {$selectedBlock.txCount > 0 ? 'text-tx' : 'text-text-dim'}">
          {$selectedBlock.txCount}
        </div>
      </div>

      <!-- Parents -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Parents</div>
        <div class="text-sm font-bold tabular-nums text-text">{$selectedBlock.parentHashes.length}</div>
      </div>

      <!-- Type -->
      <div>
        <div class="text-[10px] text-text-dim uppercase mb-0.5">Type</div>
        <div class="text-sm font-bold {$selectedBlock.isBlue ? 'text-accent' : 'text-block-red'}">
          {$selectedBlock.isBlue ? 'Blue (GHOSTDAG)' : 'Red'}
        </div>
      </div>
    </div>
  </div>
{/if}
