"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, } from "react";
import { safeInvoke } from "./invoke";
const HitRegionContext = createContext(null);
export function useHitRegionContext() {
    const ctx = useContext(HitRegionContext);
    if (!ctx) {
        throw new Error("useHitRegionContext must be used within <HitRegionProvider>");
    }
    return ctx;
}
/** Below this change (px) a rect update isn't worth re-sending to Rust. */
const EPSILON = 0.5;
/**
 * Wraps the app (put it in the root layout) and owns the shared hit-region
 * registry. The registry is flushed to Rust as a whole, once per animation
 * frame at most, so N components updating together produce ONE IPC call.
 */
export function HitRegionProvider({ children }) {
    const registryRef = useRef({});
    const focusNodesRef = useRef(new Set());
    const flushScheduledRef = useRef(false);
    const flush = useCallback(() => {
        flushScheduledRef.current = false;
        const regions = Object.entries(registryRef.current).map(([id, rect]) => ({
            id,
            rect,
        }));
        safeInvoke("update_hit_regions", { regions });
    }, []);
    const scheduleFlush = useCallback(() => {
        if (flushScheduledRef.current)
            return;
        flushScheduledRef.current = true;
        requestAnimationFrame(flush);
    }, [flush]);
    const register = useCallback((id, rect) => {
        const prev = registryRef.current[id];
        if (prev &&
            Math.abs(prev.x - rect.x) < EPSILON &&
            Math.abs(prev.y - rect.y) < EPSILON &&
            Math.abs(prev.width - rect.width) < EPSILON &&
            Math.abs(prev.height - rect.height) < EPSILON &&
            prev.focusable === rect.focusable) {
            return;
        }
        registryRef.current[id] = rect;
        scheduleFlush();
    }, [scheduleFlush]);
    const deregister = useCallback((id) => {
        if (!(id in registryRef.current))
            return;
        delete registryRef.current[id];
        scheduleFlush();
    }, [scheduleFlush]);
    const registerFocusNode = useCallback((_id, node) => {
        focusNodesRef.current.add(node);
    }, []);
    const deregisterFocusNode = useCallback((_id, node) => {
        focusNodesRef.current.delete(node);
    }, []);
    // Click-outside of any focusable region -> release overlay focus. Only
    // reachable while the cursor is over some region (pass-through is off there),
    // e.g. the user clicks a non-focusable part of the overlay.
    useEffect(() => {
        const onPointerDown = (event) => {
            const target = event.target;
            if (!target)
                return;
            const insideFocusable = [...focusNodesRef.current].some((node) => node.contains(target));
            if (!insideFocusable) {
                safeInvoke("set_overlay_focus", { focused: false });
            }
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, []);
    const value = useMemo(() => ({
        register,
        deregister,
        registerFocusNode,
        deregisterFocusNode,
    }), [register, deregister, registerFocusNode, deregisterFocusNode]);
    return _jsx(HitRegionContext.Provider, { value: value, children: children });
}
