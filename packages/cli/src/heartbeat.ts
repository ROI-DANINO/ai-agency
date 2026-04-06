import type { AgentRegistry } from "@ai-org/broker";
import { HEARTBEAT_INTERVAL_MS } from "@ai-org/broker";

export function startHeartbeat(
  registry: AgentRegistry,
  slug: string,
  peerId: string,
): { stop: () => void } {
  const timer = setInterval(async () => {
    await registry.heartbeat(slug, peerId);
  }, HEARTBEAT_INTERVAL_MS);

  // Allow Node.js to exit even if heartbeat is running
  timer.unref();

  return {
    stop: () => clearInterval(timer),
  };
}
