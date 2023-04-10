import solid from "solid-start/vite";
import solidStartVercel from "solid-start-vercel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ adapter: solidStartVercel({}) })],
});
