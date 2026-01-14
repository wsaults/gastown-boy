import { execBd, type BeadsIssue } from "./bd-client.js";
import { listAllBeadsDirs } from "./gastown-workspace.js";
import type { Convoy, TrackedIssue } from "../types/convoys.js";

export interface ConvoysServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function listConvoys(): Promise<ConvoysServiceResult<Convoy[]>> {
  try {
    const beadsDirs = await listAllBeadsDirs();
    const allConvoys: BeadsIssue[] = [];
    
    // 1. Fetch convoys from all discovered databases
    for (const dirInfo of beadsDirs) {
      const result = await execBd<BeadsIssue[]>(
        ["list", "--type=convoy", "--status=open", "-q", "--json"],
        { cwd: dirInfo.workDir, beadsDir: dirInfo.path }
      );
      if (result.success && result.data) {
        allConvoys.push(...result.data);
      }
    }

    if (allConvoys.length === 0) {
      return { success: true, data: [] };
    }

    // Deduplicate convoys by ID
    const uniqueConvoyIds = Array.from(new Set(allConvoys.map(c => c.id)));

    // 2. Fetch details for each convoy to get dependencies (tracks)
    const fullConvoysMap = new Map<string, BeadsIssue>();

    for (const dirInfo of beadsDirs) {
        const result = await execBd<any[]>(
            ["show", ...uniqueConvoyIds, "-q", "--json"],
            { cwd: dirInfo.workDir, beadsDir: dirInfo.path }
        );
        
        if (result.data) {
            for (const fc of result.data) {
                if (fc.issue_type !== 'convoy') continue;
                
                const existing = fullConvoysMap.get(fc.id);
                // Keep the one with the most dependencies (likely the most complete view)
                if (!existing || (fc.dependencies && fc.dependencies.length > (existing.dependencies?.length || 0))) {
                    fullConvoysMap.set(fc.id, fc);
                }
            }
        }
    }

    // 3. Assemble response
    const result: Convoy[] = [];
    const finalConvoys = Array.from(fullConvoysMap.values());
    
    for (const fc of finalConvoys) {
        const trackedIssues: TrackedIssue[] = [];
        let completed = 0;

        if (fc.dependencies) {
            for (const dep of fc.dependencies as any[]) {
                // Expanded dependencies in 'bd show --json' use 'dependency_type'
                if (dep.dependency_type === 'tracks') {
                    trackedIssues.push({
                        id: dep.id,
                        title: dep.title,
                        status: dep.status,
                        assignee: dep.assignee || undefined,
                        issueType: dep.issue_type,
                        updatedAt: dep.updated_at,
                        priority: dep.priority
                    });
                    if (dep.status === 'closed') {
                        completed++;
                    }
                }
            }
        }

        result.push({
            id: fc.id,
            title: fc.title,
            status: fc.status,
            progress: {
                completed,
                total: trackedIssues.length
            },
            trackedIssues
        });
    }

    return { success: true, data: result };

  } catch (err) {
    return {
      success: false,
      error: {
        code: "CONVOYS_ERROR",
        message: err instanceof Error ? err.message : "Failed to list convoys",
      },
    };
  }
}