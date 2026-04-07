import { readFile, access } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

// ─── Constants ────────────────────────────────────────────────────────────────

const SOFT_TOKEN_LIMIT = 2000;
const HARD_TOKEN_LIMIT = 3000;
const SOFT_CHAR_LIMIT = SOFT_TOKEN_LIMIT * 3.75; // ~7500
const HARD_CHAR_LIMIT = HARD_TOKEN_LIMIT * 3.75; // ~11250

const SKILL_DIR_HUMAN = "skills/human";
const SKILL_DIR_AGENT = "skills/agent";
const ARTIFACT_DIRS = ["artifacts/handoffs", "artifacts/briefing-packs", "artifacts/session"] as const;

const MULTI_STEP_FILES = ["workflow.md", "workflow.yml"];
const MULTI_STEP_DIR = "steps";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SkillFrontmatter {
  name: string;
  description?: string | undefined;
  type: "human" | "agent";
  "user-invocable"?: boolean;
  calls?: string | undefined;
  status?: "active" | "stub";
}

export interface SkillEntry {
  name: string;
  type: "human" | "agent";
  status: "active" | "stub";
  path: string;
  frontmatter: SkillFrontmatter;
  content: string;
  tokenCount: number;
}

export interface ChainValidationResult {
  ok: boolean;
  errors: string[];
}

export interface MultiStepSkillInfo {
  hasWorkflow: boolean;
  workflowPath: string | null;
  workflowContent: string | null;
  stepsDir: string | null;
  stepFiles: string[];
}

interface SkillsMapEntry {
  name: string;
  path: string;
  triggers?: string;
  description?: string;
  status: "active" | "stub";
  section: "human" | "agent" | "archive";
}

// ─── Public: resolveSkillPath ─────────────────────────────────────────────────

/**
 * Resolve a skill://name URI into an absolute file path to SKILL.md.
 * Checks skills/human/ first (by convention — human skills are the default),
 * then skills/agent/ as fallback.
 */
export async function resolveSkillPath(skillName: string, repoRoot: string): Promise<string> {
  // Try human skills first
  const humanPath = join(repoRoot, SKILL_DIR_HUMAN, skillName, "SKILL.md");
  try {
    await access(humanPath);
    return humanPath;
  } catch {
    // Try agent skills
    const agentPath = join(repoRoot, SKILL_DIR_AGENT, skillName, "SKILL.md");
    try {
      await access(agentPath);
      return agentPath;
    } catch {
      throw new Error(
        `Skill "${skillName}" not found. Checked:\n  - ${humanPath}\n  - ${agentPath}`
      );
    }
  }
}

// ─── Public: getSkillRegistry ─────────────────────────────────────────────────

/**
 * Parse skills-map.md and SKILL.md files on disk to build the full skill registry.
 * Cross-references the skills-map table with actual files on disk.
 */
export async function getSkillRegistry(repoRoot: string): Promise<SkillEntry[]> {
  const registry: SkillEntry[] = [];
  const seenNames = new Set<string>();

  // Discover all SKILL.md files on disk
  const skillDirs = await discoverSkillDirs(repoRoot);

  for (const { name, skillType, filePath } of skillDirs) {
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const raw = await readFile(filePath, "utf-8");
    const parsed = matter(raw);
    const fm = parsed.data as Record<string, unknown>;

    const fmName = String(fm["name"] ?? name);
    const fmType = fm["type"] === "agent" ? ("agent" as const) : ("human" as const);
    const fmStatus = fm["status"] === "stub" ? ("stub" as const) : ("active" as const);

    const frontmatter: SkillFrontmatter = {
      name: fmName,
      type: fmType,
      status: fmStatus,
    };

    if (fm["description"] !== undefined) {
      frontmatter.description = String(fm["description"]);
    }
    if (fm["user-invocable"] !== undefined) {
      frontmatter["user-invocable"] = fm["user-invocable"] === true;
    }
    if (fm["calls"] !== undefined) {
      frontmatter.calls = String(fm["calls"]);
    }

    const entry: SkillEntry = {
      name: fmName.trim(),
      type: fmType,
      status: fmStatus,
      path: filePath,
      frontmatter,
      content: parsed.content,
      tokenCount: countTokens(parsed.content),
    };

    registry.push(entry);
  }

  return registry.sort(byTypePriority);
}

// ─── Public: resolveSkillPack ─────────────────────────────────────────────────

/**
 * Resolve an array of skill names into a concatenated system prompt string.
 * Enforces token budgets: warns above soft limit, throws above hard limit.
 */
