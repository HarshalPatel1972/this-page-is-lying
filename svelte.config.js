import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $features: "src/features",
      $shared: "src/shared",
      $widgets: "src/widgets",
      $appDir: "src/app",
    },
  },
};

export default config;
