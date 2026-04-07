import { describe, it, expect, beforeAll } from "vitest";
import {
  getSkillRegistry,
  resolveSkillPath,
  resolveSkillPack,
  validateChains,
  countTokens,
  TokenBudgetError,
} from "../src/skills.js";
import { mkdir, writeFile, access } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixturesRoot = resolve(__dirname, "../fixtures");

describe("getSkillRegistry", () => {
  it("returns all skills from fixture skill directories", async () => {
    const registry = await getSkillRegistry(fixturesRoot);
    expect(registry.length).toBe(3);

    const names = registry.map((s) => s.name);
    expect(names).toContain("project-brief");
    expect(names).toContain("session-end");
    expect(names).toContain("briefing-pack-agent");
  });

  it("sets correct types from frontmatter", async () => {
    const registry = await getSkillRegistry(fixturesRoot);
    const human = registry.find((s) => s.name === "project-brief");
    expect(human?.type).toBe("human");
    expect(human?.status).toBe("active");

    const stub = registry.find((s) => s.name === "briefing-pack-agent");
    expect(stub?.type).toBe("agent");
    expect(stub?.status).toBe("stub");
  });

  it("includes parsed content and tokenCount", async () => {
    const registry = await getSkillRegistry(fixturesRoot);
    const entry = registry.find((s) => s.name === "project-brief");
    expect(entry).toBeDefined();
    expect(entry!.content).toContain("test skill for the project brief");
    expect(entry!.tokenCount).toBeGreaterThan(0);
  });
});

describe("resolveSkillPath", () => {
  it("resolves a human skill name to correct path", async () => {
    const p = await resolveSkillPath("project-brief", fixturesRoot);
    expect(p).toBe(join(fixturesRoot, "skills/human/project-brief/SKILL.md"));
  });

  it("resolves an agent skill name to correct path", async () => {
    const p = await resolveSkillPath("briefing-pack-agent", fixturesRoot);
    expect(p).toBe(
      join(fixturesRoot, "skills/agent/briefing-pack-agent/SKILL.md"),
    );
  });

  it("throws when skill does not exist", async () => {
    await expect(
      resolveSkillPath("nonexistent-skill", fixturesRoot),
    ).rejects.toThrow(/Skill "nonexistent-skill" not found/);
  });

  it("prefers human skills over agent skills when both exist", async () => {
    // Create a shadow skill in agent dir with same name
    const shadowPath = join(
      fixturesRoot,
      "skills/agent/project-brief/SKILL.md",
    );
    await mkdir(join(fixturesRoot, "skills/agent/project-brief"), {
      recursive: true,
    });
    await writeFile(
      shadowPath,
      "---\nname: project-brief\ntype: agent\n---\nShadow agent skill",
    );

    try {
      const p = await resolveSkillPath("project-brief", fixturesRoot);
      // Should return human path
      expect(p).toContain("skills/human/project-brief/SKILL.md");
    } finally {
      // Cleanup
      const { rm } = await import("fs/promises");
      await rm(join(fixturesRoot, "skills/agent/project-brief"), {
        recursive: true,
      });
    }
  });
});

describe("resolveSkillPack", () => {
  it("concatenates multiple skill contents with separators", async () => {
    const pack = await resolveSkillPack(
      ["project-brief", "session-end"],
      fixturesRoot,
    );
    expect(pack).toContain("<!-- skill: project-brief -->");
    expect(pack).toContain("<!-- skill: session-end -->");
    expect(pack).toContain("\n\n---\n\n");
    expect(pack).toContain("test skill for the project brief");
    expect(pack).toContain("session wrap-up");
  });

  it("throws when a requested skill is missing from the registry", async () => {
    await expect(
      resolveSkillPack(["project-brief", "ghost-skill"], fixturesRoot),
    ).rejects.toThrow(/ghost-skill.*not found in registry/);
  });

  it("includes workflow content for multi-step skills", async () => {
    // Create a multi-step skill with a workflow.md
    const msDir = join(
      fixturesRoot,
      "skills/human/multi-step-test",
    );
    await mkdir(msDir, { recursive: true });
    await writeFile(
      join(msDir, "SKILL.md"),
      "---\nname: multi-step-test\ntype: human\n---\nSkill body here.",
    );
    await writeFile(
      join(msDir, "workflow.md"),
      "# Workflow\nStep 1: prepare\nStep 2: execute",
    );

    try {
      const pack = await resolveSkillPack(
        ["multi-step-test"],
        fixturesRoot,
      );
      expect(pack).toContain("<!-- skill: multi-step-test:workflow -->");
      expect(pack).toContain("Step 1: prepare");
      expect(pack).toContain("<!-- skill: multi-step-test -->");
      expect(pack).toContain("Skill body here.");
    } finally {
      const { rm } = await import("fs/promises");
      await rm(msDir, { recursive: true });
    }
  });
});