export async function resolveSkillPack(skillNames: string[], repoRoot: string): Promise<string> {
  const registry = await getSkillRegistry(repoRoot);
  const resolved: SkillEntry[] = [];

  for (const name of skillNames) {
    const entry = registry.find((e) => e.name === name) ?? null;

    if (!entry) {
      throw new Error(
        `Skill "${name}" requested in skill pack but not found in registry. ` +
          `Available skills: ${registry.map((e) => e.name).join(", ")}`
      );
    }

    // Check if this is a multi-step skill
    const skillDir = entry.path.replace(/\/SKILL\.md$/, "");
    const multiStep = await detectMultiStep(skillDir);
    if (multiStep.hasWorkflow && multiStep.workflowContent) {
      // Prepend workflow context to the skill
      const workflowEntry: SkillEntry = {
        ...entry,
        name: `${entry.name}:workflow`,
        content: multiStep.workflowContent,
        tokenCount: countTokens(multiStep.workflowContent),
        path: multiStep.workflowPath ?? entry.path,
      };
      resolved.push(workflowEntry);
    }

    resolved.push(entry);
  }

  // Concatenate all skill contents
  const sections = resolved.map(
    (entry) => `<!-- skill: ${entry.name} -->\n${entry.content}`
  );
  const combined = sections.join("\n\n---\n\n");
  const totalTokens = resolved.reduce((sum, e) => sum + e.tokenCount, 0);

  // Enforce token budget
  if (totalTokens > HARD_TOKEN_LIMIT) {
    throw new TokenBudgetError(
      `Skill pack resolved to ${totalTokens} tokens (hard limit: ${HARD_TOKEN_LIMIT}). ` +
        `Remove skills or reduce content.`,
      totalTokens,
      HARD_TOKEN_LIMIT
    );
  } else if (totalTokens > SOFT_TOKEN_LIMIT) {
    // Log a warning for soft limit — return with a banner
    const banner =
      `<!-- TOKEN WARNING: ${totalTokens}/${HARD_TOKEN_LIMIT} tokens. ` +
      `Exceeds soft limit of ${SOFT_TOKEN_LIMIT}. Consider removing skills. -->\n\n`;
    return banner + combined;
  }

  return combined;
}

// ─── Public: validateChains ───────────────────────────────────────────────────

/**
 * Validate artifact chain dependencies across all skills.
 * If a skill writes to an artifact path, verify the target directory exists.
 * If a skill reads from an artifact path, flag it (missing artifacts are not
 * errors at build time, only at runtime).
 */
