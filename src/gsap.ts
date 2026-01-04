import { gsap } from "gsap";

export function registerGsapPlugins(
  ...plugins: gsap.RegisterablePlugins[]
): void {
  gsap.registerPlugin(...plugins);
}
