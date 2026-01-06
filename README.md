# @brandonsoccer22/gsap-editorial-carousel

A small, class-driven GSAP carousel controller that wires state, accessibility, and animation sequencing without enforcing layout. You own the markup and CSS; the library handles wiring, timelines, and dot cloning.

## Install

```bash
npm i @brandonsoccer22/gsap-editorial-carousel gsap
```

## Quick start

```html
<section data-carousel id="hero-carousel">
  <div class="hero">
    <button data-carousel-prev>Prev</button>
    <button data-carousel-next>Next</button>
  </div>

  <div class="slides gsap-carousel__stack">
    <article data-carousel-slide>
      <h2 class="fade-up" data-seq="1">Headline</h2>
      <p class="fade-in" data-seq="2" data-dur="0.4">Description</p>
    </article>

    <article data-carousel-slide>
      <h2 class="slide-in" data-seq="1">Second</h2>
      <p class="fade-in" data-seq="2">More copy</p>
    </article>
  </div>

  <div data-carousel-dots>
    <button data-carousel-dot-template>•</button>
  </div>
</section>
```

```ts
import "@brandonsoccer22/gsap-editorial-carousel/styles.css";
import { createCarousel } from "@brandonsoccer22/gsap-editorial-carousel";

const carousel = createCarousel("[data-carousel]", {
  loop: true,
  initialIndex: 0
});

carousel.next();
carousel.goTo(2, { immediate: false });
```

- The base stylesheet only controls slide visibility (`.is-active`) and disabled controls; layout remains yours.
- Add `.gsap-carousel__stack` to stack slides (positioned absolute) while keeping the active slide in flow.

## Exports

```ts
createCarousel(root, options?): CarouselInstance
registerGsapPlugins(...plugins): void
registerAnimation(name, factory): void
registerAnimations(map): void
```

Types are also exported: `CarouselOptions`, `CarouselInstance`, `AnimationFactory`, `AnimationFactoryContext`.

## createCarousel(root, options?)

### root
`string | Element`  
If a selector string is provided and no element is found, an error is thrown. The resolved root is forced to be focusable (`tabindex="0"` is added if missing).

### options

All options are optional; defaults are shown.

#### loop
`boolean`  
Default: `true`  
Wraps index changes at the ends. When `false`, indices are clamped.

#### initialIndex
`number`  
Default: `0`  
Starting slide index.

#### gsap
`typeof gsap`  
Default: the imported `gsap` instance.  
Useful when you are providing a custom GSAP bundle.

#### selectors
```ts
{
  root: "[data-carousel]",
  slide: "[data-carousel-slide], .gsap-carousel__slide",
  prev: "[data-carousel-prev]",
  next: "[data-carousel-next]",
  dots: "[data-carousel-dots]",
  dotTemplate: "[data-carousel-dot-template]"
}
```
Selectors are scoped to the root. If the root has an `id`, `prev`, `next`, and `dots` can live outside the root by adding `data-for="root-id"` to the controls container.

#### classNames
```ts
{
  activeSlide: "is-active",
  animatingRoot: "is-animating",
  disabledControl: "is-disabled",
  dot: "gsap-carousel__dot",
  activeDot: "is-active"
}
```

#### defaults
```ts
{
  dur: 0.6,
  ease: "power2.out"
}
```
These are per-element defaults for animations when no data attribute overrides are provided.

#### transition
```ts
{
  overlap: 0,
  exitOverlap?: number
}
```
`overlap` defines how much the enter timeline overlaps the exit timeline.  
`exitOverlap` (if provided) overrides `overlap` for exit/enter overlap calculations. Values are clamped to `>= 0`.

#### onInit
`(instance: CarouselInstance) => void`  
Called after initialization.

#### onBeforeChange
`({ from, to, direction }) => void`  
Called before an animated change begins. `direction` is `1` or `-1`.

#### onAfterChange
`({ from, to, direction }) => void`  
Called after the change completes (or immediately if reduced motion or `immediate`).

## CarouselInstance

```ts
interface CarouselInstance {
  goTo(index: number, opts?: { immediate?: boolean }): void
  next(opts?: { immediate?: boolean }): void
  prev(opts?: { immediate?: boolean }): void
  destroy(): void
  getIndex(): number
  getCount(): number
  isAnimating(): boolean
}
```

`immediate: true` skips animation and updates state synchronously.

## Animation system

Elements opt into animation by adding a class name that matches a registered animation. If multiple class names match registered animations, the first match in `classList` order wins.

### Built-in animations

- `fade-in`
- `fade-out`
- `fade-up`
- `fade-up-in`
- `fade-up-out`
- `fade-down`
- `fade-down-in`
- `fade-down-out`
- `fade-start-in`
- `fade-start-out`
- `fade-end-in`
- `fade-end-out`
- `slide-in`
- `slide-out`

