import { writable } from 'svelte/store'
import type { DagBlock, ConnectionState } from '../lib/kaspa/types'

export const selectedBlock = writable<DagBlock | null>(null)
export const connectionState = writable<ConnectionState>('disconnected')
export const showInspector = writable(false)
export const autoFollow = writable(true)

export function selectBlock(block: DagBlock | null) {
  selectedBlock.set(block)
  showInspector.set(block !== null)
}
