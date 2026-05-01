import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Disabling this prevents the "incrementalCache.set" 500 error
  incrementalCache: false,
});