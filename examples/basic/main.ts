import "@acme/gsap-carousel/styles.css";
import "./style.css";

// @ts-ignore
import { createCarousel } from "@acme/gsap-carousel";

const carousel = createCarousel("[data-carousel]", {
  loop: true,
  initialIndex: 0
});
