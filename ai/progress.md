# DAGPulse Progress

## Status: Day 2 Polish In Progress

## Completed
- [x] Project scaffold: Svelte 5 + Vite + TailwindCSS 4 + TypeScript
- [x] Kaspa REST API client (polls /info/blockdag + /blocks/{hash})
- [x] Mock data fallback when API unavailable
- [x] Canvas DAG renderer (blocks, edges, glow, grid, vignette)
- [x] Column-based layout algorithm with arrival-time batching
- [x] Synthetic nearest-neighbor edges between columns
- [x] Pan/zoom interaction (mouse wheel + drag)
- [x] Auto-follow mode
- [x] Stats panel (BPS, TPS, Blue Score, DAA Score, Hashrate, Peers)
- [x] Block Inspector (click block to see details)
- [x] Speed Benchmark bar (Kaspa vs ETH vs BTC)
- [x] Connection status indicator
- [x] Mobile responsive layout
- [x] README.md + AI_USAGE.md + LICENSE
- [x] GitHub repo: https://github.com/Yonkoo11/dagpulse
- [x] GitHub Pages deployed: https://yonkoo11.github.io/dagpulse/
- [x] Live demo verified working (93 blocks, edges, stats all visible)

## In Progress (Background Agent af1e95f)
- [ ] Better block fetching (fetch parent blocks for denser DAG)
- [ ] Fix DAA Score display (showing "---")
- [ ] Improve Block Inspector (full block detail, parent links, explorer link)
- [ ] Touch support for mobile (pinch zoom, tap select)
- [ ] Visual polish (edge arrows, noise texture, BPS animation)

## Remaining (Day 3)
- [ ] Take screenshot for README
- [ ] Record 3-min demo video
- [ ] Submit on DoraHacks
- [ ] Final build + deploy to GitHub Pages
- [ ] Clean up untracked files (public/, src/assets/, src/lib/Counter.svelte)

## Key Decisions
- **REST API instead of WASM**: kaspa-wasm npm package is node-only. Using REST polling.
- **Synthetic edges**: API tip blocks don't share parents in visible set. Deterministic nearest-neighbor edges.
- **150 block max**: Older blocks trimmed for performance.
- **Layout**: BLOCK_RADIUS=14, SPACING_X=55, SPACING_Y=46, 20ms batch threshold

## URLs
- Repo: https://github.com/Yonkoo11/dagpulse
- Live: https://yonkoo11.github.io/dagpulse/
- API: https://api.kaspa.org

## Dev
```bash
cd ~/Projects/dagpulse
npm run dev  # http://localhost:5173/dagpulse/
npm run build && npx gh-pages -d dist  # Deploy
```
