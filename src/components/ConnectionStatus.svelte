<script lang="ts">
  import { connectionState } from '../stores/ui'

  const statusConfig = {
    disconnected: { color: 'bg-gray-500', label: 'Offline', icon: '!' },
    connecting: { color: 'bg-yellow-500', label: 'Connecting...', icon: '~' },
    connected: { color: 'bg-success', label: 'Connected', icon: '' },
    error: { color: 'bg-red-500', label: 'Error', icon: '!' },
  }

  let config = $derived(statusConfig[$connectionState] || statusConfig.disconnected)
</script>

<div class="flex items-center gap-1.5 text-xs" role="status" aria-live="polite">
  <div class="relative" aria-hidden="true">
    <div class="w-2 h-2 rounded-full {config.color}"></div>
    {#if $connectionState === 'connected'}
      <div class="absolute inset-0 w-2 h-2 rounded-full {config.color} animate-ping opacity-75"></div>
    {/if}
  </div>
  <span class="text-text-dim">{config.label}</span>
</div>
