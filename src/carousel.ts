import { gsap } from "gsap";
import { setDotsState, setSlidesState } from "./a11y";
import {
  ensureRootFocusable,
  isFocusableWithin,
  qsa,
  qs,
  resolveRoot,
  setAriaDisabled,
  setDisabled,
  toggleClass
} from "./dom";
import { ensureDefaultAnimationsRegistered, defaultClassNames, defaultOptions, defaultSelectors } from "./defaults";
import { buildSlideEnterTimeline, buildSlideExitTimeline } from "./timeline";
import { prefersReducedMotion } from "./reducedMotion";

export type AnimationFactoryContext = {
  el: Element;
  tl: gsap.core.Timeline;
  gsap: typeof gsap;
  opts: {
    dur: number;
    delay: number;
    ease?: string;
    direction: 1 | -1;
    at: number;
  };
};

export type AnimationFactory = (ctx: AnimationFactoryContext) => void;

export type CarouselOptions = {
  loop: boolean;
  initialIndex: number;
  gsap?: typeof gsap;
  selectors: {
    root: string;
    slide: string;
    prev: string;
    next: string;
    dots: string;
    dotTemplate: string;
  };
  classNames: {
    activeSlide: string;
    animatingRoot: string;
    disabledControl: string;
    dot: string;
    activeDot: string;
  };
  defaults: {
    dur: number;
    ease: string;
  };
  onInit?: (instance: CarouselInstance) => void;
  onBeforeChange?: (payload: { from: number; to: number; direction: 1 | -1 }) => void;
  onAfterChange?: (payload: { from: number; to: number; direction: 1 | -1 }) => void;
};

export type CarouselInstance = {
  goTo: (index: number, opts?: { immediate?: boolean }) => void;
  next: (opts?: { immediate?: boolean }) => void;
  prev: (opts?: { immediate?: boolean }) => void;
  destroy: () => void;
  getIndex: () => number;
  getCount: () => number;
  isAnimating: () => boolean;
};

type ResolvedControls = {
  prev: Element | null;
  next: Element | null;
  dotsContainer: HTMLElement | null;
  dotTemplate: HTMLElement | null;
  dots: Element[];
};

type TransitionState = {
  activeTimeline: gsap.core.Timeline | null;
};

const generatedDotSelector = "[data-carousel-dot=\"true\"]";

