import solid from "solid-start/vite";
import cloudflare from "solid-start-cloudflare-pages";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ adapter: cloudflare({}) })],
});
