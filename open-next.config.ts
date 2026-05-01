import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // This tells OpenNext to use Cloudflare's native caching and Node.js compatibility
  incrementalCache: true,
});