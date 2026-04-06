import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@ai-org/db": resolve(__dirname, "../db/src/client.ts"),
      "@ai-org/broker": resolve(__dirname, "../broker/src/index.ts"),
    },
  },
});
