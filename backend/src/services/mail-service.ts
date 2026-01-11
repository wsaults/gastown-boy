/**
 * Mail service for gastown-boy.
 *
 * This service provides a typed interface for mail operations,
 * wrapping the lower-level gt-executor mail commands.
 *
 * TDD Stub - Implementation pending (see gb-v52.3.3)
 */

import type { Message, SendMessageRequest } from "../types/mail.js";
import type { GtResult } from "./gt-executor.js";

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

/**
 * Lists all mail messages, sorted by newest first.
 */
export async function listMail(): Promise<MailServiceResult<Message[]>> {
  // TODO: Implement in gb-v52.3.3
  throw new Error("Not implemented");
}

/**
 * Gets a single message by ID.
 */
export async function getMessage(
  messageId: string
): Promise<MailServiceResult<Message>> {
  // TODO: Implement in gb-v52.3.3
  throw new Error("Not implemented");
}

/**
 * Sends a message. Defaults to sending to the Mayor.
 */
export async function sendMail(
  request: SendMessageRequest
): Promise<MailServiceResult<void>> {
  // TODO: Implement in gb-v52.3.3
  throw new Error("Not implemented");
}

/**
 * Marks a message as read. This is idempotent.
 */
export async function markRead(
  messageId: string
): Promise<MailServiceResult<void>> {
  // TODO: Implement in gb-v52.3.3
  throw new Error("Not implemented");
}
