import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// We test listAllBeadsDirs by creating actual filesystem structures
// in a temp directory, since the function relies heavily on fs operations.

// Reset module cache between tests to clear cached town root
let gastown: typeof import("../../src/services/gastown-workspace.js");

describe("gastown-workspace", () => {
  let testRoot: string;
  let originalCwd: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testRoot = join(tmpdir(), `gt-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testRoot, { recursive: true });
    originalCwd = process.cwd();
    originalEnv = { ...process.env };

    // Reset module to clear cached town root
    vi.resetModules();
    gastown = await import("../../src/services/gastown-workspace.js");
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    try {
      rmSync(testRoot, { recursive: true, force: true });
    } catch {
      // cleanup best effort
    }
  });

  function createTown(root: string): void {
    mkdirSync(join(root, "mayor"), { recursive: true });
    writeFileSync(join(root, "mayor", "town.json"), JSON.stringify({ name: "test-town" }));
    writeFileSync(join(root, "mayor", "rigs.json"), JSON.stringify({ version: 1, rigs: {} }));
  }

  function createBeadsDir(dir: string, opts: { config?: boolean; issues?: boolean; redirect?: string } = {}): void {
    const beadsDir = join(dir, ".beads");
    mkdirSync(beadsDir, { recursive: true });
    if (opts.config !== false) {
      writeFileSync(join(beadsDir, "config.yaml"), "prefix: test\n");
    }
    if (opts.issues !== false) {
      writeFileSync(join(beadsDir, "issues.jsonl"), "");
    }
    if (opts.redirect) {
      writeFileSync(join(beadsDir, "redirect"), opts.redirect);
    }
  }

  describe("listAllBeadsDirs", () => {
    it("should not walk above the town root", async () => {
      // Create: testRoot/.beads (spurious) and testRoot/town/.beads (real)
      const townRoot = join(testRoot, "town");
      createTown(townRoot);
      createBeadsDir(townRoot);
      // Spurious .beads above town root
      createBeadsDir(testRoot);

      process.env["GT_TOWN_ROOT"] = townRoot;
      process.chdir(townRoot);

      const dirs = await gastown.listAllBeadsDirs();
      const paths = dirs.map((d) => d.path);

      // Should include the town beads
      expect(paths).toContain(join(townRoot, ".beads"));
      // Should NOT include the parent's .beads
      expect(paths).not.toContain(join(testRoot, ".beads"));
    });

    it("should include configured rig beads directories", async () => {
      const townRoot = join(testRoot, "town");
      createTown(townRoot);
      createBeadsDir(townRoot);

      // Create a rig with beads
      const rigDir = join(townRoot, "myrig");
      createBeadsDir(rigDir);

      // Add rig to config
      writeFileSync(
        join(townRoot, "mayor", "rigs.json"),
        JSON.stringify({ version: 1, rigs: { myrig: {} } })
      );

      process.env["GT_TOWN_ROOT"] = townRoot;
      process.chdir(townRoot);

      const dirs = await gastown.listAllBeadsDirs();
      const paths = dirs.map((d) => d.path);

      expect(paths).toContain(join(rigDir, ".beads"));
    });

    it("should follow .beads/redirect when resolving", async () => {
      const townRoot = join(testRoot, "town");
      createTown(townRoot);
      createBeadsDir(townRoot);

      // Create rig with redirect
      const rigDir = join(townRoot, "myrig");
      const actualBeads = join(townRoot, "mayor", "rig", ".beads");
      mkdirSync(join(townRoot, "mayor", "rig"), { recursive: true });
      createBeadsDir(join(townRoot, "mayor", "rig"));
      createBeadsDir(rigDir, { redirect: "../mayor/rig/.beads", config: false, issues: false });

      writeFileSync(
        join(townRoot, "mayor", "rigs.json"),
        JSON.stringify({ version: 1, rigs: { myrig: {} } })
      );

      process.env["GT_TOWN_ROOT"] = townRoot;
      process.chdir(townRoot);

      const dirs = await gastown.listAllBeadsDirs();
      const paths = dirs.map((d) => d.path);

      expect(paths).toContain(actualBeads);
    });

    it("should validate beads dirs have config.yaml or issues.jsonl", async () => {
      const townRoot = join(testRoot, "town");
      createTown(townRoot);
      createBeadsDir(townRoot);

      // Create a rig with empty .beads dir (no config, no issues)
      const rigDir = join(townRoot, "bogus");
      mkdirSync(join(rigDir, ".beads"), { recursive: true });

      writeFileSync(
        join(townRoot, "mayor", "rigs.json"),
        JSON.stringify({ version: 1, rigs: { bogus: {} } })
      );

      process.env["GT_TOWN_ROOT"] = townRoot;
      process.chdir(townRoot);

      const dirs = await gastown.listAllBeadsDirs();
      const paths = dirs.map((d) => d.path);

      // The bogus dir should be excluded (no config.yaml or issues.jsonl)
      expect(paths).not.toContain(join(rigDir, ".beads"));
    });
  });

  describe("resolveTownRoot", () => {
    it("should use GT_TOWN_ROOT env var when set", () => {
      const townRoot = join(testRoot, "town");
      createTown(townRoot);
      process.env["GT_TOWN_ROOT"] = townRoot;

      const result = gastown.resolveTownRoot();
      expect(result).toBe(townRoot);
    });
  });
});
