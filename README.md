# ng-diagram-orgchart

Interactive organizational chart demo built with Angular 21 and [ng-diagram](https://www.npmjs.com/package/ng-diagram).

Features drag-and-drop reordering, expand/collapse subtrees, node editing via sidebar, horizontal/vertical layout switching, dark/light theme, minimap navigation, and animated transitions powered by [ELK.js](https://www.npmjs.com/package/elkjs).

## Prerequisites

- Node.js v20.19+ or v22.12+
- npm 10+

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests (Vitest) |
| `npm run format` | Format code with Prettier |

## Project Structure

```
src/app/
├── app.component.ts                    # Root shell
├── app.config.ts                       # App providers
├── app.routes.ts                       # Lazy-loaded routing
└── org-chart/
    ├── pages/                          # Page containers
    ├── diagram/                        # Core diagram feature
    │   ├── diagram.component.ts        # Main diagram component
    │   ├── edge.component.ts           # Edge template
    │   ├── data.ts                     # Seed data
    │   ├── model/                      # Domain types & services
    │   │   ├── interfaces.ts           # OrgChartNodeData, OrgChartEdgeData
    │   │   ├── guards.ts              # Type guard functions
    │   │   ├── data-getters.ts        # Data accessor helpers
    │   │   ├── model-changes.ts       # Change accumulator
    │   │   ├── model-apply.service.ts # Applies changes with layout
    │   │   ├── hierarchy.service.ts   # Parent-child relationships
    │   │   ├── expand-collapse.service.ts
    │   │   ├── sort-order.service.ts
    │   │   └── add-node.service.ts
    │   ├── node/                       # Node rendering (3 variants)
    │   ├── layout/                     # ELK.js layout engine
    │   ├── animation/                  # Layout transition animations
    │   └── node-visibility/            # Viewport-aware visibility
    ├── dragging/                       # Drag-and-drop subsystem
    │   ├── zone-detection/             # Drop zone strategies
    │   └── drop-strategy/              # Drop action strategies
    ├── properties-sidebar/             # Node editing panel
    ├── shared/                         # Reusable UI (combobox, avatar)
    ├── top-navbar/                     # Navigation bar + theme toggle
    ├── toolbar-horizontal/             # Layout direction toolbar
    └── minimap-panel/                  # Minimap with zoom controls
```

## Tech Stack

- **Angular 21** — standalone components, signals, OnPush change detection
- **ng-diagram** — diagram rendering, viewport management, selection
- **ELK.js** — automatic graph layout computation (via Web Worker)
- **Vitest** — unit test runner
- **Prettier** — code formatting