describe("validateChains", () => {
  it("returns ok: true when artifact directories exist and no broken calls", async () => {
    // Create all required artifact dirs
    for (const rel of [
      "artifacts/handoffs",
      "artifacts/briefing-packs",
      "artifacts/session",
    ]) {
      await mkdir(join(fixturesRoot, rel), { recursive: true });
    }

    const result = await validateChains(fixturesRoot);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports missing artifact directories as errors", async () => {
    const emptyRoot = join(fixturesRoot, "__empty_validate_test__");
    await mkdir(join(emptyRoot, "skills/human/validate-test"), {
      recursive: true,
    });
    await writeFile(
      join(emptyRoot, "skills/human/validate-test/SKILL.md"),
      "---\nname: validate-test\ntype: human\nstatus: active\n---\nTest",
    );

    try {
      const result = await validateChains(emptyRoot);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain(
        "Required artifact directory missing",
      );
    } finally {
      const { rm } = await import("fs/promises");
      await rm(emptyRoot, { recursive: true, force: true });
    }
  });

  it("reports broken skill call chains", async () => {
    const chainRoot = join(fixturesRoot, "__chain_test__");
    await mkdir(join(chainRoot, "skills/human/broken-chain"), {
      recursive: true,
    });
    // Skill calls a non-existent skill
    await writeFile(
      join(chainRoot, "skills/human/broken-chain/SKILL.md"),
      "---\nname: broken-chain\ntype: human\nstatus: active\ncalls: ghost-skill\n---\nTest",
    );
    // Create required artifact dirs
    for (const rel of [
      "artifacts/handoffs",
      "artifacts/briefing-packs",
      "artifacts/session",
    ]) {
      await mkdir(join(chainRoot, rel), { recursive: true });
    }

    try {
      const result = await validateChains(chainRoot);
      expect(result.ok).toBe(false);
      expect(result.errors.join("\n")).toContain(
        'calls skill "ghost-skill" not found in registry',
      );
    } finally {
      const { rm } = await import("fs/promises");
      await rm(chainRoot, { recursive: true, force: true });
    }
  });

  it("reports calls to stub skills as errors", async () => {
    const stubRoot = join(fixturesRoot, "__stub_chain_test__");
    await mkdir(join(stubRoot, "skills/human/caller"), { recursive: true });
    await mkdir(join(stubRoot, "skills/human/stub-target"), {
      recursive: true,
    });
    await writeFile(
      join(stubRoot, "skills/human/caller/SKILL.md"),
      "---\nname: caller\ntype: human\nstatus: active\ncalls: stub-target\n---\nTest",
    );
    await writeFile(
      join(stubRoot, "skills/human/stub-target/SKILL.md"),
      "---\nname: stub-target\ntype: human\nstatus: stub\n---\nStub",
    );
    for (const rel of [
      "artifacts/handoffs",
      "artifacts/briefing-packs",
      "artifacts/session",
    ]) {
      await mkdir(join(stubRoot, rel), { recursive: true });
    }

    try {
      const result = await validateChains(stubRoot);
      expect(result.ok).toBe(false);
      expect(result.errors.join("\n")).toContain(
        'calls skill "stub-target" which is a stub',
      );
    } finally {
      const { rm } = await import("fs/promises");
      await rm(stubRoot, { recursive: true, force: true });
    }
  });
});

describe("Token counting", () => {
  it("correctly counts tokens using 3.75 chars per token heuristic", () => {
    expect(countTokens("")).toBe(0);
    expect(countTokens("hello")).toBe(2); // 5 / 3.75 = 1.33 -> ceil = 2
    expect(countTokens("a".repeat(375))).toBe(100); // exactly 100 tokens
    expect(countTokens("a".repeat(376))).toBe(101);
  });

  it("correctly counts tokens for typical skill content", () => {
    const content = "# Test\n\nThis is a test skill body.\n";
    const tokens = countTokens(content);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBe(Math.ceil(content.length / 3.75));
  });
});
