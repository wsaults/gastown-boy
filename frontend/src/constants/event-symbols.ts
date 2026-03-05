/**
 * Standardized event symbol vocabulary from gt feed.
 * Use these constants instead of inline symbol literals.
 */
export const EVENT_SYMBOLS = {
  CREATE: '+',
  UPDATE: '\u2192',    // →
  COMPLETE: '\u2713',  // ✓
  FAIL: '\u2717',      // ✗
  DELETE: '\u2298',     // ⊘
  PIN: '\uD83D\uDCCC', // 📌
} as const;

export type EventSymbol = typeof EVENT_SYMBOLS[keyof typeof EVENT_SYMBOLS];
