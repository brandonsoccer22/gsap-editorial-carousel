import { toggleClass } from "./dom";

export function setSlidesState(
  slides: Element[],
  activeIndex: number,
  activeClass: string
): void {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    if (isActive) {
      slide.removeAttribute("inert");
    } else {
      slide.setAttribute("inert", "");
    }
    toggleClass(slide, activeClass, isActive);
  });
}

export function setDotsState(
  dots: Element[],
  activeIndex: number,
  activeClass: string
): void {
  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    if (isActive) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
    toggleClass(dot, activeClass, isActive);
  });
}
