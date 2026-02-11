<script lang="ts">
  import { onMount } from 'svelte'
  import Header from './components/Header.svelte'
  import StatsPanel from './components/StatsPanel.svelte'
  import DagCanvas from './components/DagCanvas.svelte'
  import BlockInspector from './components/BlockInspector.svelte'
  import SpeedBenchmark from './components/SpeedBenchmark.svelte'
  import { kaspaClient } from './lib/kaspa/client'
  import { addBlock } from './stores/dag'
  import { updateStats } from './stores/stats'
  import { connectionState } from './stores/ui'
  import { blocksPerSecond, txPerSecond } from './stores/dag'
  import { networkStats } from './stores/stats'

  onMount(() => {
    // Wire up the client
    kaspaClient.onBlock(block => {
      addBlock(block)
    })

    kaspaClient.onStats(stats => {
      updateStats(stats)
    })

    kaspaClient.onStateChange(state => {
      connectionState.set(state)
    })

    // Also pipe rolling BPS/TPS into network stats
    const unsubBps = blocksPerSecond.subscribe(v => updateStats({ blocksPerSecond: v }))
    const unsubTps = txPerSecond.subscribe(v => updateStats({ txPerSecond: v }))

    // Connect
    kaspaClient.connect()

    return () => {
      kaspaClient.disconnect()
      unsubBps()
      unsubTps()
    }
  })
</script>

<div class="w-full h-full flex flex-col bg-bg">
  <Header />
  <div class="flex-1 flex min-h-0">
    <StatsPanel />
    <DagCanvas />
  </div>
  <BlockInspector />
  <SpeedBenchmark />
</div>
