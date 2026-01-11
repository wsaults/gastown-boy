---
description: Generate Beads/Gastown epic hierarchy from tasks.md for multi-agent orchestration.
handoffs:
  - label: View Tasks
    agent: speckit.tasks
    prompt: View the tasks for this feature
    send: false
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR. Verify tasks.md exists in FEATURE_DIR.

2. **Load source documents**: Read from FEATURE_DIR:
   - **Required**: tasks.md (phases, task IDs, descriptions, file paths)
   - **Required**: spec.md (feature name, user story titles for epic names)
   - **Optional**: plan.md (for summary description)

3. **Parse tasks.md structure**:
   - Extract feature name from header
   - Identify all phases (Setup, Foundational, User Stories, Polish)
   - For each phase: extract phase name, purpose, task count
   - For each task: extract ID, [P] marker, [Story] label, description, file path
   - Note dependencies mentioned in the Dependencies section

4. **Generate beads-import.md**: Use `.specify/templates/beads-template.md` as structure, fill with:
   - Feature name and metadata
   - Root epic with title, type, priority, description
   - Phase epics with metadata (title, type, priority, description, blocks/depends, task count)
   - Tasks as tables (Title | Path) grouped by phase
   - Summary table with task counts per phase
   - MVP scope section
   - Notes section with constitution requirements

5. **Report**: Output path to generated beads-import.md and summary:
   - Total epic count
   - Total task count
   - Epic hierarchy preview

Context for beads generation: $ARGUMENTS

## Output Format

The beads-import.md is a **data file** that gastown can parse to create beads. It contains:

### Epics Section
Structured metadata for each epic:
- **Title**: Epic name
- **Type**: epic
- **Priority**: 1-4
- **Description**: Purpose/goal
- **Blocks**: Which epics this blocks (optional)
- **Depends**: Which epics this depends on (optional)
- **MVP**: true if this is MVP scope (optional)
- **Tasks**: Task count

### Tasks Section
Tables per phase with columns:
- **Title**: Task description (markers stripped)
- **Path**: File path or `-` if N/A

### Priority Mapping

| Phase | Priority |
|-------|----------|
| Setup | 1 |
| Foundational | 1 |
| US1 (MVP) | 1 |
| US2 | 2 |
| US3 | 3 |
| US4+ | 4+ |
| Polish | (highest US priority + 1) |

### Task Transformation

Strip from task descriptions:
- Checkbox: `- [ ]`
- Task ID: `T001`, `T002`, etc.
- Parallel marker: `[P]`
- Story label: `[US1]`, `[US2]`, etc.

Extract file path from description (text after "in" or at end of description).

Example:
```
Input:  - [ ] T012 [P] [US1] Create User model in src/models/user.py
Output: Title: "Create User model", Path: "src/models/user.py"
```
