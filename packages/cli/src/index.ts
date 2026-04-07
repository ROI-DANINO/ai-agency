#!/usr/bin/env node
import { Command } from "commander";
import { connect as natsConnect } from "nats";
import { AgentRegistry, REGISTRY_BUCKET } from "@ai-org/broker";
import { readProfile, profilePath } from "./profile.js";
import { buildConnectAction, syncAgentToDb, releaseAgentFromDb, injectSkills } from "./commands/connect.js";
import { createSkillsCommand } from "./commands/skills.js";
import { createRunWorkflowCommand } from "./commands/run-workflow.js";
import { startHeartbeat } from "./heartbeat.js";
import { randomUUID } from "crypto";
import { resolve } from "path";

const program = new Command();
const NATS_URL = process.env["NATS_URL"] ?? "nats://localhost:4222";
const REPO_ROOT = process.env["AI_ORG_ROOT"] ?? resolve(process.cwd());

program
  .name("ai-org")
  .description("ai-org CLI — connect to your agent team")
  .version("0.1.0");

program
  .command("connect")
  .description("Connect to the agent mesh")
  .option("--as <slug>", "Connect as a specific agent profile")
  .action(async (opts: { as?: string }) => {
    const slug = opts.as ?? "mission-op";
    const filePath = profilePath(slug, REPO_ROOT);

    let profile;
    try {
      profile = await readProfile(filePath);
    } catch {
      console.error(`Error: No profile found for slug "${slug}" at ${filePath}`);
      process.exit(1);
    }

    let nc;
    try {
      nc = await natsConnect({ servers: NATS_URL });
    } catch {
      console.error(`Error: Cannot connect to NATS at ${NATS_URL}`);
      console.error("Start NATS with: docker run -d -p 4222:4222 nats:alpine -js");
      process.exit(1);
    }

    const js = nc.jetstream();
    const kv = await js.views.kv(REGISTRY_BUCKET, { history: 1 });
    const registry = new AgentRegistry(kv);

    const peerId = randomUUID();
    const result = await buildConnectAction(registry, profile, peerId);

    if (result.status === "rejected") {
      console.error(`\n✗ ${result.reason}`);
      console.error("  Use a different terminal or wait for the session to expire.\n");
      await nc.close();
      process.exit(1);
    }

    // Sync to Prisma DB
    await syncAgentToDb(profile, peerId);

    // Inject skills into system prompt
    await injectSkills(profile, REPO_ROOT);

    const { stop } = startHeartbeat(registry, slug, peerId);

    console.log(`\n✓ Connected as ${profile.emoji} ${profile.name} [${slug}]`);
    console.log(`  Peer ID: ${peerId}`);
    console.log(`  Rank: ${profile.rank}${profile.domain ? ` · ${profile.domain}` : ""}${profile.specialty ? ` · ${profile.specialty}` : ""}`);
    console.log(`  Heartbeat: every 30s · Stale threshold: 90s\n`);

    const shutdown = async () => {
      stop();
      await registry.release(slug, peerId);
      await releaseAgentFromDb(slug);
      await nc.close();
      console.log(`\n  ${profile.emoji} ${profile.name} disconnected.\n`);
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

program.addCommand(createSkillsCommand());
program.addCommand(createRunWorkflowCommand());

program.parse();
