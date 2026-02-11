# AI Usage Disclosure

This project was built with the assistance of AI tools, as required by the Kaspathon hackathon rules.

## Tools Used

- **Claude Code** (Anthropic Claude Opus 4.6) -- Used as a coding assistant for:
  - Project scaffolding and configuration
  - Component generation (Svelte components, TypeScript modules)
  - Canvas rendering logic (block drawing, edge curves, animations)
  - Kaspa REST API integration code
  - CSS styling and Tailwind configuration
  - Bug fixing and iteration on visual output

## What AI Did

- Generated boilerplate code (Vite config, Tailwind setup, TypeScript interfaces)
- Wrote the Canvas rendering engine (renderer.ts, layout.ts)
- Implemented the Kaspa API client with polling and fallback logic
- Created Svelte components for the UI (stats panel, block inspector, header)
- Iterated on visual quality based on screenshot feedback

## What a Human Did

- Product vision and requirements (what to build, why, for whom)
- Architecture decisions (REST API vs WASM, column-based layout vs time-based)
- Visual design direction (color palette, layout structure, animation style)
- API research and endpoint selection
- Quality review and iteration direction
- Deployment and submission

## Percentage Estimate

- ~70% of code was AI-generated
- ~30% was human-directed iteration, debugging, and architectural decisions
- 100% of product direction and design decisions were human
