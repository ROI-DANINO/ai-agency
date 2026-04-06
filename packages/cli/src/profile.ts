import { readFile } from "fs/promises";
import matter from "gray-matter";

export interface AgentProfile {
  name: string;
  slug: string;
  rank: "admin" | "operator" | "lead" | "agent";
  vibe: string;
  emoji: string;
  model_tier: number;
  skill_pack: string[];
  mesh_read: string[];
  mesh_write: string[];
  specialty?: string;
  domain?: string;
  body: string;
}

export async function readProfile(filePath: string): Promise<AgentProfile> {
  const raw = await readFile(filePath, "utf-8");
  const parsed = matter(raw);

  const fm = parsed.data as Record<string, unknown>;

  return {
    name: String(fm["name"] ?? ""),
    slug: String(fm["slug"] ?? ""),
    rank: fm["rank"] as AgentProfile["rank"],
    vibe: String(fm["vibe"] ?? ""),
    emoji: String(fm["emoji"] ?? ""),
    model_tier: Number(fm["model_tier"] ?? 2),
    skill_pack: Array.isArray(fm["skill_pack"]) ? (fm["skill_pack"] as string[]) : [],
    mesh_read: Array.isArray(fm["mesh_read"]) ? (fm["mesh_read"] as string[]) : [],
    mesh_write: Array.isArray(fm["mesh_write"]) ? (fm["mesh_write"] as string[]) : [],
    specialty: fm["specialty"] !== undefined ? String(fm["specialty"]) : undefined,
    domain: fm["domain"] !== undefined ? String(fm["domain"]) : undefined,
    body: parsed.content,
  };
}

export function profilePath(slug: string, repoRoot: string): string {
  return `${repoRoot}/agents/${slug}.md`;
}
