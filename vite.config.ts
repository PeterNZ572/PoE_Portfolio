import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoFallback = "PoE_Portfolio";

export default defineConfig(({ mode }) => {
  const envBase = process.env.VITE_BASE_PATH;
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? repoFallback;

  return {
    base: envBase ?? (mode === "development" ? "/" : `/${repoName}/`),
    plugins: [react()],
  };
});
