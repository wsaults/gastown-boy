import { existsSync } from "fs";
import { join, basename, resolve, dirname } from "path";
import { execBd, resolveBeadsDir, type BeadsIssue } from "./bd-client.js";
import { listRigNames } from "./gastown-workspace.js";
import {
  addressToIdentity,
  parseAgentBeadId,
  parseAgentFields,
  sessionNameForAgent,
} from "./gastown-utils.js";
import { listTmuxSessions } from "./tmux.js";
import { buildMailIndex, listMailIssues, type MailIndexEntry } from "./mail-data.js";

export interface AgentRuntimeInfo {
  id: string;
  name: string;
  role: string;
  rig: string | null;
  address: string;
  sessionName: string | null;
  running: boolean;
  state?: string;
  hookBead?: string;
  unreadMail: number;
  firstSubject?: string;
}

export interface AgentSnapshot {
  agents: AgentRuntimeInfo[];
  mailIndex: Map<string, MailIndexEntry>;
}

function normalizeRole(role: string): string {
  const lower = role.toLowerCase();
  if (lower === "coordinator") return "mayor";
  if (lower === "health-check") return "deacon";
  return lower;
}

function buildAgentAddress(role: string, rig: string | null, name: string | null): string | null {
  switch (role) {
    case "mayor":
    case "deacon":
      return `${role}/`;
    case "witness":
    case "refinery":
      return rig ? `${rig}/${role}` : null;
    case "crew":
      return rig && name ? `${rig}/crew/${name}` : null;
    case "polecat":
      return rig && name ? `${rig}/${name}` : null;
    default:
      return null;
  }
}

async function fetchAgents(cwd: string, beadsDir: string): Promise<BeadsIssue[]> {
  const issues: BeadsIssue[] = [];
  
  // Fetch active agents (default status=open)
  const openResult = await execBd<BeadsIssue[]>(
    ["list", "--type=agent", "--json"],
    { cwd, beadsDir }
  );
  if (openResult.success && openResult.data) {
    issues.push(...openResult.data);
  }

  // Fetch tombstone agents (polecats often use this status)
  const tombstoneResult = await execBd<BeadsIssue[]>(
    ["list", "--type=agent", "--status=tombstone", "--json"],
    { cwd, beadsDir }
  );
  if (tombstoneResult.success && tombstoneResult.data) {
    issues.push(...tombstoneResult.data);
  }

  return issues;
}

