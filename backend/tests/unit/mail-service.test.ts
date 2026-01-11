import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the gt-executor before importing the module under test
vi.mock("../../src/services/gt-executor.js", () => ({
  gt: {
    mail: {
      inbox: vi.fn(),
      read: vi.fn(),
      send: vi.fn(),
      markRead: vi.fn(),
    },
  },
}));

import { gt } from "../../src/services/gt-executor.js";
import { listMail, getMessage, sendMail, markRead } from "../../src/services/mail-service.js";
import type { Message, SendMessageRequest } from "../../src/types/mail.js";

/**
 * Creates a mock Message for testing.
 */
function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-001",
    from: "mayor/",
    to: "operator",
    subject: "Test Subject",
    body: "Test message body",
    timestamp: "2026-01-11T12:00:00Z",
    read: false,
    priority: 2,
    type: "notification",
    threadId: "thread-001",
    pinned: false,
    ...overrides,
  };
}

describe("mail-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("listMail", () => {
    it("should return a list of messages on success", async () => {
      const mockMessages = [
        createMockMessage({ id: "msg-001", subject: "First message" }),
        createMockMessage({ id: "msg-002", subject: "Second message" }),
      ];

      vi.mocked(gt.mail.inbox).mockResolvedValue({
        success: true,
        data: { messages: mockMessages },
        exitCode: 0,
      });

      const result = await listMail();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].subject).toBe("First message");
      expect(result.data?.[1].subject).toBe("Second message");
    });

    it("should return messages sorted by newest first", async () => {
      const olderMessage = createMockMessage({
        id: "msg-001",
        timestamp: "2026-01-10T12:00:00Z",
      });
      const newerMessage = createMockMessage({
        id: "msg-002",
        timestamp: "2026-01-11T12:00:00Z",
      });

      vi.mocked(gt.mail.inbox).mockResolvedValue({
        success: true,
        data: { messages: [olderMessage, newerMessage] },
        exitCode: 0,
      });

      const result = await listMail();

      expect(result.success).toBe(true);
      expect(result.data?.[0].id).toBe("msg-002"); // Newer first
      expect(result.data?.[1].id).toBe("msg-001");
    });

    it("should return empty array when no messages exist", async () => {
      vi.mocked(gt.mail.inbox).mockResolvedValue({
        success: true,
        data: { messages: [] },
        exitCode: 0,
      });

      const result = await listMail();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it("should propagate errors from gt executor", async () => {
      vi.mocked(gt.mail.inbox).mockResolvedValue({
        success: false,
        error: {
          code: "COMMAND_FAILED",
          message: "Gastown not running",
        },
        exitCode: 1,
      });

      const result = await listMail();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("COMMAND_FAILED");
      expect(result.error?.message).toBe("Gastown not running");
    });

    it("should handle malformed response data gracefully", async () => {
      vi.mocked(gt.mail.inbox).mockResolvedValue({
        success: true,
        data: null, // Malformed response
        exitCode: 0,
      });

      const result = await listMail();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_RESPONSE");
    });
  });

  describe("getMessage", () => {
    it("should return a single message by ID", async () => {
      const mockMessage = createMockMessage({
        id: "msg-123",
        subject: "Specific message",
        body: "Full message content here",
      });

      vi.mocked(gt.mail.read).mockResolvedValue({
        success: true,
        data: mockMessage,
        exitCode: 0,
      });

      const result = await getMessage("msg-123");

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("msg-123");
      expect(result.data?.subject).toBe("Specific message");
      expect(result.data?.body).toBe("Full message content here");
      expect(gt.mail.read).toHaveBeenCalledWith("msg-123");
    });

    it("should return error when message not found", async () => {
      vi.mocked(gt.mail.read).mockResolvedValue({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Message msg-999 not found",
        },
        exitCode: 1,
      });

      const result = await getMessage("msg-999");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should validate message ID is provided", async () => {
      const result = await getMessage("");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_ARGUMENT");
      expect(result.error?.message).toContain("Message ID is required");
    });

    it("should handle malformed message response", async () => {
      vi.mocked(gt.mail.read).mockResolvedValue({
        success: true,
        data: { id: "msg-123" }, // Missing required fields
        exitCode: 0,
      });

      const result = await getMessage("msg-123");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_RESPONSE");
    });
  });

  describe("sendMail", () => {
    it("should send a message to the Mayor successfully", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: true,
        data: "Message sent",
        exitCode: 0,
      });

      const request: SendMessageRequest = {
        subject: "Test Subject",
        body: "Test body content",
      };

      const result = await sendMail(request);

      expect(result.success).toBe(true);
      expect(gt.mail.send).toHaveBeenCalledWith(
        "mayor/",
        "Test Subject",
        "Test body content",
        expect.any(Object)
      );
    });

    it("should use custom recipient when provided", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: true,
        data: "Message sent",
        exitCode: 0,
      });

      const request: SendMessageRequest = {
        to: "greenplace/Toast",
        subject: "Direct message",
        body: "Body content",
      };

      const result = await sendMail(request);

      expect(result.success).toBe(true);
      expect(gt.mail.send).toHaveBeenCalledWith(
        "greenplace/Toast",
        "Direct message",
        "Body content",
        expect.any(Object)
      );
    });

    it("should pass priority option when provided", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: true,
        data: "Message sent",
        exitCode: 0,
      });

      const request: SendMessageRequest = {
        subject: "Urgent message",
        body: "Urgent content",
        priority: 0, // Urgent
      };

      const result = await sendMail(request);

      expect(result.success).toBe(true);
      expect(gt.mail.send).toHaveBeenCalledWith(
        "mayor/",
        "Urgent message",
        "Urgent content",
        expect.objectContaining({ priority: 0 })
      );
    });

    it("should pass message type when provided", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: true,
        data: "Message sent",
        exitCode: 0,
      });

      const request: SendMessageRequest = {
        subject: "New task",
        body: "Task description",
        type: "task",
      };

      const result = await sendMail(request);

      expect(result.success).toBe(true);
      expect(gt.mail.send).toHaveBeenCalledWith(
        "mayor/",
        "New task",
        "Task description",
        expect.objectContaining({ type: "task" })
      );
    });

    it("should pass replyTo when provided", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: true,
        data: "Message sent",
        exitCode: 0,
      });

      const request: SendMessageRequest = {
        subject: "Re: Original message",
        body: "Reply content",
        replyTo: "msg-original",
      };

      const result = await sendMail(request);

      expect(result.success).toBe(true);
      expect(gt.mail.send).toHaveBeenCalledWith(
        "mayor/",
        "Re: Original message",
        "Reply content",
        expect.objectContaining({ replyTo: "msg-original" })
      );
    });

    it("should validate subject is required", async () => {
      const request = {
        subject: "",
        body: "Some body",
      } as SendMessageRequest;

      const result = await sendMail(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
      expect(result.error?.message).toContain("Subject is required");
    });

    it("should validate body is required", async () => {
      const request = {
        subject: "Some subject",
        body: "",
      } as SendMessageRequest;

      const result = await sendMail(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
      expect(result.error?.message).toContain("Message body is required");
    });

    it("should propagate send errors", async () => {
      vi.mocked(gt.mail.send).mockResolvedValue({
        success: false,
        error: {
          code: "SEND_FAILED",
          message: "Failed to send message",
        },
        exitCode: 1,
      });

      const request: SendMessageRequest = {
        subject: "Test",
        body: "Test body",
      };

      const result = await sendMail(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("SEND_FAILED");
    });
  });

  describe("markRead", () => {
    it("should mark a message as read successfully", async () => {
      vi.mocked(gt.mail.markRead).mockResolvedValue({
        success: true,
        data: "Marked as read",
        exitCode: 0,
      });

      const result = await markRead("msg-123");

      expect(result.success).toBe(true);
      expect(gt.mail.markRead).toHaveBeenCalledWith("msg-123");
    });

    it("should return error when message not found", async () => {
      vi.mocked(gt.mail.markRead).mockResolvedValue({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Message msg-999 not found",
        },
        exitCode: 1,
      });

      const result = await markRead("msg-999");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("NOT_FOUND");
    });

    it("should validate message ID is provided", async () => {
      const result = await markRead("");

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_ARGUMENT");
      expect(result.error?.message).toContain("Message ID is required");
    });

    it("should be idempotent - marking already read message succeeds", async () => {
      vi.mocked(gt.mail.markRead).mockResolvedValue({
        success: true,
        data: "Already marked as read",
        exitCode: 0,
      });

      const result = await markRead("msg-already-read");

      expect(result.success).toBe(true);
    });
  });
});
