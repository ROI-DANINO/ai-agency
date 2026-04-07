import { Command } from "commander";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getSkillRegistry, resolveSkillPack, resolveSkillPath, validateChains } from "../skills.js";
import { listArtifacts, readArtifact } from "../artifacts.js";

export function createSkillsCommand(): Command {
  const skillCmd = new Command("skills").description("Skills system");
  
  const REPO_ROOT = process.env["AI_ORG_ROOT"] ?? resolve(process.cwd());

  // skills list - list all registered skills with status
  skillCmd
    .command("list")
    .description("List all registered skills")
    .action(async () => {
      const skills = await getSkillRegistry(REPO_ROOT);
      console.log("Skill Registry");
      console.log("=".repeat(70));
      for (const s of skills) {
        const frontmatter = s.frontmatter as unknown as Record<string, unknown>;
        const status = String(frontmatter["status"] ?? "active");
        const type = String(frontmatter["type"] ?? "-");
        const desc = (String(frontmatter["description"] ?? "") || s.content.substring(0, 60)).replace(/\n/g, " ").substring(0, 80);
        console.log(`  ${s.name.padEnd(25)} type: ${type.padEnd(8)} status: ${status.padEnd(8)} ${desc}`);
      }
      console.log(`\n${skills.length} skills`);
    });

  // skills chain <skill-name> - show skill chain (next/calls/reads/output)
  skillCmd
    .command("chain <name>")
    .description("Show skill chain for a skill")
    .action(async (name: string) => {
      const skills = await getSkillRegistry(REPO_ROOT);
      const skill = skills.find(s => s.name === name);
      if (!skill) {
        console.error(`Skill not found: ${name}`);
        process.exit(1);
      }
      const fm = skill.frontmatter as unknown as Record<string, unknown>;
      console.log(`\nSkill: ${skill.name}`);
      console.log(`Type: ${fm["type"] ?? "-"}`);
      console.log(`Calls: ${JSON.stringify(fm["calls"] ?? [])}`);
      console.log(`Next: ${fm["next"] ?? "-"}`);
      console.log(`Reads: ${JSON.stringify(fm["reads"] ?? [])}`);
      console.log(`Output: ${fm["output"] ?? "-"}`);
    });

  // skills resolve <skill-names...> - resolve skills to full prompt
  skillCmd
    .command("resolve <names...>")
    .description("Resolve skill pack to full system prompt")
    .action(async (names: string[]) => {
      const prompt = await resolveSkillPack(names, REPO_ROOT);
      console.log(prompt);  
    });

  // skills artifacts [type] - list artifacts
  skillCmd
    .command("artifacts [type]")
    .description("List artifacts")
    .action(async (type?: string) => {
      const items = await listArtifacts(type as any, REPO_ROOT);
      if (items.length === 0) {
        console.log("No artifacts found");
      } else {
        console.log("Artifacts");
        console.log("=".repeat(60));
        for (const p of items) {
          console.log(`  ${p}`);
        }
        console.log(`\n${items.length} artifacts`);
      }
    });

  // skills scan - validate chains
  skillCmd
    .command("scan")
    .description("Validate skill chains and detect issues")
    .action(async () => {
      const result = await validateChains(REPO_ROOT);
      if (result.ok) {
        console.log("All skill chains valid.");
      } else {
        console.log("Chain validation errors:");
        for (const e of result.errors) {
          console.log(`  - ${e}`);
        }
        process.exit(1);
      }
    });

  return skillCmd;
}
