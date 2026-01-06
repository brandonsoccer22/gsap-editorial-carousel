import type { gsap as GsapInstance } from "gsap";
import type { CarouselOptions } from "./carousel";
import { getAnimation, listAnimations } from "./registry";

type GsapTimeline = ReturnType<typeof GsapInstance["timeline"]>;

type AnimItem = {
  el: Element;
  animName: string;
  seq: number;
  exitSeq: number;
  dur: number;
  delay: number;
  ease?: string;
  exitDur: number;
  exitDelay: number;
  exitEase?: string;
  at?: string;
  exitAt?: string;
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

function collectExternalControls(slide: Element, options: CarouselOptions): Element[] {
  const root = slide.closest(options.selectors.root);
  if (!root) return [];

  const rootId = root.getAttribute("id");
  const selector = `${options.selectors.prev}, ${options.selectors.next}`;
  let candidates: Element[] = [];

  if (rootId) {
    const scopedSelector = `${selector}[data-for="${rootId}"]`;
    candidates = Array.from(document.querySelectorAll(scopedSelector));
    if (!candidates.length) {
      candidates = Array.from(root.querySelectorAll(selector));
    }
  } else {
    candidates = Array.from(root.querySelectorAll(selector));
  }

  return candidates.filter((el) => !el.closest(options.selectors.slide));
}

function collectAnimItems(slide: Element, options: CarouselOptions): AnimItem[] {
  const elements = Array.from(slide.querySelectorAll("[class]"));
  const externalControls = collectExternalControls(slide, options);
  const items: AnimItem[] = [];

  elements.concat(externalControls).forEach((el) => {
    const animName = findAnimationName(el);
    if (!animName) return;
    const seq = Math.max(1, Math.floor(getDataNumber(el, "data-seq", 1)));
    const exitSeq = Math.max(1, Math.floor(getDataNumber(el, "data-exit-seq", seq)));
    const dur = getDataNumber(el, "data-dur", options.defaults.dur);
    const delay = getDataNumber(el, "data-delay", 0);
    const ease = getDataString(el, "data-ease") ?? options.defaults.ease;
    const exitDur = getDataNumber(el, "data-exit-dur", dur);
    const exitDelay = getDataNumber(el, "data-exit-delay", delay);
    const exitEase = getDataString(el, "data-exit-ease") ?? ease;
    const at = getDataString(el, "data-at");
    const exitAt = getDataString(el, "data-exit-at");

    items.push({ el, animName, seq, exitSeq, dur, delay, ease, exitDur, exitDelay, exitEase, at, exitAt });
  });

  return items;
}

function groupBySequence(
  items: AnimItem[],
  getSequence: (item: AnimItem) => number
): Map<number, AnimItem[]> {
  const map = new Map<number, AnimItem[]>();
  items.forEach((item) => {
    const sequence = getSequence(item);
    const bucket = map.get(sequence) ?? [];
    bucket.push(item);
    map.set(sequence, bucket);
  });
  return map;
}

export function buildSlideEnterTimeline(
  slide: Element,
  direction: 1 | -1,
  options: CarouselOptions,
  gsapInstance: typeof GsapInstance
): GsapTimeline {
  const tl = gsapInstance.timeline();
  const items = collectAnimItems(slide, options);
  if (!items.length) return tl;

  const grouped = groupBySequence(items, (item) => item.seq);
  const order = Array.from(grouped.keys()).sort((a, b) => a - b);

  let cursor = 0;
  order.forEach((seq) => {
    const group = grouped.get(seq);
    if (!group) return;
    let groupMax = 0;

    group.forEach((item) => {
      const factory = getAnimation(item.animName);
      if (!factory) return;
      const offset = parsePositionOffset(item.exitAt ?? item.at) ?? 0;
      const position = cursor + offset;

      factory({
        el: item.el,
        tl,
        gsap: gsapInstance,
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
  options: CarouselOptions,
  gsapInstance: typeof GsapInstance
): GsapTimeline {
  const tl = gsapInstance.timeline();
  const items = collectAnimItems(slide, options);
  if (!items.length) return tl;

  const grouped = groupBySequence(items, (item) => item.exitSeq);
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

      let usedDuration = item.exitDur;

      if (exitName && factory) {
        factory({
          el: item.el,
          tl,
          gsap: gsapInstance,
          opts: {
            dur: item.exitDur,
            delay: item.exitDelay,
            ease: item.exitEase,
            direction,
            at: position
          }
        });
      } else if (!exitName && reverseFactory) {
        reverseFactory({
          el: item.el,
          tl,
          gsap: gsapInstance,
          opts: {
            dur: item.exitDur,
            delay: item.exitDelay,
            ease: item.exitEase,
            direction,
            at: position
          }
        });
      } else {
        tl.to(
          item.el,
          {
            autoAlpha: 0,
            duration: usedDuration,
            delay: item.exitDelay,
            ease: item.exitEase
          },
          position
        );
      }

      groupMax = Math.max(groupMax, offset + item.exitDelay + usedDuration);
    });

    cursor += Math.max(groupMax, 0);
  });

  return tl;
}

export function getRegisteredAnimationNames(): string[] {
  return listAnimations();
}