export async function validateChains(repoRoot: string): Promise<ChainValidationResult> {
  const registry = await getSkillRegistry(repoRoot);
  const errors: string[] = [];

  for (const skill of registry) {
    // Check that artifact directories exist
    for (const relDir of ARTIFACT_DIRS) {
      const dirPath = join(repoRoot, relDir);
      try {
        await access(dirPath);
      } catch {
        errors.push(
          `[${skill.name}] Required artifact directory missing: ${relDir}/`
        );
      }
    }

    // Check calls: field — referenced skills must exist in the registry
    if (skill.frontmatter.calls) {
      const calls = skill.frontmatter.calls.split(",").map((s) => s.trim());
      for (const calledSkill of calls) {
        const found = registry.find((e) => e.name === calledSkill);
        if (!found) {
          errors.push(
            `[${skill.name}] calls skill "${calledSkill}" not found in registry`
          );
        } else if (found.status === "stub") {
          errors.push(
            `[${skill.name}] calls skill "${calledSkill}" which is a stub`
          );
        }
      }
    }

    // Check artifact references in skill content
    for (const match of findArtifactRefs(skill.content)) {
      const artifactPath = join(repoRoot, match.path);
      try {
        await access(artifactPath);
      } catch {
        // Artifact doesn't exist yet — this is only a warning for runtime
        // Don't add to errors. Artifact creation is a runtime concern.
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// ─── Public: detectMultiStep ──────────────────────────────────────────────────

/**
 * Detect if a skill directory has a multi-step workflow structure
 * (workflow.md or steps/ directory with ordered step files).
 */
export async function detectMultiStep(skillDir: string): Promise<MultiStepSkillInfo> {
  let hasWorkflow = false;
  let workflowPath: string | null = null;
  let workflowContent: string | null = null;

  // Check for workflow files
  for (const wfFile of MULTI_STEP_FILES) {
    const wfPath = join(skillDir, wfFile);
    try {
      workflowContent = await readFile(wfPath, "utf-8");
      workflowPath = wfPath;
      hasWorkflow = true;
      break;
    } catch {
      // Not present, try next pattern
    }
  }

  // Check for steps directory
  let stepsDir: string | null = null;
  let stepFiles: string[] = [];
  const stepsPath = join(skillDir, MULTI_STEP_DIR);
  try {
    await access(stepsPath);
    stepsDir = stepsPath;
    stepFiles = await listOrderedSteps(stepsPath);
  } catch {
    // No steps directory
  }

  return { hasWorkflow, workflowPath, workflowContent, stepsDir, stepFiles };
}

// ─── Token Budget ─────────────────────────────────────────────────────────────

export class TokenBudgetError extends Error {
  constructor(
    message: string,
    public readonly tokenCount: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = "TokenBudgetError";
  }
}

/**
 * Approximate token count from character count (~3.75 chars per token for
 * typical LLM tokenizers). This is a heuristic — real tokenization is model-
 * specific.
 */
export function countTokens(text: string): number {
  return Math.ceil(text.length / 3.75);
}

export function enforceTokenBudget(
  content: string,
  skillName: string
): { content: string; tokenCount: number; warnings: string[] } {
  const tokenCount = countTokens(content);
  const warnings: string[] = [];

  if (tokenCount > HARD_TOKEN_LIMIT) {
    throw new TokenBudgetError(
      `Skill "${skillName}" content is ${tokenCount} tokens (hard limit: ${HARD_TOKEN_LIMIT})`,
      tokenCount,
      HARD_TOKEN_LIMIT
    );
  }

  if (tokenCount > SOFT_TOKEN_LIMIT) {
    warnings.push(
      `Skill "${skillName}" content is ${tokenCount} tokens, ` +
        `exceeding soft limit of ${SOFT_TOKEN_LIMIT}`
    );
  }

  return { content, tokenCount, warnings };
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

interface DiscoveredSkill {
  name: string;
  skillType: "human" | "agent";
  filePath: string;
}

/**
 * Walk skills/human/ and skills/agent/ directories to discover all SKILL.md files.
 */
async function discoverSkillDirs(repoRoot: string): Promise<DiscoveredSkill[]> {
  const results: DiscoveredSkill[] = [];
  const { readdir, stat } = await import("fs/promises");

  for (const { dir, type } of [
    { dir: join(repoRoot, SKILL_DIR_HUMAN), type: "human" as const },
    { dir: join(repoRoot, SKILL_DIR_AGENT), type: "agent" as const },
  ]) {
    try {
      const entries = await readdir(dir);
      for (const entry of entries.filter((e) => !e.startsWith("."))) {
        const skillPath = join(dir, entry);
        const s = await stat(skillPath);
        if (s.isDirectory()) {
          const skillMd = join(skillPath, "SKILL.md");
          try {
            await access(skillMd);
            results.push({ name: entry, skillType: type, filePath: skillMd });
          } catch {
            // No SKILL.md found — skip silently
          }
        }
      }
    } catch {
      // Directory doesn't exist — skip
    }
  }

  return results;
}

/**
 * Sort: human active > agent active > stub.
 * Ensures deterministic ordering for skill packs.
 */
function byTypePriority(a: SkillEntry, b: SkillEntry): number {
  const aWeight = (a.type === "human" ? 0 : 1) + (a.status === "stub" ? 2 : 0);
  const bWeight = (b.type === "human" ? 0 : 1) + (b.status === "stub" ? 2 : 0);
  return aWeight - bWeight || a.name.localeCompare(b.name);
}

/**
 * Find artifact path references in skill content.
 * Matches patterns like `artifacts/handoffs/`, `artifacts/briefing-packs/`,
 * `artifacts/session/`, and `artifacts/decision-reports/`.
 */
interface ArtifactRef {
  path: string;
  rawMatch: string;
}

function findArtifactRefs(content: string): ArtifactRef[] {
  const artifactPattern =
    /(?:^|[^\/])(artifacts\/(?:handoffs|briefing-packs|session|decision-reports)(?:\/[^\s"`)]*)?)/gm;
  const refs: ArtifactRef[] = [];
  let match: RegExpExecArray | null;

  while ((match = artifactPattern.exec(content)) !== null) {
    const capture = match[1];
    if (capture) {
      refs.push({ path: capture, rawMatch: match[0].trim() });
    }
  }

  return refs;
}

/**
 * List step files in numerical or alphabetical order.
 * Expects filenames like `01-prepare.md`, `02-execute.md` or similar
 * numeric/alphabetical ordering.
 */
async function listOrderedSteps(stepsDir: string): Promise<string[]> {
  const { readdir } = await import("fs/promises");
  try {
    const files = await readdir(stepsDir);
    return files
      .filter((f) => f.match(/^\d{1,4}-.*\.(md|yml|yaml)$/i))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^(\d{1,4})/)?.[0] ?? "9999", 10);
        const numB = parseInt(b.match(/^(\d{1,4})/)?.[0] ?? "9999", 10);
        return numA - numB;
      });
  } catch {
    return [];
  }
}
