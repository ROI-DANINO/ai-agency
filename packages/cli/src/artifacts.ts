import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join, resolve } from "path";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ArtifactType =
  | "briefing-pack"
  | "handoff"
  | "decision-report"
  | "session-artifact";

export type ArtifactStatus = "written" | "draft";

/** Shared frontmatter present on every artifact. */
export interface ArtifactFrontmatter {
  status: ArtifactStatus;
  created_at: string; // ISO-8601
  agent?: string;
}

/** 1. Briefing Pack — sent from Orchestrator / Lead to an agent before a task. */
export interface BriefingPack {
  /** YYYY-MM-DD */
  date: string;
  agent: string;
  task: string; // task id
  role: string;
  taskDescription: string; // scope + expected output
  context: string;
  keyReferences: { path: string; reason: string }[];
  teamState: string;
  predecessorHandoffs: string; // "None — first task" or linked handoff paths
  constraints: { tokenBudget?: string; toolsAvailable?: string; deadline?: string };
  status?: ArtifactStatus;
}

/** 2. Handoff — written by one agent, read by the next in a chain. */
export interface Handoff {
  /** YYYY-MM-DD */
  date: string;
  from: string;
  to: string;
  task: string; // task id
  completed: string[];
  remaining: string[];
  openQuestions: string[];
  context: string;
  firstAction: string;
  status?: ArtifactStatus;
}

/** 3. Decision Report — surfaces a HITL question for human approval. */
export interface DecisionReport {
  /** YYYY-MM-DD */
  date: string;
  requires: string; // e.g. "human approval"
  blocks: string; // what is blocked
  deadline: "urgent" | "non-blocking" | string;
  theDecision: string; // one-sentence question
  context: string;
  options: {
    label: string; // "A", "B", ...
    name: string;
    description: string;
    tradeoffs: string;
  }[];
  recommendation: string;
  impact: string;
  status?: ArtifactStatus;
}

