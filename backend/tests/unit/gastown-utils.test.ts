import { describe, it, expect } from "vitest";
import { isInfrastructureMessage, beadsIssueToMessage } from "../../src/services/gastown-utils.js";
import type { BeadsIssue } from "../../src/services/bd-client.js";

describe("isInfrastructureMessage", () => {
  describe("identifies infrastructure messages", () => {
    it("returns true for WITNESS_PING messages", () => {
      expect(isInfrastructureMessage("WITNESS_PING: gastown_boy")).toBe(true);
    });

    it("returns true for MERGE_READY messages", () => {
      expect(isInfrastructureMessage("MERGE_READY: feature-branch")).toBe(true);
    });

    it("returns true for MERGED: messages", () => {
      expect(isInfrastructureMessage("MERGED: PR #123")).toBe(true);
    });

    it("returns true for POLECAT_DONE messages", () => {
      expect(isInfrastructureMessage("POLECAT_DONE: obsidian")).toBe(true);
    });

    it("returns true for Session ended messages", () => {
      expect(isInfrastructureMessage("Session ended for polecat/obsidian")).toBe(true);
    });

    it("returns true for Handoff complete messages", () => {
      expect(isInfrastructureMessage("Handoff complete: work continues")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isInfrastructureMessage("witness_ping: test")).toBe(true);
      expect(isInfrastructureMessage("Witness_Ping: test")).toBe(true);
    });
  });

  describe("identifies user messages", () => {
    it("returns false for regular task subjects", () => {
      expect(isInfrastructureMessage("Fix the login bug")).toBe(false);
    });

    it("returns false for work assignment subjects", () => {
      expect(isInfrastructureMessage("Work: gb-123 Add feature")).toBe(false);
    });

    it("returns false for empty subjects", () => {
      expect(isInfrastructureMessage("")).toBe(false);
    });

    it("returns false for subjects containing keywords mid-text", () => {
      expect(isInfrastructureMessage("Check the WITNESS_PING issue")).toBe(false);
    });
  });
});

describe("beadsIssueToMessage", () => {
  function createBeadsIssue(overrides: Partial<BeadsIssue> = {}): BeadsIssue {
    return {
      id: "msg-001",
      title: "Test Subject",
      description: "Test body",
      status: "open",
      priority: 2,
      issue_type: "message",
      created_at: "2026-01-11T12:00:00Z",
      assignee: "overseer",
      labels: ["from:mayor/"],
      ...overrides,
    };
  }

  describe("isInfrastructure field", () => {
    it("sets isInfrastructure to true for infrastructure messages", () => {
      const issue = createBeadsIssue({ title: "WITNESS_PING: gastown_boy" });
      const message = beadsIssueToMessage(issue);
      expect(message.isInfrastructure).toBe(true);
    });

    it("sets isInfrastructure to false for user messages", () => {
      const issue = createBeadsIssue({ title: "Work: gb-123 Fix the bug" });
      const message = beadsIssueToMessage(issue);
      expect(message.isInfrastructure).toBe(false);
    });
  });
});
