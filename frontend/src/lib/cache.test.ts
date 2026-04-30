import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCache, setCache, clearCache } from "./cache";

describe("cache utility", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it("stores and retrieves data within TTL", () => {
    const data = { foo: "bar" };
    setCache("test_key", data, 10);
    
    expect(getCache("test_key")).toEqual(data);
  });

  it("returns null after TTL expires", () => {
    const data = { foo: "bar" };
    setCache("test_key", data, 10);
    
    // Advance time by 11 seconds
    vi.advanceTimersByTime(11000);
    
    expect(getCache("test_key")).toBeNull();
  });

  it("clears specific cache entries", () => {
    setCache("test_key", "value");
    clearCache("test_key");
    
    expect(getCache("test_key")).toBeNull();
  });
});
