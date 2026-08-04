import { describe, expect, it, vi, afterEach } from "vitest";
import { createElement, useEffect } from "react";
import { render } from "@testing-library/react";
import { HitRegionProvider, useHitRegionContext } from "./hit-region-context";
import { safeInvoke } from "./invoke";

vi.mock("./invoke", () => ({
  safeInvoke: vi.fn(),
}));

const invoke = vi.mocked(safeInvoke);

function Probe({ id, deregister }: { id: string; deregister?: boolean }) {
  const ctx = useHitRegionContext();
  useEffect(() => {
    if (deregister) {
      ctx.deregister(id);
      return;
    }
    ctx.register(id, { x: 1, y: 2, width: 3, height: 4, focusable: false });
  }, [ctx, id, deregister]);
  return null;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("HitRegionProvider idPrefix", () => {
  it("stores a plain id when no prefix is given (root-only, unchanged)", () => {
    render(createElement(HitRegionProvider, null, createElement(Probe, { id: "clipboard" })));
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const call = invoke.mock.calls[0]?.[1] as { regions: Array<{ id: string }> };
        expect(call.regions.map((r) => r.id)).toContain("clipboard");
        resolve();
      }, 20);
    });
  });

  it("prefixes ids through a nested provider", () => {
    render(
      createElement(HitRegionProvider, null,
        createElement(HitRegionProvider, { idPrefix: "clipboard:" },
          createElement(Probe, { id: "mod-clipboard" })
        )
      )
    );
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const call = invoke.mock.calls[0]?.[1] as { regions: Array<{ id: string }> };
        expect(call.regions.map((r) => r.id)).toContain("clipboard:mod-clipboard");
        resolve();
      }, 20);
    });
  });

  it("chains prefixes across two nesting depths", () => {
    render(
      createElement(HitRegionProvider, null,
        createElement(HitRegionProvider, { idPrefix: "notes:" },
          createElement(HitRegionProvider, { idPrefix: "nested:" },
            createElement(Probe, { id: "editor" })
          )
        )
      )
    );
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const call = invoke.mock.calls[0]?.[1] as { regions: Array<{ id: string }> };
        expect(call.regions.map((r) => r.id)).toContain("notes:nested:editor");
        resolve();
      }, 20);
    });
  });

  it("deregisters the prefixed id through nested providers", async () => {
    const { rerender } = render(
      createElement(HitRegionProvider, null,
        createElement(HitRegionProvider, { idPrefix: "clipboard:" },
          createElement(Probe, { id: "mod-clipboard" })
        )
      )
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    const firstCall = invoke.mock.calls[0]?.[1] as { regions: Array<{ id: string }> };
    expect(firstCall.regions.map((r) => r.id)).toContain("clipboard:mod-clipboard");

    rerender(
      createElement(HitRegionProvider, null,
        createElement(HitRegionProvider, { idPrefix: "clipboard:" },
          createElement(Probe, { id: "mod-clipboard", deregister: true })
        )
      )
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    const lastCall = invoke.mock.calls[invoke.mock.calls.length - 1]?.[1] as {
      regions: Array<{ id: string }>;
    };
    expect(lastCall.regions).toHaveLength(0);
  });

  it("two sibling mods with the same local id do not collide", () => {
    const Wrapper = () => (
      createElement(HitRegionProvider, null,
        createElement(HitRegionProvider, { idPrefix: "clipboard:" },
          createElement(Probe, { id: "button" })
        ),
        createElement(HitRegionProvider, { idPrefix: "notes:" },
          createElement(Probe, { id: "button" })
        )
      )
    );
    render(createElement(Wrapper));
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const call = invoke.mock.calls[0]?.[1] as { regions: Array<{ id: string }> };
        const ids = call.regions.map((r) => r.id);
        expect(ids).toContain("clipboard:button");
        expect(ids).toContain("notes:button");
        expect(new Set(ids).size).toBe(ids.length);
        resolve();
      }, 20);
    });
  });
});
