export function resolveRoot(root: string | Element): Element {
  if (typeof root === "string") {
    const el = document.querySelector(root);
    if (!el) {
      throw new Error(`Carousel root not found for selector: ${root}`);
    }
    return el;
  }
  return root;
}

export function qs<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector(selector) as T | null;
}

export function qsa<T extends Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}

export function toggleClass(el: Element, name: string, active: boolean): void {
  if (active) {
    el.classList.add(name);
  } else {
    el.classList.remove(name);
  }
}

export function setAriaDisabled(el: Element, disabled: boolean): void {
  el.setAttribute("aria-disabled", disabled ? "true" : "false");
}

export function setDisabled(
  el: Element | null,
  disabled: boolean,
  disabledClass: string
): void {
  if (!el) return;
  const isButton = el instanceof HTMLButtonElement || el instanceof HTMLInputElement;
  if (isButton) {
    (el as HTMLButtonElement | HTMLInputElement).disabled = disabled;
  }
  setAriaDisabled(el, disabled);
  toggleClass(el, disabledClass, disabled);
}

export function isFocusableWithin(root: Element, target: Element | null): boolean {
  return !!target && root.contains(target);
}

export function ensureRootFocusable(root: Element): void {
  if (!root.hasAttribute("tabindex")) {
    root.setAttribute("tabindex", "0");
  }
}
