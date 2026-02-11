<script lang="ts">
  import { onMount } from 'svelte'
  import Header from './components/Header.svelte'
  import StatsPanel from './components/StatsPanel.svelte'
  import DagCanvas from './components/DagCanvas.svelte'
  import BlockInspector from './components/BlockInspector.svelte'
  import SpeedBenchmark from './components/SpeedBenchmark.svelte'
  import { kaspaClient } from './lib/kaspa/client'
  import { addBlock, blocks } from './stores/dag'
  import { updateStats } from './stores/stats'
  import { connectionState } from './stores/ui'
  import { blocksPerSecond, txPerSecond } from './stores/dag'

  let showStats = $state(true)
  let isMobile = $state(false)

  function checkMobile() {
    isMobile = window.innerWidth < 768
    if (isMobile) showStats = false
  }

  onMount(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)

    kaspaClient.onBlock(block => {
      addBlock(block)
    })

    kaspaClient.onStats(stats => {
      updateStats(stats)
    })

    kaspaClient.onStateChange(state => {
      connectionState.set(state)
    })

    const unsubBps = blocksPerSecond.subscribe(v => updateStats({ blocksPerSecond: v }))
    const unsubTps = txPerSecond.subscribe(v => updateStats({ txPerSecond: v }))

    kaspaClient.connect()

    return () => {
      kaspaClient.disconnect()
      unsubBps()
      unsubTps()
      window.removeEventListener('resize', checkMobile)
    }
  })

  function toggleStats() {
    showStats = !showStats
  }

  let isConnecting = $derived($connectionState === 'connecting' || $connectionState === 'disconnected')
  let hasBlocks = $derived($blocks.length > 0)
</script>

<div class="w-full h-full flex flex-col bg-bg">
  <Header {isMobile} {toggleStats} {showStats} />
  <div class="flex-1 flex min-h-0 relative">
    {#if showStats}
      <StatsPanel />
    {/if}
    <DagCanvas />

    <!-- Loading overlay -->
    {#if isConnecting && !hasBlocks}
      <div class="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-10">
        <div class="text-center animate-fade-in">
          <div class="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-4"></div>
          <div class="text-text text-lg font-semibold">Connecting to Kaspa Network</div>
          <div class="text-text-dim text-sm mt-1">Fetching live BlockDAG data...</div>
        </div>
      </div>
    {/if}
  </div>
  <BlockInspector />
  <SpeedBenchmark />
</div>
