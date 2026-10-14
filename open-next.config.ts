import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // @ts-ignore
  cloudflare: { useWorkerdCondition: true }
});
