import { inject, Injectable } from '@angular/core';
import { NgDiagramModelService, type Node as DiagramNode, type Point } from 'ng-diagram';
import { LayoutService } from '../layout/layout.service';
import { ModelChanges } from '../model-changes';
import { animate } from './animate';
import { getIsCollapsed, getIsHidden } from '../data-getters';

interface NodeAnimation {
  id: string;
  startPosition: Point;
  finalPosition: Point;
}

export interface AnimationResult {
  state: unknown;
  startChanges: ModelChanges;
}

/**
 * Animates layout transitions by interpolating node positions from their
 * current locations to the layout-computed targets.
 *
 * Auto-detects animation type from `changes`:
 * - New nodes (via `newEdges`) start at their parent's edge.
 * - Expanding nodes (`isHidden` transitioning to false) start at the toggled ancestor's edge.
 * - All other repositioned nodes slide from their current position.
 *
 * Edges follow nodes automatically via ng-diagram's auto routing.
 */
@Injectable()
export class LayoutAnimationService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly layoutService = inject(LayoutService);

  /**
   * Reads `changes` and builds the animation start state.
   *
   * @returns Animation state and start changes, or `null` if nothing to animate.
   */
  prepare(changes: ModelChanges): AnimationResult | null {
    const startOverrides = this.computeStartOverrides(changes);

    const nodes = this.collectNodeAnimations(changes, startOverrides);
    if (nodes.length === 0) return null;

    const startChanges = this.buildStartChanges(changes, nodes);

    for (const node of startChanges.newNodes) {
      const override = startOverrides.get(node.id);
      if (override) {
        node.position = { ...override };
      }
    }

    return { state: { nodes }, startChanges };
  }

  run(state: unknown): Promise<void> {
    return this.runAnimation(state as { nodes: NodeAnimation[] });
  }

  /**
   * Derives start position overrides from the changes content:
   * - New nodes → parent edge (found via new edges)
   * - Expanding nodes (isHidden transitioning to false) → toggled ancestor's edge
   */
  private computeStartOverrides(changes: ModelChanges): Map<string, Point> {
    const overrides = new Map<string, Point>();

    for (const edge of changes.newEdges) {
      const parent = this.modelService.getNodeById(edge.source);
      if (parent) {
        overrides.set(edge.target, this.computeParentEdgePosition(parent));
      }
    }

    // Fan-out expand only when not adding new nodes simultaneously —
    // otherwise existing children appear instantly and only the new node animates.
    if (changes.newNodes.length === 0) {
      const toggledEdge = this.findToggledAncestorEdge(changes);

      if (toggledEdge) {
        // All expanding descendants slide out from the toggled ancestor
        for (const update of changes.nodeUpdates) {
          if (getIsHidden(update) !== false) continue;
          const existing = this.modelService.getNodeById(update.id);
          if (!existing || !getIsHidden(existing)) continue;
          overrides.set(update.id, toggledEdge);
        }
      }
    }

    return overrides;
  }

  /** Finds the node transitioning from collapsed to expanded and returns its edge position. */
  private findToggledAncestorEdge(changes: ModelChanges): Point | undefined {
    for (const update of changes.nodeUpdates) {
      if (getIsCollapsed(update) !== false) continue;
      const existing = this.modelService.getNodeById(update.id);
      if (!existing || !getIsCollapsed(existing)) continue;
      return this.computeParentEdgePosition(existing);
    }
    return undefined;
  }

  /**
   * Reads position updates from `changes.nodeUpdates` and builds animation
   * entries.
   */
  private collectNodeAnimations(
    changes: ModelChanges,
    startOverrides: Map<string, Point>,
  ): NodeAnimation[] {
    const nodeAnims: NodeAnimation[] = [];

    for (const update of changes.nodeUpdates) {
      if (!update.position) continue;

      const finalPosition = { ...update.position };
      let startPosition: Point;

      const override = startOverrides.get(update.id);
      if (override) {
        startPosition = { ...override };
      } else {
        const existing = this.modelService.getNodeById(update.id);
        if (!existing) continue;
        startPosition = { ...existing.position };
      }

      if (startPosition.x === finalPosition.x && startPosition.y === finalPosition.y) continue;

      nodeAnims.push({ id: update.id, startPosition, finalPosition });
    }

    return nodeAnims;
  }

  /**
   * Builds a `ModelChanges` representing the start state for the animation.
   * All entries are **copied** so the original `changes` retains the final state.
   */
  private buildStartChanges(changes: ModelChanges, anims: NodeAnimation[]): ModelChanges {
    const start = new ModelChanges();

    for (const anim of anims) {
      start.addNodeUpdates({ id: anim.id, position: { ...anim.startPosition } });
    }

    for (const update of changes.nodeUpdates) {
      if (update.data && !update.position) {
        start.addNodeUpdates({ id: update.id, data: { ...update.data } });
      }
    }

    for (const update of changes.edgeUpdates) {
      start.addEdgeUpdates({ ...update });
    }

    start.addDeleteEdgeIds(...changes.deleteEdgeIds);
    start.addDeleteNodeIds(...changes.deleteNodeIds);
    start.addNewNodes(...changes.newNodes.map((n) => ({ ...n })));
    start.addNewEdges(...changes.newEdges.map((e) => ({ ...e })));

    return start;
  }

  private computeParentEdgePosition(node: DiagramNode): Point {
    const w = node.measuredBounds?.width ?? node.size?.width ?? 0;
    const h = node.measuredBounds?.height ?? node.size?.height ?? 0;
    return this.layoutService.isHorizontal()
      ? { x: node.position.x + w, y: node.position.y }
      : { x: node.position.x, y: node.position.y + h };
  }

  private runAnimation(state: { nodes: NodeAnimation[] }): Promise<void> {
    return animate((eased) => {
      const updates: { id: string; position: Point }[] = [];

      for (const anim of state.nodes) {
        updates.push({
          id: anim.id,
          position: {
            x: anim.startPosition.x + (anim.finalPosition.x - anim.startPosition.x) * eased,
            y: anim.startPosition.y + (anim.finalPosition.y - anim.startPosition.y) * eased,
          },
        });
      }

      this.modelService.updateNodes(updates);
    });
  }
}
