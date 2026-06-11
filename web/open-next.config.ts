import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pas de cache incrémental pour l'instant (pages dynamiques) ;
// brancher r2IncrementalCache si on active l'ISR plus tard.
export default defineCloudflareConfig({});
