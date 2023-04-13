import solid from "solid-start/vite";
import solidStartVercel from "solid-start-vercel";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ ssr: true, adapter: solidStartVercel({prerender: {
    expiration: 60,
  }}) })],
});