export function createCarousel(
  rootInput: string | Element,
  options: Partial<CarouselOptions> = {}
): CarouselInstance {
  ensureDefaultAnimationsRegistered();

  const root = resolveRoot(rootInput);
  const gsapInstance = options.gsap ?? gsap;
  ensureRootFocusable(root);
  const ctx = gsapInstance.context(() => {}, root);

  const resolved: CarouselOptions = {
    loop: options.loop ?? defaultOptions.loop,
    initialIndex: options.initialIndex ?? defaultOptions.initialIndex,
    selectors: { ...defaultSelectors, ...options.selectors },
    classNames: { ...defaultClassNames, ...options.classNames },
    defaults: { ...defaultOptions.defaults, ...options.defaults },
    onInit: options.onInit,
    onBeforeChange: options.onBeforeChange,
    onAfterChange: options.onAfterChange
  };

  const slides = qsa(root, resolved.selectors.slide);
  if (!slides.length) {
    throw new Error("Carousel requires at least one slide element.");
  }

  const controls = resolveControls(root, resolved, slides.length);
  const reducedMotion = prefersReducedMotion();
  const state: TransitionState = { activeTimeline: null };

  let currentIndex = normalizeIndex(resolved.initialIndex, slides.length, resolved.loop);
  let animating = false;

  setSlidesState(slides, currentIndex, resolved.classNames.activeSlide);
  setDotsState(controls.dots, currentIndex, resolved.classNames.activeDot);

  const onPrevClick = (event: Event) => {
    event.preventDefault();
    prev();
  };

  const onNextClick = (event: Event) => {
    event.preventDefault();
    next();
  };

  const onDotsClick = (event: Event) => {
    const target = (event.target as Element | null)?.closest(generatedDotSelector);
    if (!target) return;
    event.preventDefault();
    const indexAttr = target.getAttribute("data-carousel-dot-index");
    if (!indexAttr) return;
    const index = Number.parseInt(indexAttr, 10);
    if (!Number.isFinite(index)) return;
    goTo(index);
  };

  // const onKeydown = (event: KeyboardEvent) => {
  //   if (animating) return;
  //   if (!isFocusableWithin(root, document.activeElement)) return;
  //   if (event.key === "ArrowLeft") {
  //     event.preventDefault();
  //     prev();
  //   } else if (event.key === "ArrowRight") {
  //     event.preventDefault();
  //     next();
  //   }
  // };

  controls.prev?.addEventListener("click", onPrevClick);
  controls.next?.addEventListener("click", onNextClick);
  controls.dotsContainer?.addEventListener("click", onDotsClick);
  //if enabled in the future, also enable root.removeEventListener("keydown", onKeydown); below
  //root.addEventListener("keydown", onKeydown);

  const instance: CarouselInstance = {
    goTo,
    next,
    prev,
    destroy,
    getIndex: () => currentIndex,
    getCount: () => slides.length,
    isAnimating: () => animating
  };

  resolved.onInit?.(instance);

  function disableControls(disabled: boolean): void {
    toggleClass(root, resolved.classNames.animatingRoot, disabled);
    setDisabled(controls.prev, disabled, resolved.classNames.disabledControl);
    setDisabled(controls.next, disabled, resolved.classNames.disabledControl);
    if (controls.dotsContainer) {
      setAriaDisabled(controls.dotsContainer, disabled);
    }
    controls.dots.forEach((dot) => {
      setAriaDisabled(dot, disabled);
      toggleClass(dot, resolved.classNames.disabledControl, disabled);
    });
  }

  function applyActiveState(nextIndex: number): void {
    currentIndex = nextIndex;
    setSlidesState(slides, currentIndex, resolved.classNames.activeSlide);
    setDotsState(controls.dots, currentIndex, resolved.classNames.activeDot);
  }

  function finalizeTransition(from: number, to: number, direction: 1 | -1): void {
    animating = false;
    disableControls(false);
    state.activeTimeline = null;
    resolved.onAfterChange?.({ from, to, direction });
  }

  function transitionTo(nextIndex: number, immediate?: boolean): void {
    if (animating) return;
    if (nextIndex === currentIndex) return;

    const from = currentIndex;
    const to = nextIndex;
    const direction = getDirection(from, to, slides.length, resolved.loop);

    animating = true;
    disableControls(true);
    resolved.onBeforeChange?.({ from, to, direction });

    if (immediate || reducedMotion) {
      applyActiveState(to);
      finalizeTransition(from, to, direction);
      return;
    }

    const exitTl = ctx.add(() => buildSlideExitTimeline(slides[from], direction, resolved, gsapInstance)) as gsap.core.Timeline;
    const enterTl = ctx.add(() => buildSlideEnterTimeline(slides[to], direction, resolved, gsapInstance)) as gsap.core.Timeline;

    const master = ctx.add(
      () =>
        gsapInstance.timeline({
          onComplete: () => {
            finalizeTransition(from, to, direction);
          }
        })
    ) as gsap.core.Timeline;

    state.activeTimeline = master;
    master.add(exitTl, 0);
    master.add(() => applyActiveState(to), exitTl.duration());
    master.add(enterTl, exitTl.duration());
  }

  function goTo(index: number, opts?: { immediate?: boolean }): void {
    if (animating) return;
    const nextIndex = normalizeIndex(index, slides.length, resolved.loop);
    if (nextIndex === currentIndex) return;
    transitionTo(nextIndex, opts?.immediate);
  }

  function next(opts?: { immediate?: boolean }): void {
    if (animating) return;
    const nextIndex = resolveNextIndex(currentIndex, slides.length, resolved.loop);
    if (nextIndex === currentIndex) return;
    transitionTo(nextIndex, opts?.immediate);
  }

  function prev(opts?: { immediate?: boolean }): void {
    if (animating) return;
    const nextIndex = resolvePrevIndex(currentIndex, slides.length, resolved.loop);
    if (nextIndex === currentIndex) return;
    transitionTo(nextIndex, opts?.immediate);
  }

  function destroy(): void {
    controls.prev?.removeEventListener("click", onPrevClick);
    controls.next?.removeEventListener("click", onNextClick);
    controls.dotsContainer?.removeEventListener("click", onDotsClick);
    //root.removeEventListener("keydown", onKeydown);

    state.activeTimeline?.kill();
    animating = false;
    ctx.revert();

    if (controls.dotsContainer) {
      controls.dotsContainer.querySelectorAll(generatedDotSelector).forEach((dot) => {
        dot.remove();
      });
    }
    if (controls.dotTemplate) {
      controls.dotTemplate.hidden = false;
    }
  }

  return instance;
}

