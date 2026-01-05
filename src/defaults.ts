import { registerAnimations } from "./registry";
import type { AnimationFactoryWithReverse } from "./registry";

export const defaultSelectors = {
  root: "[data-carousel]",
  slide: "[data-carousel-slide], .gsap-carousel__slide",
  prev: "[data-carousel-prev]",
  next: "[data-carousel-next]",
  dots: "[data-carousel-dots]",
  dotTemplate: "[data-carousel-dot-template]"
};

export const defaultClassNames = {
  activeSlide: "is-active",
  animatingRoot: "is-animating",
  disabledControl: "is-disabled",
  dot: "gsap-carousel__dot",
  activeDot: "is-active"
};

export const defaultOptions = {
  loop: true,
  initialIndex: 0,
  transition: {
    overlap: 0
  },
  defaults: {
    dur: 0.6,
    ease: "power2.out"
  }
};

let didRegister = false;

export function ensureDefaultAnimationsRegistered(): void {
  if (didRegister) return;
  didRegister = true;

  // fade-in: opacity 0 -> 1.
  const fadeIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-up: enter from below with upward motion.
  const fadeUp: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeUp.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: -12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-down: enter from above with downward motion.
  const fadeDown: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: -24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeDown.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: 12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // slide-in: enter from direction (left/right).
  const slideIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, x: opts.direction * 40 },
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  slideIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: opts.direction * -24,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-out: opacity 1 -> 0.
  const fadeOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  fadeOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 1,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  // slide-out: exit toward direction (left/right).
  const slideOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: opts.direction * -24,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  slideOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  registerAnimations({
    "fade-in": fadeIn,
    "fade-down": fadeDown,
    "fade-down-in": fadeDownIn,
    "fade-down-out": fadeDownOut,
    "fade-out": fadeOut,
    "fade-up": fadeUp,
    "fade-up-in": fadeUpIn,
    "fade-up-out": fadeUpOut,
    "fade-start-in": fadeStartIn,
    "fade-start-out": fadeStartOut,
    "fade-end-in": fadeEndIn,
    "fade-end-out": fadeEndOut,
    "slide-in": slideIn,
    "slide-out": slideOut
  });
}
  // fade-up-in: enter from below with upward motion.
  const fadeUpIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeUpIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: -12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-up-out: exit upward while fading out.
  const fadeUpOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: -12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  fadeUpOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  // fade-down-in: enter from above with downward motion.
  const fadeDownIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: -24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeDownIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: 12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-down-out: exit downward while fading out.
  const fadeDownOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        y: 12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  fadeDownOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, y: -24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  // fade-start-in: enter from inline-start (left in LTR).
  const fadeStartIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, x: -24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeStartIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: -12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-start-out: exit toward inline-start (left in LTR).
  const fadeStartOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: -12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  fadeStartOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, x: -24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  // fade-end-in: enter from inline-end (right in LTR).
  const fadeEndIn: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };

  fadeEndIn.reverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: 12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  // fade-end-out: exit toward inline-end (right in LTR).
  const fadeEndOut: AnimationFactoryWithReverse = ({ el, gsap, opts, tl }) => {
    tl.to(
      el,
      {
        autoAlpha: 0,
        x: 12,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
    tl.set(el, { autoAlpha: 0 }, ">");
  };

  fadeEndOut.reverse = ({ el, gsap, opts, tl }) => {
    tl.fromTo(
      el,
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: opts.dur,
        delay: opts.delay,
        ease: opts.ease
      },
      opts.at
    );
  };
