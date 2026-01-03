import type { AnimationFactory } from "./carousel";

export type AnimationFactoryWithReverse = AnimationFactory & {
  reverse?: AnimationFactory;
};

const registry = new Map<string, AnimationFactoryWithReverse>();

export function registerAnimation(name: string, factory: AnimationFactoryWithReverse): void {
  registry.set(name, factory);
}

export function registerAnimations(map: Record<string, AnimationFactoryWithReverse>): void {
  Object.entries(map).forEach(([name, factory]) => {
    registerAnimation(name, factory);
  });
}

export function getAnimation(name: string): AnimationFactoryWithReverse | undefined {
  return registry.get(name);
}

export function listAnimations(): string[] {
  return Array.from(registry.keys());
}
