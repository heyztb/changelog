import { serve } from "bun";
import app from "public/index.html";
import { logger } from "./lib/logger";
import manifest from "./farcaster.json";

const server = serve({
  port: process.env.PORT || 3000,
  hostname: "0.0.0.0",

  routes: {
    "/*": app,
    "/.well-known/farcaster.json": () => Response.json(manifest),
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

logger.info(`Server running at ${server.url}`);