/** 4. Session Artifact — captures summary of an agent session. */
export interface SessionArtifact {
  /** YYYY-MM-DD */
  date: string;
  agent: string;
  session: string;
  summary: string;
  changes: string[];
  openQuestions: string[];
  nextSession?: string;
  status?: ArtifactStatus;
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

/** Directory mapping keyed by artifact type. */
const DIR_MAP: Record<ArtifactType, string> = {
  "briefing-pack": "briefing-packs",
  handoff: "handoffs",
  "decision-report": "decision-reports",
  "session-artifact": "session",
};

/** Build a safe slug segment from any string (lowercase, kebab-case). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build YYYY-MM-DD from a Date or string. */
function dateStr(d?: string): string {
  const dt = d ? new Date(d) : new Date();
  return dt.toISOString().slice(0, 10);
}

/** Current ISO-8601 timestamp. */
function isoNow(): string {
  return new Date().toISOString();
}

/** Ensure a directory exists (recursive). */
async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

/** Generate the frontmatter block as a YAML string. */
function buildFrontmatter(fm: ArtifactFrontmatter): string {
  return `---
status: ${fm.status}
created_at: ${fm.created_at}
${fm.agent ? `agent: ${fm.agent}` : ""}
---`;
}

/** Resolve the repo-local artifacts root. */
function artifactRoot(repoRoot: string): string {
  return resolve(repoRoot, "artifacts");
}

/** Resolve the subdirectory for a given artifact type. */
function typeDir(type: ArtifactType, repoRoot: string): string {
  return join(artifactRoot(repoRoot), DIR_MAP[type]);
}

// ──────────────────────────────────────────────
// Renderers — turn typed artifact into markdown
// ──────────────────────────────────────────────

function renderBriefingPack(a: BriefingPack): { body: string; filename: string } {
  const date = dateStr(a.date);
  const body = [
    `# Briefing Pack — ${a.agent} / ${a.task}`,
    `Date: ${date}`,
    `Agent: ${a.agent}`,
    `Task: ${a.task}`,
    `Role: ${a.role}`,
    ``,
    `## Task`,
    a.taskDescription,
    ``,
    `## Context`,
    a.context,
    ``,
    `## Key References`,
    a.keyReferences.length > 0
      ? a.keyReferences.map((r) => `- \`${r.path}\`: ${r.reason}`).join("\n")
      : "None.",
    ``,
    `## Team State`,
    a.teamState,
    ``,
    `## Predecessor Handoffs`,
    a.predecessorHandoffs,
    ``,
    `## Constraints`,
    `- Token budget: ${a.constraints.tokenBudget ?? "N/A"}`,
    `- Tools available: ${a.constraints.toolsAvailable ?? "N/A"}`,
    `- Deadline: ${a.constraints.deadline ?? "N/A"}`,
    ``,
  ].join("\n");

  const filename = `${date}-${slugify(a.agent)}-${slugify(a.task)}.md`;
  return { body, filename };
}

function renderHandoff(a: Handoff): { body: string; filename: string } {
  const date = dateStr(a.date);
  const body = [
    `# Handoff — ${a.from} → ${a.to}`,
    `Date: ${date}`,
    `From: ${a.from}`,
    `To: ${a.to}`,
    `Task: ${a.task}`,
    ``,
    `## Completed`,
    a.completed.length > 0 ? a.completed.map((c) => `- ${c}`).join("\n") : "None.",
    ``,
    `## Remaining`,
    a.remaining.length > 0 ? a.remaining.map((c) => `- ${c}`).join("\n") : "None.",
    ``,
    `## Open Questions`,
    a.openQuestions.length > 0
      ? a.openQuestions.map((q) => `- ${q}`).join("\n")
      : "None.",
    ``,
    `## Context`,
    a.context,
    ``,
    `## First Action`,
    a.firstAction,
    ``,
  ].join("\n");

  const filename = `${date}-${slugify(a.from)}-to-${slugify(a.to)}-${slugify(a.task)}.md`;
  return { body, filename };
}

function renderDecisionReport(a: DecisionReport): { body: string; filename: string } {
  const date = dateStr(a.date);
  const optionsBlock = a.options
    .map(
      (o) =>
        `### Option ${o.label}: ${o.name}\n${o.description}\n**Tradeoffs:** ${o.tradeoffs}`,
    )
    .join("\n\n");

  const slug = slugify(a.theDecision.slice(0, 60));
  const body = [
    `# Decision Report — ${a.blocks} / ${a.theDecision}`,
    `Date: ${date}`,
    `Requires: ${a.requires}`,
    `Blocks: ${a.blocks}`,
    `Deadline: ${a.deadline}`,
    ``,
    `## The Decision`,
    a.theDecision,
    ``,
    `## Context`,
    a.context,
    ``,
    `## Options`,
    ``,
    optionsBlock,
    ``,
    `## Recommendation`,
    a.recommendation,
    ``,
    `## Impact`,
    a.impact,
    ``,
  ].join("\n");

  // Use first option's feature or blocks segment for the date prefix slug
  const feature = slugify(a.blocks.split("/")[0] ?? a.blocks);
  const filename = `${date}-${feature}-${slug}.md`;
  return { body, filename };
}

function renderSessionArtifact(a: SessionArtifact): { body: string; filename: string } {
  const date = dateStr(a.date);
  const body = [
    `# Session Artifact — ${a.agent} / ${a.session}`,
    `Date: ${date}`,
    `Agent: ${a.agent}`,
    `Session: ${a.session}`,
    ``,
    `## Summary`,
    a.summary,
    ``,
    `## Changes`,
    a.changes.length > 0 ? a.changes.map((c) => `- ${c}`).join("\n") : "None.",
    ``,
    `## Open Questions`,
    a.openQuestions.length > 0
      ? a.openQuestions.map((q) => `- ${q}`).join("\n")
      : "None.",
    ``,
    `## Next Session`,
    a.nextSession ?? "Not yet determined.",
    ``,
  ].join("\n");

  const slug = slugify(a.session);
  const filename = `${date}-${slug}.md`;
  return { body, filename };
}

// ──────────────────────────────────────────────
// Public write functions
// ──────────────────────────────────────────────

export async function writeBriefingPack(
  artifact: BriefingPack,
  repoRoot: string,
): Promise<string> {
  const dir = typeDir("briefing-pack", repoRoot);
  await ensureDir(dir);
  const { body, filename } = renderBriefingPack(artifact);
  const fm = buildFrontmatter({
    status: artifact.status ?? "written",
    created_at: isoNow(),
    agent: artifact.agent,
  });
  const content = `${fm}\n\n${body}`;
  const filePath = join(dir, filename);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function writeHandoff(
  artifact: Handoff,
  repoRoot: string,
): Promise<string> {
  const dir = typeDir("handoff", repoRoot);
  await ensureDir(dir);
  const { body, filename } = renderHandoff(artifact);
  const fm = buildFrontmatter({
    status: artifact.status ?? "written",
    created_at: isoNow(),
    agent: artifact.from,
  });
  const content = `${fm}\n\n${body}`;
  const filePath = join(dir, filename);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function writeDecisionReport(
  artifact: DecisionReport,
  repoRoot: string,
): Promise<string> {
  const dir = typeDir("decision-report", repoRoot);
  await ensureDir(dir);
  const { body, filename } = renderDecisionReport(artifact);
  const fm = buildFrontmatter({
    status: artifact.status ?? "written",
    created_at: isoNow(),
  });
  const content = `${fm}\n\n${body}`;
  const filePath = join(dir, filename);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

export async function writeSessionArtifact(
  artifact: SessionArtifact,
  repoRoot: string,
): Promise<string> {
  const dir = typeDir("session-artifact", repoRoot);
  await ensureDir(dir);
  const { body, filename } = renderSessionArtifact(artifact);
  const fm = buildFrontmatter({
    status: artifact.status ?? "written",
    created_at: isoNow(),
    agent: artifact.agent,
  });
  const content = `${fm}\n\n${body}`;
  const filePath = join(dir, filename);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

// ──────────────────────────────────────────────
// Read / Validate / List
// ──────────────────────────────────────────────

/** Read an artifact file and return its raw content (frontmatter + body). */
export async function readArtifact(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

/**
 * Validate an artifact object against a specific type's required fields.
 * Returns { valid, errors } — errors is empty when valid.
 */
export function validateArtifact(
  artifact: unknown,
  type: ArtifactType,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!artifact || typeof artifact !== "object") {
    return { valid: false, errors: ["Artifact must be an object"] };
  }

  const obj = artifact as Record<string, unknown>;

  switch (type) {
    case "briefing-pack": {
      const bp = obj as Partial<BriefingPack>;
      if (!bp.date) errors.push("Missing field: date");
      if (!bp.agent) errors.push("Missing field: agent");
      if (!bp.task) errors.push("Missing field: task");
      if (!bp.role) errors.push("Missing field: role");
      if (!bp.taskDescription) errors.push("Missing field: taskDescription");
      if (!bp.context) errors.push("Missing field: context");
      if (!Array.isArray(bp.keyReferences))
        errors.push("Missing field: keyReferences (must be array)");
      if (!bp.teamState) errors.push("Missing field: teamState");
      if (bp.predecessorHandoffs === undefined)
        errors.push("Missing field: predecessorHandoffs");
      if (!bp.constraints || typeof bp.constraints !== "object")
        errors.push("Missing field: constraints");
      break;
    }

    case "handoff": {
      const h = obj as Partial<Handoff>;
      if (!h.date) errors.push("Missing field: date");
      if (!h.from) errors.push("Missing field: from");
      if (!h.to) errors.push("Missing field: to");
      if (!h.task) errors.push("Missing field: task");
      if (!Array.isArray(h.completed))
        errors.push("Missing field: completed (must be array)");
      if (!Array.isArray(h.remaining))
        errors.push("Missing field: remaining (must be array)");
      if (!Array.isArray(h.openQuestions))
        errors.push("Missing field: openQuestions (must be array)");
      if (!h.context) errors.push("Missing field: context");
      if (!h.firstAction) errors.push("Missing field: firstAction");
      break;
    }

    case "decision-report": {
      const dr = obj as Partial<DecisionReport>;
      if (!dr.date) errors.push("Missing field: date");
      if (!dr.requires) errors.push("Missing field: requires");
      if (!dr.blocks) errors.push("Missing field: blocks");
      if (!dr.deadline) errors.push("Missing field: deadline");
      if (!dr.theDecision) errors.push("Missing field: theDecision");
      if (!dr.context) errors.push("Missing field: context");
      if (!Array.isArray(dr.options))
        errors.push("Missing field: options (must be array)");
      if (!dr.recommendation) errors.push("Missing field: recommendation");
      if (!dr.impact) errors.push("Missing field: impact");
      break;
    }

    case "session-artifact": {
      const sa = obj as Partial<SessionArtifact>;
      if (!sa.date) errors.push("Missing field: date");
      if (!sa.agent) errors.push("Missing field: agent");
      if (!sa.session) errors.push("Missing field: session");
      if (!sa.summary) errors.push("Missing field: summary");
      if (!Array.isArray(sa.changes))
        errors.push("Missing field: changes (must be array)");
      if (!Array.isArray(sa.openQuestions))
        errors.push("Missing field: openQuestions (must be array)");
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * List existing artifacts on disk.
 * If `type` is provided, only that subdirectory is scanned.
 * If `type` is omitted, all artifact subdirectories are scanned.
 * Returns absolute file paths.
 */
export async function listArtifacts(
  type?: ArtifactType,
  repoRoot?: string,
): Promise<string[]> {
  // If no repoRoot provided, default to cwd/artifacts
  let base = repoRoot ? artifactRoot(repoRoot) : resolve(process.cwd(), "artifacts");

  const dirNames = type ? [DIR_MAP[type]] : Object.values(DIR_MAP);
  const results: string[] = [];

  for (const dirName of dirNames) {
    const dirPath = join(base, dirName);
    try {
      const exists = await stat(dirPath).then(() => true).catch(() => false);
      if (!exists) continue;
      const entries = await readdir(dirPath);
      for (const entry of entries) {
        if (entry === ".gitkeep") continue; // skip gitkeep markers
        if (!entry.endsWith(".md")) continue;
        results.push(join(dirPath, entry));
      }
    } catch {
      // Directory doesn't exist or isn't readable — skip silently
      continue;
    }
  }

  return results.sort();
}
