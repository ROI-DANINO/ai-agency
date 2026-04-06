import type { AgentRegistry, RegistryEntry } from "@ai-org/broker";
import { prisma } from "@ai-org/db";
import type { AgentProfile } from "../profile.js";

export type ConnectResult =
  | { status: "connected"; peerId: string; entry: RegistryEntry }
  | { status: "rejected"; reason: string; occupiedBy: RegistryEntry }
  | { status: "reclaimed"; peerId: string; entry: RegistryEntry; notice: string };

export async function buildConnectAction(
  registry: AgentRegistry,
  profile: AgentProfile,
  peerId: string,
): Promise<ConnectResult> {
  const entry: RegistryEntry = {
    slug: profile.slug,
    peerId,
    rank: profile.rank,
    specialty: profile.specialty,
    domain: profile.domain,
    claimedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
  };

  const result = await registry.claim(entry);

  if (!result.ok) {
    return {
      status: "rejected",
      reason: `${profile.slug} is active in another session (peer: ${result.entry.peerId})`,
      occupiedBy: result.entry,
    };
  }

  return { status: "connected", peerId, entry: result.entry };
}

export async function syncAgentToDb(
  profile: AgentProfile,
  sessionId: string,
): Promise<void> {
  if ((profile.spawnedBy == null) !== (profile.scope == null)) {
    throw new Error(
      `Agent "${profile.slug}": spawnedBy and scope must both be set or both be absent ` +
      `(got spawnedBy=${profile.spawnedBy ?? "undefined"}, scope=${profile.scope ?? "undefined"})`,
    );
  }

  const scopeValue = profile.scope
    ? (profile.scope.toUpperCase() as "TASK" | "PERSISTENT")
    : null;

  await prisma.agent.upsert({
    where: { slug: profile.slug },
    create: {
      slug: profile.slug,
      name: profile.name,
      type: profile.scope === "task" ? "TEMPORARY" : "TENURE",
      rank: profile.rank.toUpperCase() as "ADMIN" | "OPERATOR" | "LEAD" | "AGENT",
      specialty: profile.specialty ?? null,
      domain: profile.domain ?? null,
      meshRead: profile.mesh_read,
      meshWrite: profile.mesh_write,
      modelTier: profile.model_tier,
      skillPack: profile.skill_pack,
      protected: profile.protected,
      spawnedBy: profile.spawnedBy ?? null,
      scope: scopeValue,
      status: "ONLINE",
      currentSessionId: sessionId,
      sessionStartedAt: new Date(),
      heartbeatAt: new Date(),
      sessionCount: 1,
    },
    update: {
      type: profile.scope === "task" ? "TEMPORARY" : "TENURE",
      name: profile.name,
      meshRead: profile.mesh_read,
      meshWrite: profile.mesh_write,
      modelTier: profile.model_tier,
      skillPack: profile.skill_pack,
      protected: profile.protected,
      spawnedBy: profile.spawnedBy ?? null,
      scope: scopeValue,
      status: "ONLINE",
      currentSessionId: sessionId,
      sessionStartedAt: new Date(),
      heartbeatAt: new Date(),
      sessionCount: { increment: 1 },
    },
  });
}

export async function releaseAgentFromDb(slug: string): Promise<void> {
  await prisma.agent.updateMany({
    where: { slug },
    data: {
      status: "OFFLINE",
      currentSessionId: null,
      sessionStartedAt: null,
      heartbeatAt: null,
      activeTaskIds: [],
    },
  });
}
