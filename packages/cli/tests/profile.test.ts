import { describe, it, expect } from "vitest";
import { readProfile } from "../src/profile.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixturePath = resolve(__dirname, "../fixtures/dev-lead.md");

describe("readProfile", () => {
  it("parses frontmatter fields", async () => {
    const profile = await readProfile(fixturePath);
    expect(profile.name).toBe("Dev Lead");
    expect(profile.slug).toBe("dev-lead");
    expect(profile.rank).toBe("lead");
    expect(profile.domain).toBe("dev");
    expect(profile.model_tier).toBe(2);
    expect(profile.emoji).toBe("🔧");
  });

  it("parses arrays correctly", async () => {
    const profile = await readProfile(fixturePath);
    expect(Array.isArray(profile.mesh_read)).toBe(true);
    expect(profile.mesh_read).toEqual(["lead"]);
    expect(profile.mesh_write).toEqual(["lead"]);
    expect(profile.skill_pack).toEqual([]);
  });

  it("captures the markdown body", async () => {
    const profile = await readProfile(fixturePath);
    expect(profile.body).toContain("## Identity");
    expect(profile.body).toContain("## Mission");
    expect(profile.body).toContain("## Critical Rules");
  });

  it("throws on missing file", async () => {
    await expect(readProfile("/nonexistent/path.md")).rejects.toThrow();
  });
});

describe("readProfile — protected field", () => {
  const recruitmentFixture = resolve(__dirname, "../fixtures/recruitment-lead.md");

  it("parses protected: true from frontmatter", async () => {
    const profile = await readProfile(recruitmentFixture);
    expect(profile.protected).toBe(true);
    expect(profile.spawnedBy).toBeUndefined();
    expect(profile.scope).toBeUndefined();
  });

  it("defaults protected to false when field is absent", async () => {
    const profile = await readProfile(fixturePath); // dev-lead.md
    expect(profile.protected).toBe(false);
  });
});

describe("readProfile — spawned_by and scope fields", () => {
  const developerFixture = resolve(__dirname, "../fixtures/developer.md");

  it("parses spawned_by and scope from sub-agent frontmatter", async () => {
    const profile = await readProfile(developerFixture);
    expect(profile.spawnedBy).toBe("dev-lead");
    expect(profile.scope).toBe("task");
    expect(profile.protected).toBe(false);
  });

  it("returns undefined scope and spawned_by for leads without those fields", async () => {
    const profile = await readProfile(fixturePath); // dev-lead.md
    expect(profile.spawnedBy).toBeUndefined();
    expect(profile.scope).toBeUndefined();
  });
});
