# @brandonsoccer22/gsap-carousel

A small, class-driven GSAP carousel controller that handles state, accessibility, animation orchestration, and dot cloning without enforcing layout. You own the markup and CSS; the library handles wiring.

## Why class-driven animations?
Content editors can add animation classes and data attributes directly in a CMS without touching JavaScript. Elements inside slides opt into motion by adding a class that matches a registered animation.

## Install

```bash
npm i @brandonsoccer22/gsap-editorial-carousel gsap
```

## Markup (semantic + user-placed controls)

```html
<section data-carousel>
  <div class="hero">
    <button data-carousel-prev>Prev</button>
    <button data-carousel-next>Next</button>
  </div>

  <div class="slides">
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

- The dot template is cloned once per slide and hidden via `template.hidden = true`.
- Controls can be placed anywhere inside the carousel markup; no wrappers are injected.
- Re-initialization clears previously generated dots (`data-carousel-dot=\"true\"`) before cloning.

## Usage

```ts
import "@brandonsoccer22/gsap-carousel/styles.css";
import { createCarousel } from "@brandonsoccer22/gsap-carousel";

const carousel = createCarousel("[data-carousel]", {
  loop: true,
  initialIndex: 0
});

// programmatic control
carousel.next();
carousel.goTo(2, { immediate: false });
```

The base stylesheet only controls slide visibility (`.is-active`) and disabled controls; layout remains entirely up to you.
Optional helper: add `.gsap-carousel__stack` to a slides wrapper to stack slides with `position: absolute`.
Slides can use `data-carousel-slide` or the optional `.gsap-carousel__slide` class; both work with `.gsap-carousel__stack`.

## Transition lock behavior
While animating, all navigation requests are ignored and controls are disabled (buttons get `disabled`, everything gets `aria-disabled`).

## Keyboard input
Arrow keys are active only when focus is within the carousel root. The root is given `tabindex=\"0\"` if none exists.

## Built-in animations
Registered by default:
- `fade-in`
- `fade-up`
- `slide-in` (direction-aware)

If multiple classes match registered animation names, the first match in `classList` order wins.

## Custom animation registration

```ts
import { registerAnimation } from "@brandonsoccer22/gsap-carousel";
import type { AnimationFactory } from "@brandonsoccer22/gsap-carousel";

const popIn: AnimationFactory = ({ el, tl, opts }) => {
  tl.fromTo(
    el,
    { scale: 0.9, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: opts.dur, delay: opts.delay, ease: opts.ease },
    opts.at
  );
};

// Optional reverse factory (used for exit when data-exit is missing)
popIn.reverse = ({ el, tl, opts }) => {
  tl.to(el, { scale: 0.98, autoAlpha: 0, duration: opts.dur, delay: opts.delay }, opts.at);
};

registerAnimation("pop-in", popIn);
```

Example with SplitText + overlap

```ts
import type { AnimationFactory } from "@brandonsoccer22/gsap-carousel";
import { createCarousel, registerAnimation, registerGsapPlugins } from "@brandonsoccer22/gsap-carousel";
import { gsap } from "gsap";
import SplitText from "gsap/SplitText";

registerGsapPlugins(SplitText);

const splitLines: AnimationFactory = ({ el, tl, gsap, opts }) => {
  const split = new SplitText(el, { type: "lines" });

  gsap.set(split.lines, { yPercent: -120, opacity: 0 });

  tl.to(
    split.lines,
    {
      yPercent: 0,
      opacity: 1,
      duration: opts.dur,
      ease: opts.ease,
      stagger: 0.06
    },
    opts.at
  );

  tl.add(() => split.revert(), ">");
};

registerAnimation("split-lines", splitLines);

const splitLinesExit: AnimationFactory = ({ el, tl, opts }) => {
  const split = new SplitText(el, { type: "lines" });

  tl.to(
    split.lines,
    {
      yPercent: 40,
      opacity: 0,
      duration: Math.min(opts.dur, 0.55),
      ease: opts.ease,
      stagger: 0.05
    },
    opts.at
  );

  tl.add(() => split.revert(), ">");
};

registerAnimation("split-lines-exit", splitLinesExit);

createCarousel("[data-carousel]", {
  gsap,
  transition: { overlap: 0.05 }
});
```

## Data attributes reference
- `data-seq="1"` sequence group (integer, default 1)
- `data-exit-seq="1"` exit sequence group (integer, defaults to `data-seq`)
- `data-dur="0.6"` duration in seconds (default from options)
- `data-delay="0"` delay in seconds (default 0)
- `data-at="-=0.4"` position offset in seconds for this element within its sequence; supports `+=`/`-=` or a plain number
- `data-ease="power2.out"` GSAP ease string
- `data-exit="fade-in"` explicit exit animation name

## Reduced motion
If the user prefers reduced motion, slide switching happens immediately and element-level enter/exit animations are skipped.

## Destroy

```ts
carousel.destroy();
```

`destroy()` removes all listeners, kills active timelines, reverts GSAP context, and removes generated dots (the template is unhidden).

## API

```ts
createCarousel(root, options?): CarouselInstance
registerAnimation(name, factory): void
registerAnimations(map): void
```

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
