# ng-diagram Org Chart Template

Interactive organizational chart built with Angular 21 and [ng-diagram](https://www.npmjs.com/package/ng-diagram). Use this project as a starting point for building your own org-chart or tree-based diagram.

Features: drag-and-drop reordering, expand/collapse subtrees, node editing via sidebar, node creation and removal, horizontal/vertical layout switching, dark/light theme, minimap navigation, and animated transitions powered by [ELK.js](https://www.npmjs.com/package/elkjs).

## Getting Started

**Prerequisites:** Node.js v20.19+ or v22.12+, npm 10+

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests (Vitest) |
| `npm run format` | Format code with Prettier |

## Customizing for Your Project

### Configuration

All tunable values (animation speed, layout spacing, zoom behavior, drag thresholds) are centralized in a single config file:

**`src/app/org-chart/org-chart.config.ts`**

To override defaults, add `provideOrgChartConfig` to your page providers:

```typescript
import { provideOrgChartConfig } from './org-chart.config';

providers: [
  provideOrgChartConfig({
    animation: { durationMs: 500, layoutEnabled: false },
    layout: { nodeSpacing: 200 },
    viewport: { compactScaleThreshold: 0.5, zoomStep: 0.25 },
    drag: { detectionRange: 150 },
  }),
]
```

Unspecified values keep their defaults. See `OrgChartConfig` interface for all options with documentation.

### Data Model

Node and edge data interfaces are defined in `src/app/org-chart/diagram/model/interfaces.ts`. The base node data includes properties for tree behavior:

| Property | Purpose |
|---|---|
| `isCollapsed` | Whether the node's subtree is collapsed |
| `isHidden` | Whether the node is hidden (inside a collapsed subtree) |
| `hasChildren` | Whether the node has child nodes |
| `collapsedChildrenCount` | Cached descendant count for collapsed nodes |
| `sortOrder` | Sibling ordering within the tree |

Property names are exported as constants (e.g., `IS_COLLAPSED`, `HAS_CHILDREN`) from the same file. All reads go through getter functions in `data-getters.ts`, and all writes use bracket notation with these constants. To rename a property, change the constant value and the interface — no other files need updating.

### Node Variants

The node component (`src/app/org-chart/diagram/node/`) renders three visual variants:

- **full** — complete card with stats and capacity bar (zoom >= threshold)
- **compact** — header only (zoom < threshold, configurable via `viewport.compactScaleThreshold`)
- **vacant** — placeholder card for unfilled positions

To customize node appearance, edit the components in `src/app/org-chart/diagram/node/components/`.

### Adding Your Own Data

Replace the seed data in `src/app/org-chart/diagram/data.ts`. Each node needs:

- A unique `id`
- `type: 'orgChartNode'`
- `position: { x: 0, y: 0 }` (layout engine computes actual positions)
- A `data` object matching `OrgChartNodeData`

Edges connect nodes via `source`/`target` IDs with port names `'port-out'` and `'port-in'`.


## Architecture

### Service Hierarchy

All services are provided at the page component level (`OrgChartPageComponent`) — no `providedIn: 'root'`. Drag-reorder services are scoped to the `DiagramComponent`.

```
OrgChartPageComponent (providers)
  ├── Layout: LayoutGate, LayoutService, LayoutAnimationService
  ├── Model: ModelApplyService, HierarchyService, SortOrderService,
  │          ExpandCollapseService, AddNodeService
  ├── UI: PropertiesSidebarService, NodeVisibilityService,
  │       NodeVisibilityConfigService
  └── DiagramComponent (providers)
      └── DragService, DropService, DragReorderService
```

### Key Patterns

- **ModelChanges accumulator** — mutations are batched in a `ModelChanges` object, then applied atomically via `ModelApplyService`
- **Layout gate** — prevents overlapping layout operations
- **Animation pipeline** — `ModelApplyService` orchestrates: compute layout, prepare animation start state, apply start, animate, apply final
- **Viewport overlays** — directives (`appViewportBounds`, `appViewportOverlay`) register UI elements that obscure the diagram, so visibility calculations account for them

## Project Structure

```
src/app/org-chart/
├── org-chart.config.ts                 # Central configuration
├── pages/                              # Page container
├── diagram/
│   ├── diagram.component.ts            # Main diagram component
│   ├── edge.component.ts               # Edge template
│   ├── data.ts                         # Seed data
│   ├── model/                          # Domain types & services
│   │   ├── interfaces.ts               # Data types + property key constants
│   │   ├── data-getters.ts             # Centralized property accessors
│   │   ├── model-changes.ts            # Change accumulator
│   │   ├── model-apply.service.ts      # Applies changes with layout
│   │   ├── hierarchy.service.ts        # Parent-child relationships
│   │   ├── expand-collapse.service.ts  # Subtree visibility
│   │   ├── sort-order.service.ts       # Sibling ordering
│   │   └── add-node.service.ts         # Node creation
│   ├── node/                           # Node rendering (3 variants)
│   ├── layout/                         # ELK.js layout engine
│   ├── animation/                      # Layout + viewport animations
│   └── node-visibility/                # Viewport-aware visibility
├── drag-reorder/                       # Drag-and-drop subsystem
│   ├── zone-detection/                 # Drop zone strategies
│   └── drop-strategy/                  # Drop action strategies
├── properties-sidebar/                 # Node editing panel
├── shared/                             # Reusable UI (combobox, avatar)
├── top-navbar/                         # Navigation bar + theme toggle
├── toolbar-horizontal/                 # Layout direction toolbar
└── minimap-panel/                      # Minimap with zoom controls
```

## Tech Stack

- **Angular 21** — standalone components, signals, OnPush change detection
- **ng-diagram** — diagram rendering, viewport management, selection
- **ELK.js** — automatic tree layout
- **Prettier** — code formatting
