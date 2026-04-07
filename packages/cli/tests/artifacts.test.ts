import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  writeBriefingPack,
  writeHandoff,
  readArtifact,
  validateArtifact,
  listArtifacts,
  type BriefingPack,
  type Handoff,
} from "../src/artifacts.js";
import { mkdir, rm, access } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixturesRoot = resolve(__dirname, "../fixtures");
const testArtifactsRoot = resolve(__dirname, "..", "test-artifacts-tmp");

describe("writeBriefingPack + readArtifact", () => {
  let writtenPath: string;

  beforeAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  it("writes a briefing pack and reads it back correctly", async () => {
    const bp: BriefingPack = {
      date: "2026-04-07",
      agent: "dev-leader",
      task: "TASK-001",
      role: "backend-dev",
      taskDescription: "Implement user auth endpoints",
      context: "OAuth2 integration needed",
      keyReferences: [
        { path: "docs/auth.md", reason: "API contract" },
      ],
      teamState: "Frontend is on track",
      predecessorHandoffs: "None — first task",
      constraints: { tokenBudget: "2000" },
    };

    writtenPath = await writeBriefingPack(bp, testArtifactsRoot);

    // Read back
    const content = await readArtifact(writtenPath);
    expect(content).toContain("# Briefing Pack — dev-leader / TASK-001");
    expect(content).toContain("Date: 2026-04-07");
    expect(content).toContain("Implement user auth endpoints");
    expect(content).toContain("OAuth2 integration needed");
    expect(content).toContain("`docs/auth.md`: API contract");
    expect(content).toContain("Token budget: 2000");
    expect(content).toContain("None — first task");
    expect(content).toContain("---"); // frontmatter
    expect(content).toContain("status: written");
    expect(content).toContain("agent: dev-leader");
  });

  it("uses the expected filename format", () => {
    expect(writtenPath).toMatch(/briefing-packs\/2026-04-07-dev-leader-task-001\.md$/);
  });
});

describe("writeHandoff + readArtifact", () => {
  let writtenPath: string;

  beforeAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  it("writes a handoff and reads it back correctly", async () => {
    const h: Handoff = {
      date: "2026-04-07",
      from: "dev-leader",
      to: "qa-agent",
      task: "TASK-001",
      completed: ["Auth endpoints implemented", "Unit tests written"],
      remaining: ["Integration tests"],
      openQuestions: ["Rate limiting strategy?"],
      context: "Frontend team waiting on this",
      firstAction: "Run the existing unit tests",
    };

    writtenPath = await writeHandoff(h, testArtifactsRoot);

    const content = await readArtifact(writtenPath);
    expect(content).toContain("# Handoff — dev-leader → qa-agent");
    expect(content).toContain("Date: 2026-04-07");
    expect(content).toContain("From: dev-leader");
    expect(content).toContain("To: qa-agent");
    expect(content).toContain("- Auth endpoints implemented");
    expect(content).toContain("- Unit tests written");
    expect(content).toContain("- Integration tests");
    expect(content).toContain("- Rate limiting strategy?");
    expect(content).toContain("Frontend team waiting on this");
    expect(content).toContain("Run the existing unit tests");
    expect(content).toContain("---"); // frontmatter
  });

  it("uses the expected filename format", () => {
    expect(writtenPath).toMatch(/handoffs\/2026-04-07-dev-leader-to-qa-agent-task-001\.md$/);
  });
});

describe("validateArtifact", () => {
  it("accepts a valid briefing pack", () => {
    const bp: BriefingPack = {
      date: "2026-04-07",
      agent: "dev",
      task: "T-1",
      role: "dev",
      taskDescription: "Do something",
      context: "Context here",
      keyReferences: [],
      teamState: "All good",
      predecessorHandoffs: "None",
      constraints: {},
    };

    const result = validateArtifact(bp, "briefing-pack");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an invalid briefing pack with missing fields", () => {
    const result = validateArtifact({}, "briefing-pack");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain("Missing field: date");
    expect(result.errors).toContain("Missing field: agent");
    expect(result.errors).toContain("Missing field: task");
  });

  it("rejects a briefing pack with missing keyReferences array", () => {
    const bad = { date: "2026-04-07", agent: "d", task: "t", role: "r", taskDescription: "x", context: "c", teamState: "ok", predecessorHandoffs: "n", constraints: {} };
    // keyReferences is missing — should be invalid
    const result = validateArtifact(bad, "briefing-pack");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing field: keyReferences (must be array)");
  });

  it("rejects non-object input", () => {
    expect(validateArtifact(null, "briefing-pack").valid).toBe(false);
    expect(validateArtifact("string", "handoff").valid).toBe(false);
    expect(validateArtifact(42, "decision-report").valid).toBe(false);
  });

  it("accepts a valid handoff", () => {
    const h: Handoff = {
      date: "2026-04-07",
      from: "a",
      to: "b",
      task: "T-1",
      completed: [],
      remaining: [],
      openQuestions: [],
      context: "ctx",
      firstAction: "do it",
    };
    const result = validateArtifact(h, "handoff");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a handoff missing required fields", () => {
    const result = validateArtifact({ date: "2026-04-07" }, "handoff");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing field: from");
    expect(result.errors).toContain("Missing field: to");
    expect(result.errors).toContain("Missing field: completed (must be array)");
  });
});

