import { gsap } from "gsap";

export function registerGsapPlugins(...plugins: gsap.Plugin[]): void {
  gsap.registerPlugin(...plugins);
}