export async function collectAgentSnapshot(
  townRoot: string,
  extraIdentities: string[] = []
): Promise<AgentSnapshot> {
  const sessions = await listTmuxSessions();
  const foundIssues: { issue: BeadsIssue; sourceRig: string | null }[] = [];
  const errors: string[] = [];
  const scannedPaths = new Set<string>();

  const townBeadsDir = resolveBeadsDir(townRoot);
  const townAgents = await fetchAgents(townRoot, townBeadsDir);
  scannedPaths.add(resolve(townRoot));

  if (townAgents.length > 0) {
    foundIssues.push(...townAgents.map((issue) => ({ issue, sourceRig: null })));
  } else {
    // We only treat empty town agents as an error if we found NOTHING at all later
    // But for now, let's keep the existing error semantics roughly similar
    // errors.push("Failed to list town agent beads"); 
    // Actually, fetchAgents suppresses errors, so we might miss the error message.
    // However, getting 0 agents from town root is suspicious.
  }

  const rigNames = await listRigNames(townRoot);
  for (const rigName of rigNames) {
    const rigPath = join(townRoot, rigName);
    if (!existsSync(rigPath)) continue;
    scannedPaths.add(resolve(rigPath));
    const rigAgents = await fetchAgents(rigPath, resolveBeadsDir(rigPath));
    foundIssues.push(...rigAgents.map((issue) => ({ issue, sourceRig: rigName })));
  }

  // Scan extra rigs from environment variable GT_EXTRA_RIGS
  // Format: "path/to/rig1,path/to/rig2"
  const extraRigs = process.env["GT_EXTRA_RIGS"];
  if (extraRigs) {
    const paths = extraRigs.split(",").map((p) => p.trim()).filter(Boolean);
    for (const p of paths) {
      const rigPath = resolve(process.cwd(), p);
      if (!existsSync(rigPath) || scannedPaths.has(rigPath)) continue;
      
      scannedPaths.add(rigPath);
      const rigName = basename(rigPath);
      
      // Try local .beads first
      let agents = await fetchAgents(rigPath, resolveBeadsDir(rigPath));

      // Fallback: try using town beads if local failed (e.g. no local DB)
      if (agents.length === 0) {
        agents = await fetchAgents(rigPath, townBeadsDir);
      }
      
      foundIssues.push(...agents.map((issue) => ({ issue, sourceRig: rigName })));
    }
  }

  // Heuristic: search up from CWD for a .beads directory to handle cases where
  // we are running inside a rig directory that isn't known to the town (e.g.
  // missing config or running in a detached rig).
  let current = process.cwd();
  while (true) {
    if (scannedPaths.has(resolve(current))) break;

    if (existsSync(join(current, ".beads"))) {
      const rigName = basename(current);
      const agents = await fetchAgents(current, resolveBeadsDir(current));
      foundIssues.push(...agents.map((issue) => ({ issue, sourceRig: rigName })));
      break; // Stop after finding the closest beads dir
    }

    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  if (foundIssues.length === 0 && errors.length > 0) {
    throw new Error(errors[0]);
  }

  const identities = new Set(extraIdentities.map(addressToIdentity));
  const baseAgents: Omit<AgentRuntimeInfo, "unreadMail" | "firstSubject">[] = [];

  for (const { issue, sourceRig } of foundIssues) {
    const parsed = parseAgentBeadId(issue.id, sourceRig);
    const fields = parseAgentFields(issue.description);
    const role = normalizeRole(fields.roleType ?? parsed?.role ?? "");
    if (!role) continue;

    const rig = fields.rig ?? parsed?.rig ?? null;
    const name =
      parsed?.name ??
      (role === "mayor" || role === "deacon" || role === "witness" || role === "refinery"
        ? role
        : issue.title || role);
    const address = buildAgentAddress(role, rig, name);
    if (!address) continue;

    const sessionName = sessionNameForAgent(role, rig, name);
    const running = sessionName ? sessions.has(sessionName) : false;
    const state = issue.agent_state ?? fields.agentState;
    const hookBead = issue.hook_bead ?? fields.hookBead;

    const identity = addressToIdentity(address);
    identities.add(identity);

    baseAgents.push({
      id: issue.id,
      name,
      role,
      rig,
      address,
      sessionName,
      running,
      state,
      hookBead,
    });
  }

  // Synthesize agents from running tmux sessions if not found in beads
  for (const sessionName of sessions) {
    let rig: string | null = null;
    let role: string | null = null;
    let name: string | null = null;

    if (sessionName === "hq-mayor") {
      role = "mayor";
      name = "mayor";
    } else if (sessionName === "hq-deacon") {
      role = "deacon";
      name = "deacon";
    } else if (sessionName.startsWith("gt-")) {
      const parts = sessionName.split("-");
      // gt-{rig}-witness
      // gt-{rig}-refinery
      // gt-{rig}-crew-{name}
      // gt-{rig}-{name} (polecat)
      if (parts.length >= 3) {
        rig = parts[1];
        const typeOrName = parts[2];
        
        if (typeOrName === "witness") {
          role = "witness";
          name = "witness";
        } else if (typeOrName === "refinery") {
          role = "refinery";
          name = "refinery";
        } else if (typeOrName === "crew" && parts.length >= 4) {
          role = "crew";
          name = parts.slice(3).join("-");
        } else {
          // Assume polecat if not one of the above known types
          role = "polecat";
          name = parts.slice(2).join("-");
        }
      }
    }

    if (role && name) {
      const address = buildAgentAddress(role, rig, name);
      if (address) {
        const identity = addressToIdentity(address);
        // Check if already found via beads
        if (!identities.has(identity)) {
          identities.add(identity);
          baseAgents.push({
            id: address, // Fallback ID
            name,
            role,
            rig,
            address,
            sessionName,
            running: true,
            state: "running", // It has a session, so it's running
            hookBead: undefined,
          });
        }
      }
    }
  }

  const mailIssues = await listMailIssues(townRoot);
  const mailIndex = buildMailIndex(mailIssues, Array.from(identities));

  const agents = baseAgents.map((agent) => {
    const mailInfo = mailIndex.get(addressToIdentity(agent.address));
    return {
      ...agent,
      unreadMail: mailInfo?.unread ?? 0,
      firstSubject: mailInfo?.firstSubject,
    };
  });

  return { agents, mailIndex };
}
