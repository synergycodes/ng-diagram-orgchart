import { computed, inject, Injectable } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { LayoutService } from '../../layout/layout.service';
import { getIsHidden } from '../../model/data-getters';
import { HierarchyService } from '../../model/hierarchy.service';
import { SortOrderService } from '../../model/sort-order.service';
import { getArrowStrategy, type ArrowKey } from './arrow-keys';

type AcceptNode = (nodeId: string) => boolean;

/**
 * Owns what "next node" means: the depth-first tab order, and the target an arrow key points at
 * for the current layout orientation. Skips nodes hidden by a collapsed ancestor.
 */
@Injectable()
export class NavigationOrderService {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly hierarchyService = inject(HierarchyService);
  private readonly sortOrderService = inject(SortOrderService);
  private readonly layoutService = inject(LayoutService);

  /**
   * Visible nodes depth-first: every node immediately followed by its subtree.
   *
   * The library lookups this walks are plain maps rather than signals, so the model signals are
   * read here to state what the order depends on. Every keystroke that leaves the chart alone
   * then reuses the walk instead of repeating it.
   */
  readonly visibleTreeOrder = computed<readonly string[]>(() => {
    this.modelService.nodes();
    this.modelService.edges();
    return this.walkVisibleTree();
  });

  private readonly orderIndex = computed<ReadonlyMap<string, number>>(() => {
    const index = new Map<string, number>();
    this.visibleTreeOrder().forEach((nodeId, position) => index.set(nodeId, position));
    return index;
  });

  /** Whether the node is currently a tab stop. */
  isInTabOrder(nodeId: string): boolean {
    return this.orderIndex().has(nodeId);
  }

  getAdjacentNodeId(currentId: string, step: 1 | -1): string | null {
    const position = this.orderIndex().get(currentId);
    if (position === undefined) return null;
    return this.visibleTreeOrder()[position + step] ?? null;
  }

  getNextNodeId(
    currentId: string,
    arrowKey: ArrowKey,
    accept: AcceptNode = () => true,
  ): string | null {
    const direction = getArrowStrategy(this.layoutService.isHorizontal()).toDirection(arrowKey);
    if (!direction) return null;
    switch (direction) {
      case 'parent':
        return this.findVisibleParent(currentId, accept);
      case 'firstChild':
        return this.findFirstVisibleChild(currentId, accept);
      case 'prevSibling':
        return this.findSibling(currentId, -1, accept);
      case 'nextSibling':
        return this.findSibling(currentId, 1, accept);
    }
  }

  private walkVisibleTree(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const stack = [...this.orderedRootIds()].reverse();

    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const node = this.modelService.getNodeById(id);
      if (!node || getIsHidden(node)) continue;
      order.push(id);

      const children = this.sortOrderService.getSortedChildren(id);
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i].id);
    }

    return order;
  }

  private findVisibleParent(currentId: string, accept: AcceptNode): string | null {
    const parentId = this.hierarchyService.getParentId(currentId);
    if (!parentId) return null;
    const parent = this.modelService.getNodeById(parentId);
    if (!parent || getIsHidden(parent)) return null;
    return accept(parentId) ? parentId : null;
  }

  private findFirstVisibleChild(currentId: string, accept: AcceptNode): string | null {
    const children = this.sortOrderService.getSortedChildren(currentId);
    for (const child of children) {
      const node = this.modelService.getNodeById(child.id);
      if (node && !getIsHidden(node) && accept(child.id)) return child.id;
    }
    return null;
  }

  private findSibling(currentId: string, step: number, accept: AcceptNode): string | null {
    const parentId = this.hierarchyService.getParentId(currentId);

    const siblingIds = parentId
      ? this.sortOrderService.getSortedChildren(parentId).map((c) => c.id)
      : this.orderedRootIds();

    const visible = siblingIds.filter((id) => {
      const node = this.modelService.getNodeById(id);
      return node && !getIsHidden(node);
    });

    const idx = visible.indexOf(currentId);
    if (idx < 0) return null;

    for (let target = idx + step; target >= 0 && target < visible.length; target += step) {
      if (accept(visible[target])) return visible[target];
    }
    return null;
  }

  private orderedRootIds(): string[] {
    const axis = this.layoutService.isHorizontal() ? 'y' : 'x';
    return this.hierarchyService
      .getRootIds()
      .map((id) => ({ id, pos: this.modelService.getNodeById(id)?.position[axis] ?? 0 }))
      .sort((a, b) => a.pos - b.pos || a.id.localeCompare(b.id))
      .map((r) => r.id);
  }
}
