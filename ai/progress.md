# DAGPulse Progress

## Status: Day 1 MVP WORKING
- Initial commit: 9719a71

## What's Done (Day 1)
- [x] Project scaffold: Svelte 5 + Vite + TailwindCSS 4 + TypeScript
- [x] Kaspa REST API client (api.kaspa.org) - polls /info/blockdag for tip hashes, fetches blocks
- [x] Mock data fallback when API unavailable
- [x] Canvas-based DAG renderer with:
  - Block nodes (cyan circles for blue, gray for red)
  - Bezier curve edges between columns (deterministic hash-based parent assignment)
  - Glow animation on new blocks
  - Grid background
  - Vignette edges
- [x] Layout algorithm: batch blocks by arrival time into columns, spread vertically
- [x] Pan/zoom interaction (mouse wheel zoom, click-drag pan)
- [x] Auto-follow mode (tracks DAG tip, toggleable)
- [x] Stats panel sidebar: BPS, TPS, Blue Score, DAA Score, Hashrate, Peers
- [x] Block Inspector panel (bottom, shows on click): hash, blue score, DAA score, timestamp, tx count, parents, type
- [x] Speed Benchmark bar: Kaspa (live) vs ETH (~12s) vs BTC (~600s)
- [x] Connection status indicator (green dot + label)
- [x] Header with branding
- [x] Dark theme: navy-black bg, cyan accents, proper contrast
- [x] Git repo initialized on `main` branch

## Key Decisions
- **REST API instead of WASM**: kaspa-wasm npm package is node-only (uses require('util')). Using REST polling instead.
- **Synthetic edges**: API tip blocks don't share parents with our visible set. Drawing deterministic edges between adjacent columns using block hash as seed.
- **No kaspa-wasm dependency**: Removed from package.json. Pure fetch-based.

## What's Next (Day 2)
- [ ] Fix block click detection (may need testing)
- [ ] Add some red (non-blue) blocks visually
- [ ] Improve edge rendering (currently too dense in large columns)
- [ ] Responsive layout for mobile
- [ ] Loading/error states
- [ ] README.md with screenshots and architecture
- [ ] AI_USAGE.md disclosure
- [ ] GitHub repo push
- [ ] GitHub Pages deploy

## What's Next (Day 3)
- [ ] Visual polish: noise texture, refined animations
- [ ] Demo video (3 min screen recording)
- [ ] DoraHacks submission
- [ ] Send & Watch feature (if time)

## Tech Stack
- Svelte 5 + Vite 7 + TypeScript
- TailwindCSS 4
- HTML5 Canvas API
- Kaspa REST API (api.kaspa.org)
- Deploy: GitHub Pages (static SPA)

## Project Structure
```
src/
  App.svelte              # Root layout
  main.ts                 # Entry
  app.css                 # Tailwind + theme + animations
  lib/
    kaspa/
      client.ts           # REST API polling client
      types.ts            # DagBlock, NetworkStats, etc.
      mock.ts             # Mock block generator
    dag/
      renderer.ts         # Canvas rendering (blocks, edges, glow)
      layout.ts           # Column-based layout algorithm
      interaction.ts      # Pan/zoom state machine
    stats/
      engine.ts           # Formatters, rolling averages
  components/
    DagCanvas.svelte      # Canvas wrapper + render loop
    StatsPanel.svelte     # Sidebar stats
    BlockInspector.svelte # Block detail panel
    SpeedBenchmark.svelte # Speed comparison bar
    Header.svelte         # Top bar
    ConnectionStatus.svelte # Connection indicator
  stores/
    dag.ts                # Block store + BPS/TPS calculation
    stats.ts              # Network stats store
    ui.ts                 # UI state (selected block, connection)
```

## Dev Server
```bash
cd ~/Projects/dagpulse
npm run dev  # http://localhost:5173/dagpulse/
```
