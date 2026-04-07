import type { AgentRegistry, RegistryEntry } from "@ai-org/broker";
import { prisma } from "@ai-org/db";
import type { AgentProfile } from "../profile.js";
import { resolveSkillPack } from "../skills.js";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

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

/**
 * Resolves the agent's skill pack into a full system prompt and saves it as a session artifact.
 * Returns the resolved prompt string, or null if no skills were configured.
 */
export async function injectSkills(
  profile: AgentProfile,
  repoRoot: string,
): Promise<string | null> {
  if (!profile.skill_pack || profile.skill_pack.length === 0) {
    return null;
  }

  const resolvedPrompt = await resolveSkillPack(profile.skill_pack, repoRoot);

  // Approximate token count (~4 chars per token for English text)
  const tokenCount = Math.ceil(resolvedPrompt.length / 4);

  console.log(`\n  Skill injection: ${profile.skill_pack.length} skills resolved (${tokenCount} tokens)`);

  // Save to artifacts/session/YYYY-MM-DD-{slug}-resolved.md
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const artifactPath = `${repoRoot}/artifacts/session/${dateStr}-${profile.slug}-resolved.md`;

  await mkdir(dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, resolvedPrompt, "utf-8");

  console.log(`  Saved resolved prompt: ${artifactPath}\n`);

  return resolvedPrompt;
}