function resolveControls(root: Element, options: CarouselOptions, slideCount: number): ResolvedControls {
  const rootId = root.getAttribute("id");
  const queryWithFallback = <T extends Element>(selector: string): T | null => {
    if (rootId) {
      const scoped = document.querySelector<T>(`${selector}[data-for="${rootId}"]`);
      if (scoped) return scoped;
    }
    return qs<T>(root, selector);
  };

  const prev = queryWithFallback<Element>(options.selectors.prev);
  const next = queryWithFallback<Element>(options.selectors.next);
  const dotsContainer = queryWithFallback<HTMLElement>(options.selectors.dots);
  const dotTemplate = dotsContainer ? qs<HTMLElement>(dotsContainer, options.selectors.dotTemplate) : null;

  const dots = dotsContainer
    ? setupDots(dotsContainer, dotTemplate, options, slideCount)
    : [];

  return { prev, next, dotsContainer, dotTemplate, dots };
}

function setupDots(
  container: HTMLElement,
  template: HTMLElement | null,
  options: CarouselOptions,
  slideCount: number
): Element[] {
  const dots = qsa(container, generatedDotSelector);
  dots.forEach((dot) => dot.remove());

  if (!template) return [];

  const clones: Element[] = [];

  for (let i = 0; i < slideCount; i += 1) {
    const clone = template.cloneNode(true) as Element;
    clone.removeAttribute("id");
    clone.setAttribute("data-carousel-dot", "true");
    clone.setAttribute("data-carousel-dot-index", String(i));
    clone.setAttribute("aria-label", `Go to slide ${i + 1}`);
    clone.classList.add(options.classNames.dot);
    if (clone instanceof HTMLButtonElement && !clone.getAttribute("type")) {
      clone.setAttribute("type", "button");
    }
    container.appendChild(clone);
    clones.push(clone);
  }

  template.hidden = true;

  return clones;
}

function normalizeIndex(index: number, count: number, loop: boolean): number {
  if (count <= 0) return 0;
  if (loop) {
    const wrapped = ((index % count) + count) % count;
    return wrapped;
  }
  if (index < 0) return 0;
  if (index >= count) return count - 1;
  return index;
}

function resolveNextIndex(current: number, count: number, loop: boolean): number {
  if (count <= 0) return current;
  if (current + 1 < count) return current + 1;
  return loop ? 0 : current;
}

function resolvePrevIndex(current: number, count: number, loop: boolean): number {
  if (count <= 0) return current;
  if (current - 1 >= 0) return current - 1;
  return loop ? count - 1 : current;
}

function getDirection(from: number, to: number, count: number, loop: boolean): 1 | -1 {
  if (!loop) return to > from ? 1 : -1;
  if (from === count - 1 && to === 0) return 1;
  if (from === 0 && to === count - 1) return -1;
  return to > from ? 1 : -1;
}
