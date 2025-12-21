import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
          dest: ".",
        },
      ],
    }),
  ],
});
