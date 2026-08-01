# hit-regions-web

React hit-region primitives for **click-through-capable Tauri overlay windows**
on Windows. The frontend half of the hit-region system (see also
[`hit-regions-rs`](https://github.com/Elixir-Piloting/hit-regions-rs), the Rust
engine). Framework-agnostic — works in a Next.js or Vite-based Tauri app.

## What does it do?

A Tauri overlay window is click-through for its whole surface by default. To
make only the small interactive surfaces of your overlay click-capturing, wrap
their root elements in `<HitRegion>` (or use `useHitRegion`). This package
measures those elements, batches the results, and sends the complete region set
to Rust, where a background cursor-polling loop turns click-through on/off for
the whole window accordingly. See the `hit-regions-rs` README for why the
cursor-polling workaround exists at all.

## Install

```bash
# from a Tauri app
pnpm add hit-regions-web@github:Elixir-Piloting/hit-regions-web#v1.1.0
```

## Usage

Mount `<HitRegionProvider>` once at the app root, then wrap interactive
elements:

```tsx
import { HitRegion, HitRegionProvider } from "hit-regions-web";

export function App() {
  return (
    <HitRegionProvider>
      <HitRegion id="island">
        <button onClick={toggle}>Clickable island</button>
      </HitRegion>

      <HitRegion id="search" focusable>
        <div className="panel">
          <input placeholder="Search (click to focus)" />
        </div>
      </HitRegion>
    </HitRegionProvider>
  );
}
```

## API

### `<HitRegion>`

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `id` | `string` | — | Unique id. Must not collide with another mounted region. |
| `focusable` | `boolean` | `false` | Region may take keyboard focus (search box, text input). |
| `onPointerDown` | handler | — | Optional; merged with the focus-grant handler when `focusable`. |
| `children` | `ReactNode` | — | **Exactly one** element — the interactive root of the region. |

Requires exactly one child element; the measuring ref is forwarded onto it so
bounds follow the element itself, which keeps Framer Motion `animate`/`drag`
transforms correct.

### `useHitRegion(id, { focusable })`

Lower-level hook. Attach the returned `ref` to any DOM element to make it a hit
region. Returns `{ ref }`.

### `useOverlayLifecycle({ heartbeatMs })`

The watchdog glue. Call it once from a single mounted client component to keep
the Rust watchdog (`hit-regions-rs`) informed of the frontend's health so the
overlay can never lock the desktop:

- emits `overlay-ready` once on mount — Rust only shows the (initially hidden)
  window after this, so a failed page load never produces a full-screen
  takeover;
- emits `overlay-heartbeat` every `heartbeatMs` (default `2000`) — Rust hides
  the window (and in release builds exits the app) if heartbeats stop for too
  long, and re-shows it when they resume;
- emits `overlay-fatal` once (debounced) on a JS error or unhandled rejection —
  Rust exits immediately in release builds.

```tsx
import { useOverlayLifecycle } from "hit-regions-web";

export function OverlayLifecycle() {
  useOverlayLifecycle();
  return null;
}

// mount <OverlayLifecycle /> once in your root layout, alongside
// <HitRegionProvider>
```

All IPC is behind `isTauri()` guards, so it no-ops under a plain dev server in
a browser. If you use this hook, you do **not** need to emit the liveness events
yourself; if you'd rather hand-roll the glue, the events are `overlay-ready`,
`overlay-heartbeat`, `overlay-fatal` (see the `hit-regions-rs` README).

### `HitRegionProvider`

Owns the shared registry. Mount once, high in the tree (in the root layout).
Click-outside of any focusable region releases overlay focus.

## Behavior

- **Batching / throttling.** All region updates go through one flush path: the
  whole registry is snapshotted and sent to Rust via a single
  `update_hit_regions` IPC call, throttled to **once per animation frame**.
  N components updating in the same frame produce one call, not N.
- **Stale-rect-on-unmount is handled for you.** `useHitRegion` deregisters its
  own id on unmount. This is required: a stale rect left behind becomes an
  invisible **permanent dead zone** that swallows clicks. Do not bypass the
  cleanup.
- **Transforms are tracked.** Bounds are measured via `ResizeObserver` *and*
  re-sampled from `getBoundingClientRect()` every animation frame, so a region
  follows Framer Motion `animate`/`drag` motion in real time.
- **Focus is click-driven, never hover-driven.** A real click inside a
  `focusable` region grants the overlay window keyboard focus
  (`set_overlay_focus(true)`); merely hovering never does, so drifting the
  cursor over a region can't steal the user's keyboard input from another app.
  Focus is released on click-outside or unmount.
- **Browser-safe.** All IPC is behind `isTauri()` guards, so the app also runs
  under a plain dev server in a browser without crashing on IPC calls.

## Frontend contract with the Rust engine

This package sends `update_hit_regions` and `set_overlay_focus` IPC calls for
region behavior, and — via `useOverlayLifecycle` — the `overlay-ready`,
`overlay-heartbeat`, and `overlay-fatal` events the Rust watchdog listens for.
That covers the full frontend side of the system; the only remaining glue is
mounting `<HitRegionProvider>` and the lifecycle hook once at your app root.

## License

MIT
