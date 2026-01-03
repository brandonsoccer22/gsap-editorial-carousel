import { gsap } from "gsap";
import type { CarouselOptions } from "./carousel";
import { getAnimation, listAnimations } from "./registry";

const defaultExitDuration = 0.25;

type AnimItem = {
  el: Element;
  animName: string;
  seq: number;
  dur: number;
  delay: number;
  ease?: string;
  at?: string;
};

function getDataNumber(el: Element, name: string, fallback: number): number {
  const value = el.getAttribute(name);
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDataString(el: Element, name: string): string | undefined {
  const value = el.getAttribute(name);
  return value && value.trim() ? value.trim() : undefined;
}

function parsePositionOffset(value?: string): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
  const relativeMatch = trimmed.match(/^([+-])=([+-]?(?:\d+\.?\d*|\.\d+))$/);

  if (relativeMatch) {
    const amount = Number.parseFloat(relativeMatch[2]);
    if (!Number.isFinite(amount)) return null;
    return relativeMatch[1] === "+" ? amount : -amount;
  }

  if (numberPattern.test(trimmed)) {
    const amount = Number.parseFloat(trimmed);
    return Number.isFinite(amount) ? amount : null;
  }

  return null;
}

function findAnimationName(el: Element): string | null {
  const classList = Array.from(el.classList);
  for (const className of classList) {
    if (getAnimation(className)) return className;
  }
  return null;
}

function collectAnimItems(slide: Element, options: CarouselOptions): AnimItem[] {
  const elements = Array.from(slide.querySelectorAll("[class]"));
  const items: AnimItem[] = [];

  elements.forEach((el) => {
    const animName = findAnimationName(el);
    if (!animName) return;
    const seq = Math.max(1, Math.floor(getDataNumber(el, "data-seq", 1)));
    const dur = getDataNumber(el, "data-dur", options.defaults.dur);
    const delay = getDataNumber(el, "data-delay", 0);
    const ease = getDataString(el, "data-ease") ?? options.defaults.ease;
    const at = getDataString(el, "data-at");

    items.push({ el, animName, seq, dur, delay, ease, at });
  });

  return items;
}

function groupBySequence(items: AnimItem[]): Map<number, AnimItem[]> {
  const map = new Map<number, AnimItem[]>();
  items.forEach((item) => {
    const bucket = map.get(item.seq) ?? [];
    bucket.push(item);
    map.set(item.seq, bucket);
  });
  return map;
}

export function buildSlideEnterTimeline(
  slide: Element,
  direction: 1 | -1,
  options: CarouselOptions
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const items = collectAnimItems(slide, options);
  if (!items.length) return tl;

  const grouped = groupBySequence(items);
  const order = Array.from(grouped.keys()).sort((a, b) => a - b);

  let cursor = 0;
  order.forEach((seq) => {
    const group = grouped.get(seq);
    if (!group) return;
    let groupMax = 0;

    group.forEach((item) => {
      const factory = getAnimation(item.animName);
      if (!factory) return;
      const offset = parsePositionOffset(item.at) ?? 0;
      const position = cursor + offset;

      factory({
        el: item.el,
        tl,
        gsap,
        opts: {
          dur: item.dur,
          delay: item.delay,
          ease: item.ease,
          direction,
          at: position
        }
      });
      groupMax = Math.max(groupMax, offset + item.delay + item.dur);
    });

    cursor += Math.max(groupMax, 0);
  });

  return tl;
}

export function buildSlideExitTimeline(
  slide: Element,
  direction: 1 | -1,
  options: CarouselOptions
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const items = collectAnimItems(slide, options);
  if (!items.length) return tl;

  const grouped = groupBySequence(items);
  const order = Array.from(grouped.keys()).sort((a, b) => a - b);

  let cursor = 0;
  order.forEach((seq) => {
    const group = grouped.get(seq);
    if (!group) return;
    let groupMax = 0;

    group.forEach((item) => {
      const exitName = getDataString(item.el, "data-exit");
      const factory = exitName ? getAnimation(exitName) : getAnimation(item.animName);
      const reverseFactory = factory && "reverse" in factory ? factory.reverse : undefined;
      const offset = parsePositionOffset(item.at) ?? 0;
      const position = cursor + offset;

      let usedDuration = item.dur;

      if (exitName && factory) {
        factory({
          el: item.el,
          tl,
          gsap,
          opts: {
            dur: item.dur,
            delay: item.delay,
            ease: item.ease,
            direction,
            at: position
          }
        });
      } else if (!exitName && reverseFactory) {
        reverseFactory({
          el: item.el,
          tl,
          gsap,
          opts: {
            dur: item.dur,
            delay: item.delay,
            ease: item.ease,
            direction,
            at: position
          }
        });
      } else {
        usedDuration = Math.min(item.dur, defaultExitDuration);
        tl.to(
          item.el,
          {
            autoAlpha: 0,
            duration: usedDuration,
            delay: item.delay,
            ease: item.ease
          },
          position
        );
      }

      groupMax = Math.max(groupMax, offset + item.delay + usedDuration);
    });

    cursor += Math.max(groupMax, 0);
  });

  return tl;
}

export function getRegisteredAnimationNames(): string[] {
  return listAnimations();
}
