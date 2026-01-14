import { existsSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import { dirname, join, resolve, sep, basename } from "path";

export interface TownConfig {
  name?: string;
  owner?: {
    name?: string;
    email?: string;
    username?: string;
  };
}

export interface RigsConfig {
  rigs?: Record<string, unknown>;
}

export interface BeadsDirInfo {
  path: string;
  rig: string | null;
  workDir: string;
}

let cachedTownRoot: string | null = null;

function isInWorktreePath(pathValue: string): boolean {
  return pathValue.includes(`${sep}polecats${sep}`) || pathValue.includes(`${sep}crew${sep}`);
}

function findTownRoot(startDir: string): string | null {
  const absDir = resolve(startDir);
  const inWorktree = isInWorktreePath(absDir);
  let primaryMatch: string | null = null;
  let secondaryMatch: string | null = null;

  let current = absDir;
  for (;;) {
    const primaryMarker = join(current, "mayor", "town.json");
    if (existsSync(primaryMarker)) {
      if (!inWorktree) return current;
      primaryMatch = current;
    }

    if (!secondaryMatch) {
      const secondaryMarker = join(current, "mayor");
      if (existsSync(secondaryMarker)) {
        secondaryMatch = current;
      }
    }

    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return primaryMatch ?? secondaryMatch;
}

export function resolveTownRoot(): string {
  if (cachedTownRoot) return cachedTownRoot;

  const envRoot = process.env["GT_TOWN_ROOT"];
  if (envRoot) {
    cachedTownRoot = envRoot;
    return envRoot;
  }

  const detected = findTownRoot(process.cwd());
  if (!detected) {
    throw new Error(
      "Could not determine gastown town root. Set GT_TOWN_ROOT or run from within a town."
    );
  }

  cachedTownRoot = detected;
  return detected;
}

export async function loadTownConfig(townRoot: string): Promise<TownConfig> {
  const townPath = join(townRoot, "mayor", "town.json");
  try {
    const raw = await readFile(townPath, "utf8");
    return JSON.parse(raw) as TownConfig;
  } catch {
    return { name: undefined };
  }
}

export async function loadRigsConfig(townRoot: string): Promise<RigsConfig> {
  const rigsPath = join(townRoot, "mayor", "rigs.json");
  try {
    const raw = await readFile(rigsPath, "utf8");
    return JSON.parse(raw) as RigsConfig;
  } catch {
    return { rigs: {} };
  }
}

export async function listRigNames(townRoot: string): Promise<string[]> {
  const rigsConfig = await loadRigsConfig(townRoot);
  return Object.keys(rigsConfig.rigs ?? {});
}

/**
 * Returns a beads directory path for a given workspace directory,
 * following redirects if present.
 */
export function resolveBeadsDir(workDir: string): string {
  const beadsDir = join(workDir, ".beads");
  const redirectPath = join(beadsDir, "redirect");
  if (!existsSync(redirectPath)) return beadsDir;
  
  try {
    const target = readFileSync(redirectPath, "utf8").trim();
    if (!target) return beadsDir;
    return resolve(workDir, target);
  } catch {
    return beadsDir;
  }
}

export async function listAllBeadsDirs(): Promise<BeadsDirInfo[]> {
  const townRoot = resolveTownRoot();
  const results: BeadsDirInfo[] = [];
  const scannedPaths = new Set<string>();

  const addDir = (workDir: string, rig: string | null) => {
    const absPath = resolve(workDir);
    if (scannedPaths.has(absPath)) return;
    if (existsSync(join(absPath, ".beads"))) {
      results.push({
        path: resolveBeadsDir(absPath),
        rig,
        workDir: absPath
      });
      scannedPaths.add(absPath);
    }
  };

  // 1. Town root
  addDir(townRoot, null);

  // 1b. Common location: ~/gt
  const homeGt = join(process.env["HOME"] || "", "gt");
  if (homeGt) {
    addDir(homeGt, null);
  }

  // 2. Configured rigs
  const rigNames = await listRigNames(townRoot);
  for (const rigName of rigNames) {
    addDir(join(townRoot, rigName), rigName);
  }

  // 3. Extra rigs from env
  const extraRigs = process.env["GT_EXTRA_RIGS"];
  if (extraRigs) {
    const paths = extraRigs.split(",").map(p => p.trim()).filter(Boolean);
    for (const p of paths) {
      const rigPath = resolve(process.cwd(), p);
      addDir(rigPath, basename(rigPath));
    }
  }

  // 4. Heuristic search up from CWD
  let current = process.cwd();
  while (true) {
    addDir(current, scannedPaths.has(resolve(current)) ? null : basename(current));
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return results;
}
