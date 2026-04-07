# Layout Animation Architecture

## Overview

Layout animations interpolate node positions between frames using `requestAnimationFrame`, making layout transitions smooth rather than instant. Edges follow nodes automatically via ng-diagram's auto routing.

## Pipeline

```
gate → computeLayout → prepare → apply(startChanges) → animate → apply(changes) → done
```

1. **computeLayout** — ELK computes final positions, appended to `changes.nodeUpdates`
2. **prepare** — reads final positions from `changes` (without mutating them), captures current model positions as start values, builds a separate `startChanges`
3. **apply(startChanges)** — transaction commits start positions + structural/data changes
4. **animate** — `requestAnimationFrame` loop interpolates start → final over 300ms
5. **apply(changes)** — transaction commits the authoritative final state

`prepare` never mutates the original `changes` — the final apply always has correct final positions.

## ApplyAnimation interface

```typescript
interface ApplyAnimationResult {
  state: unknown;            // opaque state for run()
  startChanges: ModelChanges; // applied before animation
}

interface ApplyAnimation {
  prepare(changes: ModelChanges): ApplyAnimationResult | null;
  run(state: unknown): Promise<void>;
}
```

- `prepare` returns `null` to skip animation (changes applied once, directly).
- `startChanges` is a **copy** of `changes` with positions overridden to start values. Structural ops (newNodes, newEdges, deleteEdgeIds) are cloned so modifications don't leak between the two applies.

## `buildStartChanges` — what goes in

| From `changes` | In `startChanges` | Notes |
|---|---|---|
| Position updates | Copied with **start** values | From animation entries, not from changes |
| Data-only node updates | Cloned | isHidden, isCollapsed, hasChildren, etc. |
| Edge updates | Cloned | Source changes, data changes |
| newNodes | Shallow-cloned | Add-node overrides position to parent edge |
| newEdges | Shallow-cloned | |
| deleteEdgeIds | Copied | |
| deleteNodeIds | Copied | |

The final `apply(changes)` has the **original** values (final positions, same structural ops). Structural ops are guarded in `applyChanges` — skips adds for existing elements and deletes for already-removed elements.

## Transaction pattern (critical)

ng-diagram's `transaction(callback, { waitForMeasurements: true })` commits the callback synchronously but the returned Promise waits for `ResizeObserver` events. If no DOM elements resize, the Promise hangs for ~2000ms.

**Working pattern in `apply()`:**

```typescript
this.diagramService.transaction(callback, { waitForMeasurements: true });
await new Promise(resolve => requestAnimationFrame(() => resolve()));
```

Fire the transaction (commits synchronously), then wait one frame for Angular to render. Don't await the measurement Promise.

**What doesn't work:**
- `waitForMeasurements: false` or `{}` — race condition
- Sync transaction (void overload, no options) — doesn't properly commit changes
- Awaiting `waitForMeasurements: true` — hangs when no elements resize
- Model updates outside transactions — don't reliably propagate to Angular components

## Animation types

### `createLayoutAnimation()`

Slides all repositioned nodes from current to final positions.

Used for: collapse, remove edges, hierarchy changes.

**prepare**: `collectNodeAnimations` reads positions from `changes.nodeUpdates`. For each: `startPosition` = current model position, `finalPosition` = layout value. Skips if equal.

### `createAddNodeAnimation(config)`

New node slides from the parent's edge to its layout position.

**prepare**: same as layout, but adds a `startOverride` for the new node → parent edge position. Also overrides `newNode.position` in `startChanges.newNodes` so the transaction creates it at the parent edge.

### `createExpandCollapseAnimation(config)`

- **Expand**: `startOverrides` map all subtree IDs to the parent edge. Nodes fan out from parent to layout positions.
- **Collapse**: delegates to `createLayoutAnimation()`. Subtree nodes disappear instantly (isHidden: true applied in the start transaction), remaining nodes slide.

## `collectNodeAnimations`

```typescript
collectNodeAnimations(changes, startOverrides?)
```

- Iterates `changes.nodeUpdates` entries with `position`
- `startPosition`: from `startOverrides` map if present, otherwise from `modelService.getNodeById`
- `finalPosition`: from the update's position value
- Skips if `start === final` (no movement)
- Does **not** mutate `changes`

## Error safety

The rAF frame callback is wrapped in try/catch that always resolves the Promise, preventing animation errors from permanently locking the gate.

## Caller integration

| Caller | Animation |
|--------|-----------|
| `AddNodeService.addNode()` | `createAddNodeAnimation()` |
| `NodeComponent.onToggle()` | `createExpandCollapseAnimation()` |
| `DiagramComponent.onSelectionRemoved()` | `createLayoutAnimation()` |
| `HierarchyService.updateNodeParent()` | `createLayoutAnimation()` |
| `DiagramComponent.onDiagramInit()` | none |
| `DiagramComponent.changeDirection()` | none |

## Future: undo manager integration

The current double-apply pattern (`apply(startChanges)` → animate → `apply(changes)`) commits two transactions. An undo manager would need to:

1. **Silence the first apply** — don't record `startChanges` in undo history
2. **Record only the final apply** — `changes` has the authoritative state
3. On **undo**: reverts the final apply. The start apply's structural ops (node creation, edge deletion) remain — the undo manager would need to handle this, either via:
   - Transaction grouping (both applies = one undo entry)
   - A cleanup step between animate and final apply that reverts the start apply's structural ops, so the final apply re-commits them as a single recorded entry
   - ng-diagram's built-in undo API (if it supports silent/grouped transactions)

The cleanup approach was explored but ng-diagram doesn't reliably support delete+add of the same element ID across transactions. The solution will depend on the specific undo manager API available.