`slide-in` and `slide-out` are direction-aware (left/right based on navigation direction).

### AnimationFactory

```ts
type AnimationFactoryContext = {
  el: Element
  tl: gsap.core.Timeline
  gsap: typeof gsap
  opts: {
    dur: number
    delay: number
    ease?: string
    direction: 1 | -1
    at: number
  }
}

type AnimationFactory = (ctx: AnimationFactoryContext) => void
```

Factories may also define a `reverse` method, which is used for exit animations when no explicit `data-exit` animation is provided.

### Registering animations

```ts
import { registerAnimation } from "@brandonsoccer22/gsap-editorial-carousel";
import type { AnimationFactory } from "@brandonsoccer22/gsap-editorial-carousel";

const popIn: AnimationFactory = ({ el, tl, opts }) => {
  tl.fromTo(
    el,
    { scale: 0.9, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: opts.dur, delay: opts.delay, ease: opts.ease },
    opts.at
  );
};

popIn.reverse = ({ el, tl, opts }) => {
  tl.to(el, { scale: 0.98, autoAlpha: 0, duration: opts.dur, delay: opts.delay }, opts.at);
};

registerAnimation("pop-in", popIn);
```

### Sequence + data attributes

Elements are grouped into sequence buckets and played in order. Within each sequence, elements can offset their start position using `data-at`.

- `data-seq="1"` sequence group (integer, default 1)
- `data-exit-seq="1"` exit sequence group (integer, defaults to `data-seq`)
- `data-dur="0.6"` duration in seconds (default from options)
- `data-delay="0"` delay in seconds (default 0)
- `data-exit-dur="0.6"` exit duration in seconds (defaults to `data-dur`)
- `data-exit-delay="0"` exit delay in seconds (defaults to `data-delay`)
- `data-at="-=0.4"` position offset in seconds for this element within its sequence
- `data-exit-at="-=0.2"` exit position offset in seconds (defaults to `data-at`)
- `data-ease="power2.out"` GSAP ease string
- `data-exit-ease="power2.out"` exit ease string (defaults to `data-ease`)
- `data-exit="fade-in"` explicit exit animation name

`data-at` and `data-exit-at` support absolute values (`0.2`) or relative offsets (`+=0.1`, `-=0.1`).

## Dots + controls

- `data-carousel-dot-template` is cloned once per slide and hidden (`template.hidden = true`).
- Generated dots receive `data-carousel-dot="true"` and `data-carousel-dot-index`.
- Re-initialization clears previously generated dots.
- Add `data-carousel-disable-opacity` to the dot template to avoid the `.is-disabled` opacity rule.

Controls (`data-carousel-prev`, `data-carousel-next`) can be placed anywhere inside the root. If you need controls outside, add an `id` to the root and a matching `data-for="id"` on the control.

## Reduced motion

If `prefers-reduced-motion: reduce` is enabled, slide switching happens immediately and element-level animations are skipped.

## Destroy

```ts
carousel.destroy();
```

`destroy()` removes listeners, kills active timelines, reverts GSAP context, and removes generated dots (the template is unhidden).

## Examples

- Basic setup: `examples/basic`
- Tailwind variant: `examples/tailwind`

## More examples

### Custom selectors + class names

```ts
createCarousel(".my-carousel", {
  selectors: {
    root: ".my-carousel",
    slide: ".my-slide",
    prev: ".my-prev",
    next: ".my-next",
    dots: ".my-dots",
    dotTemplate: ".my-dot-template"
  },
  classNames: {
    activeSlide: "is-active",
    animatingRoot: "is-animating",
    disabledControl: "is-disabled",
    dot: "my-dot",
    activeDot: "is-active"
  }
});
```

### Custom transition overlap

```ts
createCarousel("[data-carousel]", {
  transition: {
    overlap: 0.15,
    exitOverlap: 0.1
  }
});
```

### SplitText + overlap sequencing

```ts
import SplitText from "gsap/SplitText";
import { createCarousel, registerAnimation, registerGsapPlugins } from "@brandonsoccer22/gsap-editorial-carousel";
import type { AnimationFactory } from "@brandonsoccer22/gsap-editorial-carousel";

registerGsapPlugins(SplitText);

const splitLines: AnimationFactory = ({ el, tl, gsap, opts }) => {
  const split = new SplitText(el, { type: "lines" });
  gsap.set(split.lines, { yPercent: -120, opacity: 0 });
  tl.to(split.lines, { yPercent: 0, opacity: 1, duration: opts.dur, ease: opts.ease, stagger: 0.06 }, opts.at);
  tl.add(() => split.revert(), ">");
};

registerAnimation("split-lines", splitLines);

createCarousel("[data-carousel]", {
  transition: { overlap: 0.05, exitOverlap: 0.05 }
});
```