describe("listArtifacts", () => {
  beforeAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  it("returns all artifacts of a given type", async () => {
    // Write two briefing packs and one handoff
    const bp1: BriefingPack = {
      date: "2026-04-07",
      agent: "dev",
      task: "T-1",
      role: "r",
      taskDescription: "td",
      context: "c",
      keyReferences: [],
      teamState: "s",
      predecessorHandoffs: "n",
      constraints: {},
    };
    const bp2: BriefingPack = {
      date: "2026-04-08",
      agent: "qa",
      task: "T-2",
      role: "r",
      taskDescription: "td",
      context: "c",
      keyReferences: [],
      teamState: "s",
      predecessorHandoffs: "n",
      constraints: {},
    };

    await writeBriefingPack(bp1, testArtifactsRoot);
    await writeBriefingPack(bp2, testArtifactsRoot);

    const h: Handoff = {
      date: "2026-04-07",
      from: "a",
      to: "b",
      task: "T-1",
      completed: [],
      remaining: [],
      openQuestions: [],
      context: "c",
      firstAction: "do",
    };
    await writeHandoff(h, testArtifactsRoot);

    const briefingPacks = await listArtifacts("briefing-pack", testArtifactsRoot);
    expect(briefingPacks.length).toBe(2);
    briefingPacks.forEach((p) => expect(p).toContain("briefing-packs/"));

    const handoffs = await listArtifacts("handoff", testArtifactsRoot);
    expect(handoffs.length).toBe(1);
    expect(handoffs[0]).toContain("handoffs/");
  });

  it("returns empty array when no artifacts exist", async () => {
    const emptyRoot = join(fixturesRoot, "__no_artifacts__");
    const result = await listArtifacts("briefing-pack", emptyRoot);
    expect(result).toEqual([]);
  });
});

describe("Directory creation", () => {
  beforeAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(testArtifactsRoot, { recursive: true, force: true });
  });

  it("creates artifact dirs if missing when writing a briefing pack", async () => {
    const freshRoot = join(testArtifactsRoot, "fresh-bp");
    const artifactPath = join(freshRoot, "artifacts/briefing-packs");

    // Ensure dir does not exist
    try {
      await access(artifactPath);
      throw new Error("DIR EXISTS ALREADY");
    } catch (e: any) {
      if (e.message === "DIR EXISTS ALREADY") throw e;
      // expected — dir does not exist
    }

    const bp: BriefingPack = {
      date: "2026-04-07",
      agent: "dev",
      task: "T-1",
      role: "r",
      taskDescription: "td",
      context: "c",
      keyReferences: [],
      teamState: "s",
      predecessorHandoffs: "n",
      constraints: {},
    };

    await writeBriefingPack(bp, freshRoot);

    // Now the dir should exist
    await access(artifactPath); // throws if missing
  });

  it("creates artifact dirs if missing when writing a handoff", async () => {
    const freshRoot = join(testArtifactsRoot, "fresh-handoff");
    const artifactPath = join(freshRoot, "artifacts", "handoffs");

    try {
      await access(artifactPath);
      throw new Error("DIR EXISTS ALREADY");
    } catch (e: any) {
      if (e.message === "DIR EXISTS ALREADY") throw e;
    }

    const h: Handoff = {
      date: "2026-04-07",
      from: "a",
      to: "b",
      task: "T-1",
      completed: [],
      remaining: [],
      openQuestions: [],
      context: "c",
      firstAction: "do",
    };

    await writeHandoff(h, freshRoot);
    await access(artifactPath);
  });
});
