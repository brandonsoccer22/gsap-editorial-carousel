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
  };

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
  };

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
  };

  registerAnimations({
    "fade-in": fadeIn,
    "fade-up": fadeUp,
    "slide-in": slideIn
  });
}
