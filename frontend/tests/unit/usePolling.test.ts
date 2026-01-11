import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePolling } from "../../src/hooks/usePolling";

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with loading true and no data", () => {
      const fetchFn = vi.fn().mockResolvedValue({ status: "ok" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should call fetch function immediately on mount", () => {
      const fetchFn = vi.fn().mockResolvedValue({ status: "ok" });

      renderHook(() => usePolling(fetchFn, { interval: 5000 }));

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("successful fetch", () => {
    it("should update data and set loading to false after fetch resolves", async () => {
      const mockData = { powerState: "running", town: { name: "TestTown" } };
      const fetchFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeUndefined();
    });

    it("should preserve previous data while fetching new data", async () => {
      const initialData = { count: 1 };
      const updatedData = { count: 2 };
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData);

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      // Trigger polling interval
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Data should still be available while fetching
      expect(result.current.data).toBeDefined();

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });
    });
  });

  describe("failed fetch", () => {
    it("should set error when fetch rejects", async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.data).toBeUndefined();
    });

    it("should handle non-Error rejection", async () => {
      const fetchFn = vi.fn().mockRejectedValue("String error");

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.error).toBe("String error");
      });
    });

    it("should clear error on successful retry", async () => {
      const fetchFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce({ status: "recovered" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe("Temporary failure");
      });

      // Trigger polling interval
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeUndefined();
        expect(result.current.data).toEqual({ status: "recovered" });
      });
    });
  });

  describe("polling behavior", () => {
    it("should poll at specified interval", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ tick: Date.now() });

      renderHook(() => usePolling(fetchFn, { interval: 3000 }));

      expect(fetchFn).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(fetchFn).toHaveBeenCalledTimes(2);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it("should stop polling on unmount", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      const { unmount } = renderHook(() =>
        usePolling(fetchFn, { interval: 1000 })
      );

      expect(fetchFn).toHaveBeenCalledTimes(1);

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should not have been called again after unmount
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should not poll when enabled is false", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      renderHook(() => usePolling(fetchFn, { interval: 1000, enabled: false }));

      // Should not call fetch when disabled
      expect(fetchFn).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should start polling when enabled changes to true", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      const { rerender } = renderHook(
        ({ enabled }) => usePolling(fetchFn, { interval: 1000, enabled }),
        { initialProps: { enabled: false } }
      );

      expect(fetchFn).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it("should stop polling when enabled changes to false", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      const { rerender } = renderHook(
        ({ enabled }) => usePolling(fetchFn, { interval: 1000, enabled }),
        { initialProps: { enabled: true } }
      );

      expect(fetchFn).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should not poll after being disabled
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("manual refresh", () => {
    it("should provide a refresh function", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "initial" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 10000 })
      );

      expect(typeof result.current.refresh).toBe("function");
    });

    it("should fetch immediately when refresh is called", async () => {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce({ data: "initial" })
        .mockResolvedValueOnce({ data: "refreshed" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 10000 })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: "initial" });
      });

      expect(fetchFn).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refresh();
      });

      expect(fetchFn).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: "refreshed" });
      });
    });

    it("should reset polling interval after manual refresh", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 5000 })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Advance 3 seconds (not yet at interval)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Manual refresh
      await act(async () => {
        result.current.refresh();
      });

      expect(fetchFn).toHaveBeenCalledTimes(2);

      // Advance 3 more seconds (would have triggered if interval wasn't reset)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // Should not have polled yet (interval reset)
      expect(fetchFn).toHaveBeenCalledTimes(2);

      // Advance 2 more seconds (5 total since refresh)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Now should have polled
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });
  });

  describe("options", () => {
    it("should use default interval when not specified", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      renderHook(() => usePolling(fetchFn));

      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Default interval should be 5000ms
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it("should skip initial fetch when skipInitialFetch is true", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: "test" });

      const { result } = renderHook(() =>
        usePolling(fetchFn, { interval: 1000, skipInitialFetch: true })
      );

      expect(fetchFn).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);

      // Should fetch on first interval
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetch function changes", () => {
    it("should use updated fetch function on next poll", async () => {
      const fetchFn1 = vi.fn().mockResolvedValue({ source: "fn1" });
      const fetchFn2 = vi.fn().mockResolvedValue({ source: "fn2" });

      const { rerender, result } = renderHook(
        ({ fn }) => usePolling(fn, { interval: 1000 }),
        { initialProps: { fn: fetchFn1 } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ source: "fn1" });
      });

      rerender({ fn: fetchFn2 });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ source: "fn2" });
      });

      expect(fetchFn2).toHaveBeenCalled();
    });
  });
});
