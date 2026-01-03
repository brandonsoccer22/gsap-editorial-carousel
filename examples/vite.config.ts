import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const packageRoot = path.resolve(rootDir, "..");

export default defineConfig({
  root: rootDir,
  server: {
    open: "/basic/",
    fs: {
      allow: [packageRoot]
    }
  },
  resolve: {
    alias: [
      {
        find: "@acme/gsap-carousel/styles.css",
        replacement: path.resolve(packageRoot, "styles.css")
      },
      {
        find: "@acme/gsap-carousel",
        replacement: path.resolve(packageRoot, "src/index.ts")
      }
    ]
  }
});
