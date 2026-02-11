export interface PanZoomState {
  offsetX: number
  offsetY: number
  zoom: number
  isDragging: boolean
  lastMouseX: number
  lastMouseY: number
}

export function createPanZoomState(width: number): PanZoomState {
  return {
    offsetX: 100,
    offsetY: 0,
    zoom: 1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  }
}

export function handleWheel(state: PanZoomState, e: WheelEvent): PanZoomState {
  const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08
  const newZoom = Math.max(0.3, Math.min(3, state.zoom * zoomFactor))

  // Zoom toward mouse position
  const mouseX = e.offsetX
  const mouseY = e.offsetY

  const scale = newZoom / state.zoom
  const newOffsetX = mouseX - (mouseX - state.offsetX) * scale
  const newOffsetY = mouseY - (mouseY - state.offsetY) * scale

  return {
    ...state,
    zoom: newZoom,
    offsetX: newOffsetX,
    offsetY: newOffsetY,
  }
}

export function handleMouseDown(state: PanZoomState, e: MouseEvent): PanZoomState {
  return {
    ...state,
    isDragging: true,
    lastMouseX: e.clientX,
    lastMouseY: e.clientY,
  }
}

export function handleMouseMove(state: PanZoomState, e: MouseEvent): PanZoomState {
  if (!state.isDragging) return state
  const dx = e.clientX - state.lastMouseX
  const dy = e.clientY - state.lastMouseY
  return {
    ...state,
    offsetX: state.offsetX + dx,
    offsetY: state.offsetY + dy,
    lastMouseX: e.clientX,
    lastMouseY: e.clientY,
  }
}

export function handleMouseUp(state: PanZoomState): PanZoomState {
  return { ...state, isDragging: false }
}
