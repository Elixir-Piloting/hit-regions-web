"use client";
import { Children, cloneElement, } from "react";
import { useHitRegion } from "./use-hit-region";
import { setOverlayFocus } from "./invoke";
/**
 * The primary developer-facing hit-region API. Wrap the interactive root element
 * of an overlay UI and it becomes click-capturing while the cursor is over it
 * (and click-through everywhere else).
 *
 * Requires exactly one child element; the region ref is forwarded to it so
 * bounds are measured on the element itself — which keeps Framer Motion
 * drag/animate transforms correct.
 *
 * Pass `focusable` for regions that need keyboard input (search boxes, text
 * inputs). A real click inside the region grants the window focus; hovering
 * never does, so the cursor drifting over a region can't steal the user's
 * keyboard input from another app.
 */
export function HitRegion({ id, focusable = false, onPointerDown, children }) {
    const { ref } = useHitRegion(id, { focusable });
    const child = Children.only(children);
    const mergedProps = focusable
        ? {
            onPointerDown: (event) => {
                setOverlayFocus(true);
                onPointerDown?.(event);
            },
        }
        : {};
    // React 19 treats `ref` as a regular prop; type the props object explicitly so
    // cloneElement accepts it (its `Attributes` type only models `key`).
    const props = {
        ...mergedProps,
        ref,
    };
    return cloneElement(child, props);
}
