import { defineConfig } from "vitest/config";

export default defineConfig({
  envDir: false,
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    hookTimeout: 120_000,
  },
});
