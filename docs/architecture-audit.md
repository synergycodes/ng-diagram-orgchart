# Angular Architecture Audit Report

**Project:** ng-diagram-orgchart  
**Angular version:** 21.2.0  
**Date:** 2026-04-10  
**Scope:** Full architecture audit — SOLID principles, declarative patterns, project structure, type safety, styling, testing, tooling

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Structure](#2-project-structure)
3. [SOLID Principles Compliance](#3-solid-principles-compliance)
4. [Declarative vs Imperative Patterns](#4-declarative-vs-imperative-patterns)
5. [Signals & Reactivity](#5-signals--reactivity)
6. [Component Architecture](#6-component-architecture)
7. [Service Layer Architecture](#7-service-layer-architecture)
8. [Dependency Graph & Coupling Analysis](#8-dependency-graph--coupling-analysis)
9. [Type System & Type Safety](#9-type-system--type-safety)
10. [Strategy Pattern Implementations](#10-strategy-pattern-implementations)
11. [Styling Architecture](#11-styling-architecture)
12. [TypeScript & Build Configuration](#12-typescript--build-configuration)
13. [Testing & Code Quality Tooling](#13-testing--code-quality-tooling)
14. [Summary Scorecard](#14-summary-scorecard)
15. [Prioritized Recommendations](#15-prioritized-recommendations)

---

## 1. Executive Summary

This is a **well-architected Angular 21 application** that demonstrates strong adherence to modern Angular patterns and SOLID principles. The codebase uses standalone components exclusively, signals as the primary reactivity model, OnPush change detection everywhere, and feature-based co-located structure.

**Key strengths:**
- Declarative-first design with signals and computed derivations
- Clean separation of concerns across 15 focused services
- Strategy pattern properly applied for extensible drag-and-drop behavior
- Strict TypeScript configuration with discriminated unions and type guards
- Comprehensive design token system with light/dark theme support

**Key risks:**
- Zero test coverage across all 20+ components and 15 services
- No ESLint or linting enforcement
- A few services have 5-6 dependencies, indicating tight coupling
- `NodeComponent` acts as a fat container with 11 injected services
- Unsafe `as` casts in data accessor layer bypass the type system

---

## 2. Project Structure

```
src/app/
├── app.component.ts                    # Root shell (minimal)
├── app.config.ts                       # Provider configuration
├── app.routes.ts                       # Lazy-loaded routing
└── org-chart/
    ├── pages/                          # Page-level containers
    │   └── org-chart-page.component.ts
    ├── diagram/                        # Core diagram feature
    │   ├── interfaces.ts               # Domain models (discriminated unions)
    │   ├── guards.ts                   # Type guard functions
    │   ├── data.ts                     # Seed data
    │   ├── data-getters.ts             # Data accessor functions
    │   ├── model-changes.ts            # Change accumulator
    │   ├── model-apply.service.ts      # Change orchestration
    │   ├── node/                       # Node rendering
    │   │   ├── node.component.ts       # Node template (container)
    │   │   └── components/             # Presentational variants
    │   │       ├── full-node/
    │   │       ├── compact-node/
    │   │       ├── vacant-node/
    │   │       ├── node-header/
    │   │       ├── add-button/
    │   │       └── toggle-expand-button/
    │   ├── edge/                       # Edge rendering
    │   ├── layout/                     # ELK.js layout engine
    │   │   ├── layout.service.ts
    │   │   ├── layout-gate.ts          # Concurrency control
    │   │   └── perform-layout.ts       # ELK wrapper (pure)
    │   ├── animation/                  # Frame-based animation
    │   │   ├── layout-animation.service.ts
    │   │   ├── animate.ts              # requestAnimationFrame loop
    │   │   └── viewport-animation.ts   # Viewport panning
    │   ├── expand-collapse/
    │   ├── sort-order/
    │   ├── node-visibility/
    │   │   ├── node-visibility.service.ts
    │   │   ├── node-visibility-config.service.ts
    │   │   ├── viewport-bounds.directive.ts
    │   │   └── viewport-overlay.directive.ts
    │   └── utils/                      # Pure functions
    │       ├── visible-set.ts
    │       └── viewport.ts
    ├── dragging/                       # Drag-and-drop subsystem
    │   ├── drag.service.ts
    │   ├── drop.service.ts
    │   ├── drag-reorder.service.ts
    │   ├── interfaces.ts
    │   ├── proximity.ts
    │   ├── drag-service.utils.ts
    │   ├── zone-detection/             # Strategy pattern
    │   │   ├── zone-detection.interface.ts
    │   │   ├── get-zone-detection-strategy.ts
    │   │   ├── strategies/
    │   │   │   ├── down-zone-detection.ts
    │   │   │   └── right-zone-detection.ts
    │   │   └── index.ts
    │   └── drop-strategy/              # Strategy pattern
    │       ├── drop-strategy.interface.ts
    │       ├── drop-strategy.ts
    │       ├── strategies/
    │       │   ├── child-drop-action.ts
    │       │   └── sibling-drop-action.ts
    │       └── index.ts
    ├── actions/
    │   └── add-node.service.ts
    ├── hierarchy/
    │   └── hierarchy.service.ts
    ├── properties-sidebar/
    │   ├── properties-sidebar.component.ts
    │   ├── properties-sidebar.service.ts
    │   └── components/
    │       ├── sidebar-form/
    │       │   ├── sidebar-form.component.ts
    │       │   ├── sidebar-form.service.ts
    │       │   └── sidebar-form.mappers.ts
    │       ├── form-field/
    │       ├── reports-to-field/
    │       ├── sidebar-header/
    │       └── sidebar-placeholder/
    ├── shared/
    │   ├── combobox/
    │   │   ├── combobox.component.ts
    │   │   └── combobox-option.directive.ts
    │   ├── initials-avatar/
    │   └── autofocus/
    ├── top-navbar/
    │   ├── top-navbar.component.ts
    │   └── theme-toggle/
    ├── toolbar-horizontal/
    └── minimap-panel/
```

### Verdict

**Rating: 9/10**

Feature-based, co-located organization. Each concern lives in its own directory. No bloated `shared/` or `core/` catch-all folders. The structure scales well — adding a new feature means adding a new directory without touching existing code.

**Minor gaps:**
- Barrel files (`index.ts`) only exist in `zone-detection/` and `drop-strategy/` — inconsistent public API control across feature boundaries.
- `data.ts` (seed data) lives alongside domain logic in `diagram/` — could be separated for clarity.

---

## 3. SOLID Principles Compliance

### S — Single Responsibility: 9/10

15 services, each with one reason to change:

| Service | Single Responsibility |
|---|---|
| `LayoutService` | ELK layout computation |
| `LayoutGate` | Concurrency control |
| `LayoutAnimationService` | Animation preparation and execution |
| `ModelApplyService` | Orchestrating change application |
| `ExpandCollapseService` | Subtree visibility toggling |
| `SortOrderService` | Child reordering logic |
| `HierarchyService` | Parent-child relationships |
| `DragService` | Drag state and validation |
| `DropService` | Drop action execution |
| `DragReorderService` | Drag/drop event coordination |
| `AddNodeService` | Node creation workflow |
| `PropertiesSidebarService` | Sidebar state and node editing |
| `SidebarFormService` | Form state management |
| `NodeVisibilityService` | Viewport scrolling |
| `NodeVisibilityConfigService` | Viewport/overlay registration |

**Issues found:**
- `PropertiesSidebarService` mixes sidebar visibility state, node editing, hierarchy updates, and form validation — 3 responsibilities.
- `LayoutService.resolveVisibleSet()` handles visibility resolution, deletion, edge overrides, and sort order merging — could be decomposed.
- `DragReorderService` manages event listeners, state tracking, throttling, and zone detection coordination.

### O — Open/Closed: 9/10

Two exemplary strategy pattern implementations:

- **Drop strategies** — `DropActionStrategy` interface with `childDrop` and `siblingDrop` implementations. New drop behaviors require no changes to existing code.
- **Zone detection** — `ZoneDetectionStrategy` with `downZoneDetection` and `rightZoneDetection`. Adding a new layout direction (e.g., `LEFT`) means adding one file.

Both use a functional approach (closures) rather than class-based strategies — simpler and lighter.

### L — Liskov Substitution: 9/10

- All `DropActionStrategy` implementations are interchangeable via the `Record<DropZone, DropActionStrategy>` mapping.
- All `ZoneDetectionStrategy` implementations follow the same `detect(cursor, nodePosition, nodeSize): DropZone` contract.
- Node variants (`FullNode`, `CompactNode`, `VacantNode`) follow the same input contract.

### I — Interface Segregation: 8/10

- Components declare minimal required `input()` signals — no fat interfaces.
- `InjectionToken` used for narrow callback contracts (`ON_FIELD_CHANGE`).
- `DropDeps` interface provides only what strategies need.

**Gap:** Barrel files don't consistently export public types. Consumers sometimes reach into implementation files directly, bypassing the intended API boundary. For example, `zone-detection/index.ts` exports `DropZone` type but not `ZoneDetectionStrategy` interface, and `drop-strategy/index.ts` doesn't export `DropContext`, `DropResult`, or `DropActionStrategy`.

### D — Dependency Inversion: 9/10

- Services depend on abstractions (`DropActionStrategy`, `ZoneDetectionStrategy`) rather than concrete implementations.
- Angular DI with component-level `providers` scopes service instances to feature boundaries.
- `InjectionToken` decouples the sidebar form's change emission from the sidebar service.

---

## 4. Declarative vs Imperative Patterns

### Declarative Patterns (Primary Approach)

| Pattern | Location | Quality |
|---|---|---|
| `signal()` / `computed()` | All services and components | Core reactivity model, replaces RxJS |
| `form()` + `debounce()` | `SidebarFormService` | Angular 21 FormSignals API |
| `@if` / `@for` control flow | All templates | Modern syntax, no `*ngIf`/`*ngFor` |
| Host bindings | `NodeComponent`, `InitialsAvatarComponent` | Declarative class/style binding |
| Immutable updates | `ModelChanges`, `ExpandCollapseService` | Spread + override, never mutate source |
| Type guards | `guards.ts` | Compile-time narrowing via discriminated unions |

### Imperative Patterns (Justified)

| Pattern | Location | Justification |
|---|---|---|
| `requestAnimationFrame` loop | `animate.ts` | Browser animation API is inherently imperative |
| DOM access in directives | `ViewportBoundsDirective`, `ViewportOverlayDirective` | `getBoundingClientRect()` requires element reference |
| `document.addEventListener` | `ComboboxComponent` | Outside-click detection needs global listener |
| `async/await` chains | `ModelApplyService.applyWithLayout()` | Sequential operations (layout -> animate -> apply) |
| Manual event binding | `DragReorderService` | High-frequency diagram events |

### Imperative Patterns (Questionable)

| Pattern | Location | Alternative |
|---|---|---|
| `_locked` flag alongside `_phase` signal | `LayoutGate` | Could derive locked state from `_phase` via `computed()` |
| Manual throttle function | `DragReorderService` | Could use RxJS `throttleTime` or Angular signal-based debounce |
| Register/unregister lifecycle | `NodeVisibilityConfigService` | Could use `DestroyRef` + factory providers for auto-cleanup |
| `effect()` for form sync | `SidebarFormComponent` | Could use signal-based form sync pattern |
| Custom event listeners + cleanup | `DragReorderService` | Could use declarative event directives |

### Verdict

**Rating: 9/10** — The balance is right. Declarative where Angular's reactive model supports it, imperative only where browser APIs demand it. A few pockets of imperative code could be made more declarative but the impact is minor.

---

## 5. Signals & Reactivity

The project fully commits to **signals as the primary reactivity model**:

- **No RxJS in application code** — the `rxjs` dependency exists for Angular internals and ng-diagram only.
- `signal()` for mutable state, `computed()` for derived state, `effect()` for side effects.
- `asReadonly()` for public signal exposure — encapsulation preserved.
- Angular 21 `form()` + `debounce()` for reactive forms.
- `model()` for two-way binding (`ReportsToFieldComponent`, `ComboboxComponent`).

### Signal Usage Patterns by Category

**Reactive derived state (computed):**
```
NodeComponent: variant, isInDropRange, hiddenSides, highlightedSide, isRoot,
               occupiedData, isHidden, isCollapsed, hasChildren, showAddButtons
LayoutGate: isInitialized, isIdle
LayoutService: isHorizontal
PropertiesSidebarService: selectedOrgChartNodes, selectedNode,
                          reportsToCandidateNodes, selectedNodeParentId, sidebarState
MinimapPanelComponent: canZoomIn, canZoomOut, zoomPercent
```

**Mutable state (signal):**
```
LayoutGate: _phase
LayoutService: _direction
DragReorderService: _highlightedIndicator, _isReorderActive, _nodesInRange, _hiddenSides
PropertiesSidebarService: isExpanded
NodeComponent: isHovered
SidebarFormService: formModel
```

**Side effects (effect):**
```
SidebarFormService: watchForChanges() — watches formModel dirty state
SidebarFormComponent: syncs form data on input changes
```

### Verdict

**Rating: 10/10** — Clean, modern approach. No RxJS operator complexity. Signal-based reactivity is consistent throughout.

---

## 6. Component Architecture

### Overview

| Metric | Count |
|---|---|
| Total components | 22 |
| Standalone | 22/22 (100%) |
| OnPush change detection | 22/22 (100%) |
| Presentational (no service injection) | 13 |
| Container (inject services) | 9 |
| Directives | 5 |

### Container vs Presentational Split

**Containers** (inject services, orchestrate logic):

| Component | Injected Services | Assessment |
|---|---|---|
| `OrgChartPageComponent` | 0 (provides 12) | Clean — scopes providers only |
| `DiagramComponent` | 9 | Heavy — coordinates diagram events |
| `NodeComponent` | 11 | **Too fat** — mixed presentation and business logic |
| `PropertiesSidebarComponent` | 2 | Clean |
| `SidebarFormComponent` | 1 | Clean |
| `MinimapPanelComponent` | 1 | Clean |
| `ThemeToggleComponent` | 1 (`DOCUMENT`) | Acceptable for theme switching |
| `ComboboxComponent` | 2 (`ElementRef`, `DestroyRef`) | Complex but focused |
| `EdgeComponent` | 1 | Minimal — lookup only |

**Presentational** (inputs/outputs only, no service injection):

`FullNodeComponent`, `CompactNodeComponent`, `VacantNodeComponent`, `NodeHeaderComponent`, `AddButtonComponent`, `ToggleExpandButtonComponent`, `InitialsAvatarComponent`, `FormFieldComponent`, `ReportsToFieldComponent`, `SidebarHeaderComponent`, `SidebarPlaceholderComponent`, `TopNavbarComponent`, `ToolbarHorizontalComponent`

All presentational components are clean, focused, and follow Angular best practices.

### Critical Finding: NodeComponent

`NodeComponent` is the most concerning component in the codebase:

- **11 injected services** — more than any other component
- **12 computed signals** derived from multiple services
- **8 host bindings** managing visibility, layout, drag state, and hover
- **Mixed concerns:** serves as diagram template, manages hover state, handles expand/collapse, coordinates add-node, manages drag indicators
- Uses `requestAnimationFrame` and `untracked()` — performance workarounds

This component would benefit from decomposition: extract drag indicator logic, add-button coordination, and expand/collapse handling into sub-components or directives.

### Verdict

**Rating: 8/10** — Excellent presentational components. Container/presenter split is mostly clean. `NodeComponent` is the primary architectural debt.

---

## 7. Service Layer Architecture

### Service Classification

**Orchestration services** (coordinate multiple services):
- `ModelApplyService` — layout -> animate -> apply pipeline (5 deps)
- `AddNodeService` — create node -> expand parent -> reorder -> apply (6 deps)
- `DragReorderService` — drag events -> zone detection -> drop execution (4 deps)
- `PropertiesSidebarService` — selection -> form -> hierarchy updates (6 deps)

**Domain logic services** (single concern, few deps):
- `HierarchyService` — parent-child relationships (2 deps)
- `SortOrderService` — child reordering (1 dep)
- `ExpandCollapseService` — subtree visibility (1 dep)

**Infrastructure services** (low-level operations):
- `LayoutService` — ELK layout computation (1 dep)
- `LayoutGate` — concurrency control (0 deps)
- `LayoutAnimationService` — animation state machine (2 deps)
- `DragService` — drag state and validation (3 deps)
- `DropService` — drop action execution (3 deps + strategies)
- `NodeVisibilityService` — viewport scrolling (3 deps, 1 optional)
- `NodeVisibilityConfigService` — viewport registration (0 deps)

**Form services:**
- `SidebarFormService` — form state via FormSignals API (1 dep via token)

### State Management

No global state manager (NgRx, Akita, etc.). State is decentralized:

1. **ng-diagram Model Service** — all nodes, edges, selection, viewport (external library)
2. **Service-level signals** — local reactive state per service instance
3. **Component inputs** — single-direction data flow from parent

All services are **component-scoped** via `providers` in `OrgChartPageComponent` — each org-chart instance gets isolated service instances.

### Mutation Pattern: ModelChanges Accumulator

```typescript
export class ModelChanges {
  readonly nodeUpdates: NodeUpdate[] = [];
  readonly edgeUpdates: EdgeUpdate[] = [];
  readonly newNodes: DiagramNode<OrgChartNodeData>[] = [];
  readonly newEdges: DiagramEdge<OrgChartEdgeData>[] = [];
  readonly deleteNodeIds: string[] = [];
  readonly deleteEdgeIds: string[] = [];
}
```

Services accumulate changes into a `ModelChanges` instance, then `ModelApplyService.apply()` commits them as a batch. This is a good pattern for transactional updates.

**Issue:** Arrays are mutable and directly exposed. No deduplication or validation of conflicting operations.

### Concurrency Control: LayoutGate

```typescript
@Injectable()
export class LayoutGate {
  private readonly _phase = signal<LayoutPhase>('uninitialized');
  private _locked = false;

  async execute(action: () => Promise<void>): Promise<void> {
    if (this._locked) return;  // Silently dropped
    this._locked = true;
    // ...
  }
}
```

**Issues:**
- `_locked` flag is redundant with `_phase` signal — could be `computed(() => this._phase() === 'layouting')`.
- Requests are silently dropped when locked — no queue or feedback.

### Verdict

**Rating: 8/10** — Well-decomposed domain services. Orchestration services are the main coupling concern. The `ModelChanges` accumulator pattern is clean and pragmatic.

---

## 8. Dependency Graph & Coupling Analysis

### Full Service Dependency Graph

```
                    ┌─────────────────────┐
                    │  NgDiagramModelService │  (external)
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────▼─────┐    ┌────────▼───────┐    ┌───────▼───────┐
    │LayoutService│    │SortOrderService│    │ExpandCollapse │
    └─────┬──────┘    └───────┬────────┘    │   Service     │
          │                   │             └───────┬───────┘
    ┌─────▼──────────┐  ┌────▼──────┐              │
    │LayoutAnimation │  │Hierarchy  │              │
    │   Service      │  │ Service   │              │
    └─────┬──────────┘  └────┬──────┘              │
          │                   │                     │
    ┌─────▼──────────────────▼─────────────────────▼──┐
    │              ModelApplyService                    │
    │  (also depends on LayoutGate, NgDiagramService)  │
    └─────────────────────┬────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌──────▼──────┐
    │AddNode    │  │DropService│  │Properties   │
    │Service    │  │           │  │Sidebar      │
    │(6 deps)   │  └─────┬─────┘  │Service      │
    └───────────┘        │        │(6 deps)     │
                   ┌─────▼──────┐ └─────────────┘
                   │DragReorder │
                   │Service     │
                   └────────────┘
```

### Coupling Hotspots

| Service | Dependency Count | Risk Level |
|---|---|---|
| `AddNodeService` | 6 | High — orchestrates too many concerns |
| `PropertiesSidebarService` | 6 | High — mixed sidebar + editing + hierarchy |
| `ModelApplyService` | 5 | Medium — orchestration is its purpose |
| `DragReorderService` | 4 | Medium — event coordination role |
| `DragService` | 3 | Low |
| `DropService` | 3 + strategies | Low |
| `HierarchyService` | 2 | Low |
| `LayoutAnimationService` | 2 | Low |

### Deepest Dependency Chains

1. `DragReorderService` -> `DropService` -> `ModelApplyService` -> `LayoutAnimationService` -> `LayoutService` (5 levels)
2. `AddNodeService` -> `ModelApplyService` -> `LayoutAnimationService` -> `LayoutService` (4 levels)
3. `PropertiesSidebarService` -> `HierarchyService` -> `SortOrderService` (3 levels)

### Circular Dependency Analysis

**No true circular dependencies found.** All dependency arrows point in one direction. The near-circular patterns are:

- `ModelApplyService` calls `LayoutAnimationService.prepare()`, then `apply()`, then `animationService.run()`, then `apply()` again — complex interleaving but not circular.
- Drop strategies inject the same services that `DropService` depends on — diamond pattern but not circular.

---

## 9. Type System & Type Safety

### Discriminated Unions: Excellent

```typescript
export type OrgChartNodeData = OrgChartOccupiedNodeData | OrgChartVacantNodeData;

interface OrgChartOccupiedNodeData extends OrgChartBaseNodeData {
  type: 'occupied';
  fullName: string;
  color?: string;
}

interface OrgChartVacantNodeData extends OrgChartBaseNodeData {
  type: 'vacant';
}
```

Clear discriminant, proper exhaustive narrowing, shared base interface for common fields.

### Type Guards: Excellent

```typescript
export function isOrgChartNodeData(data: unknown): data is OrgChartNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (data.type === 'occupied' || data.type === 'vacant')
  );
}
```

All guards use proper type predicates (`data is X`), runtime validation, and compose correctly.

### Unsafe Patterns: data-getters.ts

```typescript
type WithData = { data?: Partial<OrgChartNodeData> };
type AnyPart = Node | Edge | WithData;

export function getIsCollapsed(part: AnyPart) {
  return (part as WithData).data?.isCollapsed;  // unsafe cast
}
```

**Problems:**
- `as WithData` bypasses type checking entirely — accepts `Edge` which has a different data shape.
- `Partial<OrgChartNodeData>` is too loose — any property could be missing.
- Existing type guards in `guards.ts` are not leveraged here.

### Unsafe Patterns: sidebar-form.mappers.ts

```typescript
export function formDataToNodeData(
  formData: SidebarFormData,
  existingData: OrgChartNodeData,
): OrgChartNodeData & Record<string, unknown>  // type safety escape hatch
```

The `& Record<string, unknown>` return type defeats TypeScript's property checking — acknowledged with a TODO comment.

### Naming Issue: data-getters.ts

The `getIs*` / `getHas*` prefix pattern is awkward:

| Current | Better |
|---|---|
| `getIsCollapsed(part)` | `isCollapsed(part)` |
| `getIsHidden(part)` | `isHidden(part)` |
| `getHasChildren(node)` | `hasChildren(node)` |
| `getCollapsedChildrenCount(node)` | `collapsedChildrenCount(node)` |

Predicate functions should use `is*` / `has*` prefixes. `get*` conventionally precedes nouns, not predicates.

### Verdict

**Rating: 8/10** — Strong discriminated union design and type guards. The `data-getters.ts` layer undermines the otherwise excellent type safety.

---

## 10. Strategy Pattern Implementations

### Zone Detection Strategy

```
zone-detection.interface.ts     <- Contract
get-zone-detection-strategy.ts  <- Factory
strategies/
  ├── down-zone-detection.ts    <- Vertical layout
  └── right-zone-detection.ts   <- Horizontal layout
index.ts                        <- Barrel export
```

**Quality:** Excellent.
- Stateless strategies (pure objects).
- Factory selects based on `LayoutDirection`.
- Interface contract: `detect(cursor, nodePosition, nodeSize): DropZone`.
- No coupling between strategies.
- Adding a new layout direction means adding one file.

### Drop Strategy

```
drop-strategy.interface.ts      <- Contract
drop-strategy.ts                <- Factory + injection
strategies/
  ├── child-drop-action.ts      <- Drop as child
  └── sibling-drop-action.ts    <- Drop as sibling
index.ts                        <- Barrel export
```

**Quality:** Excellent.
- Dependencies injected via `DropDeps` interface — strategies don't use Angular DI directly.
- Factory returns `Record<DropZone, DropActionStrategy>` — exhaustive mapping from zone to action.
- Each strategy returns `DropResult` with `ModelChanges` and optional `VisibilityHint`.

**Design choice:** Both implementations use functional closures rather than classes. This is simpler and idiomatic for Angular's `inject()` based patterns.

### Barrel Export Gap

Both barrel files export functions but **not types**:

```typescript
// zone-detection/index.ts — missing ZoneDetectionStrategy
export type { DropZone } from './zone-detection.interface';
export { getZoneDetectionStrategy } from './get-zone-detection-strategy';

// drop-strategy/index.ts — missing DropContext, DropResult, DropActionStrategy
export { getDropStrategy, injectDropStrategies } from './drop-strategy';
```

Consumers who need these types must import from implementation files, breaking the encapsulation intent.

### Verdict

**Rating: 9/10** — Properly implemented, extensible, clean functional approach. Minor barrel export gap.

---

## 11. Styling Architecture

### Design Token System

- **`tokens.css`** — 800+ CSS custom properties with `--ngd-*` namespace
- Light/dark theme via `data-theme` attribute on `<html>`
- 7 accent colors, grayscale palette, semantic color tokens
- Typography tokens, spacing tokens, border-radius tokens

### Component Styling

- **22 SCSS files** — one per component
- `:host` selector for scoped styling
- CSS custom properties used throughout — no hardcoded colors
- Micro-interactions via `transition` properties (consistent 150ms ease)

### Theme Implementation

```css
html[data-theme='dark'] { ... }
```

Theme toggling modifies the `data-theme` attribute, and all component styles reference CSS variables that change with the theme.

### Issues

- Several "No Figma token" comments indicate manual deviations from the design system.
- No utility class layer — components reinvent common spacing/flex patterns.
- No documented typography scale or spacing system.
- Component style budgets in `angular.json` (4kB warning / 8kB error) may be tight for components with complex styling.

### Verdict

**Rating: 8/10** — Comprehensive token system with proper theme support. Well-structured SCSS. Minor gaps in documentation and utility reuse.

---

## 12. TypeScript & Build Configuration

### TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "target": "ES2022"
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

**Rating: 9.5/10** — All recommended strict flags enabled. Only `noUncheckedIndexedAccess` is missing, which would catch more property access issues.

### Build Configuration

- **Builder:** `@angular/build:application` (modern Vite-based)
- **Budgets:**
  - Initial bundle: 500kB warning / 1MB error
  - Component styles: 4kB warning / 8kB error
- **Output hashing:** enabled for production
- **Lazy loading:** via `loadComponent` in routes

### Bootstrap Chain

```
main.ts -> bootstrapApplication(App, appConfig)
  -> app.config.ts: provideBrowserGlobalErrorListeners(), provideRouter(routes)
  -> app.routes.ts: lazy-loaded OrgChartPageComponent
```

Minimal, modern, and correct. Global error handling enabled. Standalone component bootstrap.

### Dependencies

| Package | Status |
|---|---|
| Angular 21.2.0 | Patches available (21.2.8) |
| TypeScript 5.9.3 | 6.0.2 available |
| RxJS 7.8.0 | Current |
| Vitest 4.0.18 | 4.1.4 available |

No unnecessary dependencies detected. `@angular/forms` is included but may be needed for the FormSignals API.

---

## 13. Testing & Code Quality Tooling

### Testing Coverage

**0 test files. 0% coverage.**

All 22 components and 15 services are completely untested. Vitest is configured in `tsconfig.spec.json` and `package.json` but no tests have been written.

High-risk untested areas:
- `ExpandCollapseService` — subtree visibility with state consistency requirements
- `DragReorderService` — complex event coordination with async drop handling
- `SortOrderService` — reordering logic with edge cases
- `HierarchyService` — parent-child relationship management
- `LayoutGate` — concurrency control (silently drops requests)

### Linting

**No ESLint configuration.** No `.eslintrc`, `eslint.config.js`, or ESLint packages in `devDependencies`.

### Formatting

Prettier is configured (`.prettierrc`):
- `printWidth: 100`
- `singleQuote: true`
- Angular HTML parser

### Pre-commit Hooks

**None.** No Husky, lint-staged, or similar tooling.

### CI/CD

**None visible.** No `.github/workflows`, no CI configuration.

### Verdict

**Testing: 1/10** — Critical gap. No safety net for refactoring.  
**Linting: 2/10** — Only Prettier for formatting.  
**CI/CD: 1/10** — No automation.

---

## 14. Summary Scorecard

| Category | Rating | Notes |
|---|---|---|
| **Project Structure** | 9/10 | Feature-based, co-located, clean boundaries |
| **Single Responsibility** | 9/10 | Clean service decomposition, some orchestrators are heavy |
| **Open/Closed** | 9/10 | Strategy pattern properly applied |
| **Liskov Substitution** | 9/10 | Interchangeable strategy implementations |
| **Interface Segregation** | 8/10 | Good at component level; barrel files incomplete |
| **Dependency Inversion** | 9/10 | Proper DI, tokens, abstractions |
| **Declarative Approach** | 9/10 | Signals-first, imperative only where justified |
| **Signals & Reactivity** | 10/10 | Modern, consistent, no RxJS complexity |
| **Component Architecture** | 8/10 | Excellent presentational split; NodeComponent is too fat |
| **Service Layer** | 8/10 | Well-decomposed domain; orchestration coupling exists |
| **Type Safety** | 8/10 | Strong unions + guards; data-getters bypass type system |
| **Strategy Patterns** | 9/10 | Correct, extensible, functional approach |
| **Styling** | 8/10 | Comprehensive tokens + theme; minor documentation gaps |
| **TypeScript Config** | 9.5/10 | Maximum strictness |
| **Build & Bootstrap** | 9/10 | Modern Vite, lazy loading, proper bootstrap |
| **Testing** | 1/10 | Zero coverage |
| **Linting & CI** | 2/10 | Prettier only, no ESLint, no CI |

**Architecture Score: 8.7/10** (excluding testing/tooling)  
**Overall Project Maturity: 7.0/10** (testing and tooling gaps reduce confidence)

---

## 15. Prioritized Recommendations

### Critical (blocking production confidence)

**1. Add unit tests**  
Start with the highest-risk services: `ExpandCollapseService`, `SortOrderService`, `HierarchyService`, `LayoutGate`. These contain domain logic with edge cases that are impossible to verify manually at scale. Use Vitest with Angular testing utilities.

**2. Add ESLint**  
Install `@angular-eslint/*` packages. Enforce rules for unused imports, naming conventions, component complexity, and injection best practices. This prevents drift.

**3. Set up CI pipeline**  
GitHub Actions (or equivalent) running lint, test, and build on every PR. Without this, the other recommendations degrade over time.

### High Priority (architectural improvements)

**4. Refactor NodeComponent**  
Extract responsibilities into sub-components or directives:
- Drag indicator logic -> `DragIndicatorDirective`
- Add-button coordination -> dedicated sub-component
- Expand/collapse handling -> dedicated sub-component
Target: NodeComponent should inject 3-4 services maximum.

**5. Fix data-getters type safety**  
Replace `as WithData` casts with proper type guards from `guards.ts`. Rename `getIsCollapsed` -> `isCollapsed`, `getIsHidden` -> `isHidden`, `getHasChildren` -> `hasChildren`.

**6. Split PropertiesSidebarService**  
Separate sidebar state (visibility, toggle) from node editing (data updates, hierarchy changes). This reduces the 6-dependency count and clarifies responsibilities.

**7. Complete barrel file exports**  
Add type exports to `zone-detection/index.ts` and `drop-strategy/index.ts`. Consider adding barrel files to other feature directories.

### Medium Priority (consistency improvements)

**8. Simplify LayoutGate**  
Remove `_locked` boolean flag. Derive locked state from `_phase` signal: `readonly isLocked = computed(() => this._phase() === 'layouting')`. Consider adding a request queue instead of silently dropping operations.

**9. Add pre-commit hooks**  
Install Husky + lint-staged to enforce formatting and linting before commits.

**10. Clean up ModelChanges**  
Add deduplication for delete operations. Consider making arrays readonly and providing only builder methods. Add validation to prevent conflicting operations on the same node.

### Low Priority (polish)

**11. Separate seed data**  
Move `data.ts` content into a dedicated `seed-data/` directory. Separate the raw data definition from model instantiation.

**12. Replace manual event listeners in DragReorderService**  
Use RxJS operators or Angular event abstractions for diagram event handling and throttling.

**13. Create a `provideOrgChart()` factory**  
Replace the 12-item `providers` array in `OrgChartPageComponent` with a single factory function for readability and reusability.

**14. Document the design token system**  
Create a reference for the `--ngd-*` token namespace, explaining naming conventions, theme variables, and how to extend the system.
