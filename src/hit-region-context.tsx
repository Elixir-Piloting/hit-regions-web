"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { Rect } from "./types";
import { safeInvoke } from "./invoke";

interface HitRegionContextValue {
  register: (id: string, rect: Rect) => void;
  deregister: (id: string) => void;
  registerFocusNode: (id: string, node: HTMLElement) => void;
  deregisterFocusNode: (id: string, node: HTMLElement) => void;
}

const HitRegionContext = createContext<HitRegionContextValue | null>(null);

export function useHitRegionContext(): HitRegionContextValue {
  const ctx = useContext(HitRegionContext);
  if (!ctx) {
    throw new Error("useHitRegionContext must be used within <HitRegionProvider>");
  }
  return ctx;
}

const EPSILON = 0.5;

/**
 * Wraps the app (put it in the root layout) and owns the shared hit-region
 * registry. The registry is flushed to Rust as a whole, once per animation
 * frame at most.
 *
 * `idPrefix` lets the host namespace regions per child subtree (one mod per
 * nested provider). The outermost provider (no parent context) owns the
 * registry + flush; any provider that finds a parent becomes a pure
 * id-transform layer that forwards to the parent with its prefix prepended.
 * Prefixes chain across nesting depth. A mod's own `id` values are its own
 * concern — the host guarantees global uniqueness via the prefix.
 */
export function HitRegionProvider({
  idPrefix = "",
  children,
}: {
  idPrefix?: string;
  children: ReactNode;
}) {
  const parent = useContext(HitRegionContext);

  const registryRef = useRef<Record<string, Rect>>({});
  const focusNodesRef = useRef<Set<HTMLElement>>(new Set());
  const flushScheduledRef = useRef(false);

  const prefixId = useCallback((id: string) => (idPrefix ? idPrefix + id : id), [idPrefix]);

  const flush = useCallback(() => {
    flushScheduledRef.current = false;
    const regions = Object.entries(registryRef.current).map(([id, rect]) => ({
      id,
      rect,
    }));
    safeInvoke("update_hit_regions", { regions });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    requestAnimationFrame(flush);
  }, [flush]);

  const register = useCallback(
    (id: string, rect: Rect) => {
      if (parent) {
        parent.register(prefixId(id), rect);
        return;
      }
      const prev = registryRef.current[id];
      if (
        prev &&
        Math.abs(prev.x - rect.x) < EPSILON &&
        Math.abs(prev.y - rect.y) < EPSILON &&
        Math.abs(prev.width - rect.width) < EPSILON &&
        Math.abs(prev.height - rect.height) < EPSILON &&
        prev.focusable === rect.focusable
      ) {
        return;
      }
      registryRef.current[id] = rect;
      scheduleFlush();
    },
    [parent, prefixId, scheduleFlush]
  );

  const deregister = useCallback(
    (id: string) => {
      if (parent) {
        parent.deregister(prefixId(id));
        return;
      }
      if (!(id in registryRef.current)) return;
      delete registryRef.current[id];
      scheduleFlush();
    },
    [parent, prefixId, scheduleFlush]
  );

  const registerFocusNode = useCallback(
    (id: string, node: HTMLElement) => {
      if (parent) {
        parent.registerFocusNode(prefixId(id), node);
        return;
      }
      focusNodesRef.current.add(node);
    },
    [parent, prefixId]
  );

  const deregisterFocusNode = useCallback(
    (id: string, node: HTMLElement) => {
      if (parent) {
        parent.deregisterFocusNode(prefixId(id), node);
        return;
      }
      focusNodesRef.current.delete(node);
    },
    [parent, prefixId]
  );

  // Click-outside detection only applies at the root (focus nodes are only
  // tracked there).
  useEffect(() => {
    if (parent) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const insideFocusable = [...focusNodesRef.current].some((node) =>
        node.contains(target)
      );
      if (!insideFocusable) {
        safeInvoke("set_overlay_focus", { focused: false });
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [parent]);

  const value = useMemo(
    () => ({ register, deregister, registerFocusNode, deregisterFocusNode }),
    [register, deregister, registerFocusNode, deregisterFocusNode]
  );

  return <HitRegionContext.Provider value={value}>{children}</HitRegionContext.Provider>;
}
