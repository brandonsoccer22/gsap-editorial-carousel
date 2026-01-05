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
  transition: {
    overlap: number;
    exitOverlap?: number;
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
  prev: Element[];
  next: Element[];
  dotsContainers: HTMLElement[];
  dotTemplates: Array<HTMLElement | null>;
  dots: Element[][];
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
    transition: { ...defaultOptions.transition, ...options.transition },
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
  setAllDotsState(currentIndex);

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
    if (animating) return;
    const nextIndex = normalizeIndex(index, slides.length, resolved.loop);
    if (nextIndex === currentIndex) return;
    setAllDotsState(nextIndex);
    goTo(nextIndex);
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

  controls.prev.forEach((control) => control.addEventListener("click", onPrevClick));
  controls.next.forEach((control) => control.addEventListener("click", onNextClick));
  controls.dotsContainers.forEach((container) => container.addEventListener("click", onDotsClick));
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
    controls.prev.forEach((control) => {
      setDisabled(control, disabled, resolved.classNames.disabledControl);
    });
    controls.next.forEach((control) => {
      setDisabled(control, disabled, resolved.classNames.disabledControl);
    });
    controls.dotsContainers.forEach((container) => {
      setAriaDisabled(container, disabled);
    });
    controls.dots.forEach((dotGroup) => {
      dotGroup.forEach((dot) => {
        setAriaDisabled(dot, disabled);
        toggleClass(dot, resolved.classNames.disabledControl, disabled);
      });
    });
  }

  function setAllDotsState(activeIndex: number): void {
    controls.dots.forEach((dotGroup) => {
      setDotsState(dotGroup, activeIndex, resolved.classNames.activeDot);
    });
  }

  function applyActiveState(nextIndex: number): void {
    currentIndex = nextIndex;
    setSlidesState(slides, currentIndex, resolved.classNames.activeSlide);
    setAllDotsState(currentIndex);
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
    const overlap = Math.max(0, resolved.transition.exitOverlap ?? resolved.transition.overlap);
    const enterAt = Math.max(0, exitTl.duration() - overlap);
    master.add(exitTl, 0);
    master.add(() => applyActiveState(to), enterAt);
    master.add(enterTl, enterAt);
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
    setAllDotsState(nextIndex);
    transitionTo(nextIndex, opts?.immediate);
  }

  function prev(opts?: { immediate?: boolean }): void {
    if (animating) return;
    const nextIndex = resolvePrevIndex(currentIndex, slides.length, resolved.loop);
    if (nextIndex === currentIndex) return;
    setAllDotsState(nextIndex);
    transitionTo(nextIndex, opts?.immediate);
  }

  function destroy(): void {
    controls.prev.forEach((control) => control.removeEventListener("click", onPrevClick));
    controls.next.forEach((control) => control.removeEventListener("click", onNextClick));
    controls.dotsContainers.forEach((container) => container.removeEventListener("click", onDotsClick));
    //root.removeEventListener("keydown", onKeydown);

    state.activeTimeline?.kill();
    animating = false;
    ctx.revert();

    controls.dotsContainers.forEach((container) => {
      container.querySelectorAll(generatedDotSelector).forEach((dot) => {
        dot.remove();
      });
    });
    controls.dotTemplates.forEach((template) => {
      if (template) {
        template.hidden = false;
      }
    });
  }

  return instance;
}

function resolveControls(root: Element, options: CarouselOptions, slideCount: number): ResolvedControls {
  const rootId = root.getAttribute("id");
  const queryAllWithFallback = <T extends Element>(selector: string): T[] => {
    if (rootId) {
      const scoped = Array.from(document.querySelectorAll<T>(`${selector}[data-for="${rootId}"]`));
      if (scoped.length) return scoped;
    }
    return qsa<T>(root, selector);
  };

  const prev = queryAllWithFallback<Element>(options.selectors.prev);
  const next = queryAllWithFallback<Element>(options.selectors.next);
  const dotsContainers = queryAllWithFallback<HTMLElement>(options.selectors.dots);
  const dotTemplates: Array<HTMLElement | null> = [];
  const dots = dotsContainers.map((container) => {
    const template = qs<HTMLElement>(container, options.selectors.dotTemplate);
    dotTemplates.push(template);
    return setupDots(container, template, options, slideCount);
  });

  return { prev, next, dotsContainers, dotTemplates, dots };
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
  const disableOpacityAttr = template.getAttribute("data-carousel-disable-opacity");

  for (let i = 0; i < slideCount; i += 1) {
    const clone = template.cloneNode(true) as Element;
    clone.removeAttribute("id");
    clone.setAttribute("data-carousel-dot", "true");
    clone.setAttribute("data-carousel-dot-index", String(i));
    if (disableOpacityAttr !== null) {
      clone.setAttribute("data-carousel-disable-opacity", disableOpacityAttr);
    } else {
      clone.removeAttribute("data-carousel-disable-opacity");
    }
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
