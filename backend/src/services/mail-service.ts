/**
 * Mail service for gastown-boy.
 *
 * This service provides a typed interface for mail operations,
 * wrapping the lower-level gt-executor mail commands.
 */

import { gt } from "./gt-executor.js";
import type { Message, SendMessageRequest } from "../types/mail.js";
import { MessageSchema } from "../types/mail.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for mail service operations.
 */
export interface MailServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Mail Service
// ============================================================================

/**
 * Lists all mail messages, sorted by newest first.
 */
export async function listMail(): Promise<MailServiceResult<Message[]>> {
  const result = await gt.mail.inbox<{ messages: Message[] }>();

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "LIST_MAIL_ERROR",
        message: result.error?.message ?? "Failed to list mail",
      },
    };
  }

  // Validate response structure
  if (!result.data || !Array.isArray(result.data.messages)) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Invalid response from mail inbox",
      },
    };
  }

  // Sort messages by timestamp, newest first
  const sorted = [...result.data.messages].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return { success: true, data: sorted };
}

/**
 * Gets a single message by ID.
 */
export async function getMessage(
  messageId: string
): Promise<MailServiceResult<Message>> {
  if (!messageId) {
    return {
      success: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "Message ID is required",
      },
    };
  }

  const result = await gt.mail.read<Message>(messageId);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "GET_MESSAGE_ERROR",
        message: result.error?.message ?? `Failed to get message: ${messageId}`,
      },
    };
  }

  // Validate response is a complete message
  const parseResult = MessageSchema.safeParse(result.data);
  if (!parseResult.success) {
    return {
      success: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Invalid message format in response",
      },
    };
  }

  return { success: true, data: result.data as Message };
}

/**
 * Sends a message. Defaults to sending to the Mayor.
 */
export async function sendMail(
  request: SendMessageRequest
): Promise<MailServiceResult<void>> {
  // Validate required fields
  if (!request.subject) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Subject is required",
      },
    };
  }

  if (!request.body) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Message body is required",
      },
    };
  }

  const to = request.to ?? "mayor/";

  // Build send options, only including defined values
  const sendOptions: {
    type?: "notification" | "task" | "scavenge" | "reply";
    priority?: 0 | 1 | 2 | 3 | 4;
    replyTo?: string;
  } = {};
  if (request.type !== undefined) sendOptions.type = request.type;
  if (request.priority !== undefined) sendOptions.priority = request.priority;
  if (request.replyTo !== undefined) sendOptions.replyTo = request.replyTo;

  const result = await gt.mail.send(
    to,
    request.subject,
    request.body,
    sendOptions
  );

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "SEND_FAILED",
        message: result.error?.message ?? "Failed to send message",
      },
    };
  }

  return { success: true };
}

/**
 * Marks a message as read. This is idempotent.
 */
export async function markRead(
  messageId: string
): Promise<MailServiceResult<void>> {
  if (!messageId) {
    return {
      success: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "Message ID is required",
      },
    };
  }

  const result = await gt.mail.markRead(messageId);

  if (!result.success) {
    return {
      success: false,
      error: {
        code: result.error?.code ?? "MARK_READ_ERROR",
        message: result.error?.message ?? `Failed to mark message as read`,
      },
    };
  }

  return { success: true };
}
