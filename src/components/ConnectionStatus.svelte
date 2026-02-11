<script lang="ts">
  import { connectionState } from '../stores/ui'

  const statusConfig = {
    disconnected: { color: 'bg-gray-500', label: 'Disconnected' },
    connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
    connected: { color: 'bg-success', label: 'Connected' },
    error: { color: 'bg-red-500', label: 'Error' },
  }

  let config = $derived(statusConfig[$connectionState] || statusConfig.disconnected)
</script>

<div class="flex items-center gap-1.5 text-xs">
  <div class="relative">
    <div class="w-2 h-2 rounded-full {config.color}"></div>
    {#if $connectionState === 'connected'}
      <div class="absolute inset-0 w-2 h-2 rounded-full {config.color} animate-ping opacity-75"></div>
    {/if}
  </div>
  <span class="text-text-dim">{config.label}</span>
</div>
