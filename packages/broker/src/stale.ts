export function isStale(
  entry: { heartbeatAt: string },
  thresholdMs: number,
): boolean {
  const age = Date.now() - Date.parse(entry.heartbeatAt);
  return age >= thresholdMs;
}
