# DAGPulse

**See the fastest blockchain. Live.**

DAGPulse is a real-time BlockDAG visualization dashboard for the [Kaspa](https://kaspa.org) network. Watch blocks arrive at ~10 per second, see the directed acyclic graph structure form in real-time, and inspect individual blocks with their transaction data.

![DAGPulse Screenshot](https://raw.githubusercontent.com/pfrfrfr/dagpulse/main/screenshot.png)

## Features

- **Live BlockDAG Visualization** -- Canvas-based animated DAG showing real Kaspa blocks arriving in real-time with bezier curve edges connecting parent blocks
- **Real-time Network Stats** -- Blocks per second, transactions per second, hashrate, blue score, DAA score, all updating live
- **Block Inspector** -- Click any block to see its hash, blue score, DAA score, timestamp, transaction count, parent count, and GHOSTDAG classification
- **Interactive Canvas** -- Zoom (scroll wheel), pan (click-drag), auto-follow mode that tracks the DAG tip
- **Speed Benchmark** -- Live comparison showing Kaspa's confirmation speed vs Ethereum (~12s) and Bitcoin (~600s)
- **Responsive Design** -- Works on desktop, tablet, and mobile with adaptive layout

## How It Works

DAGPulse connects to the Kaspa REST API (`api.kaspa.org`) and polls for new blocks every second. Each new block is rendered as a node on the HTML5 Canvas, with edges drawn to show the DAG parent-child relationships. The visualization uses column-based layout where blocks arriving in the same time batch are stacked vertically, creating the characteristic widening-narrowing pattern of a BlockDAG.

```
┌─────────────────────────────────────────────────┐
│  DAGPulse (Svelte SPA)                          │
│  ┌──────────┐  ┌──────────────────────────────┐ │
│  │Stats     │  │  DAG Canvas                  │ │
│  │Panel     │  │  ○──○──○                     │ │
│  │          │  │ /    \ /                     │ │
│  │BPS: 10   │  │○──────○──○                   │ │
│  │TPS: 4    │  │       \ /                    │ │
│  │Score:91M │  │        ○                     │ │
│  └──────────┘  └──────────────────────────────┘ │
│  [Block Inspector: hash | Parents | TXs]        │
│  [Speed Benchmark: KAS 0.3s | ETH 12s | BTC 10m]│
└──────────────────┬──────────────────────────────┘
                   │ REST API (polling)
                   ▼
        ┌──────────────────┐
        │ api.kaspa.org    │
        └──────────────────┘
```

## Tech Stack

- **Frontend**: [Svelte 5](https://svelte.dev) + [Vite](https://vite.dev) + TypeScript
- **Styling**: [TailwindCSS 4](https://tailwindcss.com)
- **Rendering**: HTML5 Canvas API (60fps render loop)
- **Data**: [Kaspa REST API](https://api.kaspa.org/docs)
- **Deployment**: GitHub Pages (static SPA)

## Getting Started

```bash
# Clone
git clone https://github.com/pfrfrfr/dagpulse.git
cd dagpulse

# Install
npm install

# Dev server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173/dagpulse/`

## Project Structure

```
src/
├── App.svelte                 # Root layout + client wiring
├── main.ts                    # Entry point
├── app.css                    # Tailwind + theme variables + animations
├── lib/
│   ├── kaspa/
│   │   ├── client.ts          # REST API client (poll blocks + stats)
│   │   ├── types.ts           # TypeScript interfaces
│   │   └── mock.ts            # Mock data generator (fallback)
│   ├── dag/
│   │   ├── renderer.ts        # Canvas DAG renderer (blocks, edges, glow)
│   │   ├── layout.ts          # Column-based layout algorithm
│   │   └── interaction.ts     # Pan/zoom state machine
│   └── stats/
│       └── engine.ts          # Formatters and utilities
├── components/
│   ├── DagCanvas.svelte       # Canvas wrapper + render loop
│   ├── StatsPanel.svelte      # Live stats sidebar
│   ├── BlockInspector.svelte  # Block detail panel
│   ├── SpeedBenchmark.svelte  # Speed comparison bar
│   ├── Header.svelte          # Top bar with branding
│   └── ConnectionStatus.svelte# WebSocket status indicator
└── stores/
    ├── dag.ts                 # Block data + BPS/TPS calculation
    ├── stats.ts               # Network stats state
    └── ui.ts                  # UI state (selection, connection)
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /info/blockdag` | DAG tip hashes, virtual DAA score |
| `GET /blocks/{hash}` | Individual block data with parents and transactions |
| `GET /info/virtual-chain-blue-score` | Current blue score |
| `GET /info/hashrate` | Network hashrate |

## License

MIT

## Kaspathon Submission

Built for the [Kaspathon](https://dorahacks.io) hackathon.

- **Track**: Real-Time Data
- **AI Usage**: See [AI_USAGE.md](./AI_USAGE.md)
