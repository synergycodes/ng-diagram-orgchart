export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
export type ArrowKey = (typeof ARROW_KEYS)[number];

export function isArrowKey(key: string): key is ArrowKey {
  return (ARROW_KEYS as readonly string[]).includes(key);
}

/** Which way an arrow steps through a list: back for up and left, forward for down and right. */
export function arrowStep(key: ArrowKey): 1 | -1 {
  return key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
}

export type NavDirection = 'parent' | 'firstChild' | 'prevSibling' | 'nextSibling';

export interface ArrowDirectionStrategy {
  toDirection(key: ArrowKey): NavDirection | null;
}

const HORIZONTAL_MAP: Record<ArrowKey, NavDirection> = {
  ArrowLeft: 'parent',
  ArrowRight: 'firstChild',
  ArrowUp: 'prevSibling',
  ArrowDown: 'nextSibling',
};

const VERTICAL_MAP: Record<ArrowKey, NavDirection> = {
  ArrowUp: 'parent',
  ArrowDown: 'firstChild',
  ArrowLeft: 'prevSibling',
  ArrowRight: 'nextSibling',
};

export const horizontalArrowStrategy: ArrowDirectionStrategy = {
  toDirection: (key) => HORIZONTAL_MAP[key] ?? null,
};

export const verticalArrowStrategy: ArrowDirectionStrategy = {
  toDirection: (key) => VERTICAL_MAP[key] ?? null,
};

export function getArrowStrategy(isHorizontal: boolean): ArrowDirectionStrategy {
  return isHorizontal ? horizontalArrowStrategy : verticalArrowStrategy;
}
