import { Crosshair, Maximize, Minus, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { PersonCard } from "@/components/tree/PersonCard";
import { Button } from "@/components/ui/button";
import { CARD_H, CARD_W, type GenderOption, type LayoutResult } from "@/lib/genealogy";
import { cn } from "@/lib/utils";

const EDGE_STYLES: Record<string, string> = {
  parent: "stroke-[var(--line)]",
  spouse: "stroke-[var(--brass)]",
  sibling: "stroke-[var(--line)] opacity-60",
  relative: "stroke-[var(--muted-foreground)] opacity-70",
};

export function TreeCanvas({
  layout,
  genders,
  focusId,
  selectedId,
  collapsed,
  centerOn,
  onSelect,
  onToggleCollapse,
  onAdd,
}: {
  layout: LayoutResult;
  genders: GenderOption[];
  focusId: string | null;
  selectedId: string | null;
  collapsed: Set<string>;
  /** Bump this value (person id + nonce) to recentre the viewport on someone. */
  centerOn: { id: string | null; nonce: number };
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 0.9, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el || !layout.width || !layout.height) return;
    const pad = 48;
    const scale = Math.min(
      1.1,
      Math.max(0.25, Math.min((el.clientWidth - pad) / layout.width, (el.clientHeight - pad) / layout.height)),
    );
    setView({
      scale,
      x: (el.clientWidth - layout.width * scale) / 2,
      y: (el.clientHeight - layout.height * scale) / 2,
    });
  }, [layout.width, layout.height]);

  useLayoutEffect(() => {
    fit();
  }, [fit]);

  const centerPerson = useCallback(
    (id: string) => {
      const el = containerRef.current;
      const node = layout.nodes.find((n) => n.person.id === id);
      if (!el || !node) return;
      setView((v) => ({
        ...v,
        x: el.clientWidth / 2 - (node.x - layout.minX + CARD_W / 2) * v.scale,
        y: el.clientHeight / 2 - (node.y - layout.minY + CARD_H / 2) * v.scale,
      }));
    },
    [layout],
  );

  useEffect(() => {
    if (centerOn.id) centerPerson(centerOn.id);
  }, [centerOn, centerPerson]);

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    setView((v) => {
      const scale = Math.min(2.2, Math.max(0.2, v.scale * factor));
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      return { scale, x: cx - ((cx - v.x) / v.scale) * scale, y: cy - ((cy - v.y) / v.scale) * scale };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setView((v) => {
      const scale = Math.min(2.2, Math.max(0.2, v.scale * Math.exp(-e.deltaY * 0.0015)));
      return { scale, x: px - ((px - v.x) / v.scale) * scale, y: py - ((py - v.y) / v.scale) * scale };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-person-card]")) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }));
  };

  const endDrag = () => {
    drag.current = null;
  };

  const detail = view.scale > 0.55;

  return (
    <div
      ref={containerRef}
      className="canvas-grid relative h-full w-full touch-none overflow-hidden"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{ cursor: drag.current ? "grabbing" : "grab" }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          width: layout.width,
          height: layout.height,
          transition: drag.current ? "none" : "transform 220ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          <g transform={`translate(${-layout.minX}, ${-layout.minY})`}>
            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.path}
                fill="none"
                strokeWidth={1.6}
                strokeDasharray={edge.kind === "relative" || edge.kind === "sibling" ? "5 5" : undefined}
                className={cn(EDGE_STYLES[edge.kind])}
              />
            ))}
          </g>
        </svg>

        <div className="absolute inset-0" style={{ transform: `translate(${-layout.minX}px, ${-layout.minY}px)` }}>
          {layout.nodes.map((node) =>
            detail ? (
              <PersonCard
                key={node.person.id}
                node={node}
                genders={genders}
                isFocus={node.person.id === focusId}
                isSelected={node.person.id === selectedId}
                isCollapsed={collapsed.has(node.person.id)}
                onSelect={() => onSelect(node.person.id)}
                onToggleCollapse={() => onToggleCollapse(node.person.id)}
                onAdd={() => onAdd(node.person.id)}
              />
            ) : (
              <button
                key={node.person.id}
                type="button"
                data-person-card
                onClick={() => onSelect(node.person.id)}
                className={cn(
                  "absolute rounded-lg border border-border bg-card/90 shadow-node transition-colors hover:border-primary",
                  node.person.id === selectedId && "border-primary",
                )}
                style={{ left: node.x, top: node.y, width: CARD_W, height: CARD_H }}
              >
                <span className="grid h-full place-items-center px-2 text-center text-sm font-medium">
                  {node.person.first_name ?? "Unnamed"} {node.person.last_name ?? ""}
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 rounded-xl border border-border bg-surface/90 p-1.5 backdrop-blur">
        <Button size="icon" variant="ghost" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
          <Plus />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">
          <Minus />
        </Button>
        <Button size="icon" variant="ghost" onClick={fit} aria-label="Fit tree to screen">
          <Maximize />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => focusId && centerPerson(focusId)}
          aria-label="Centre on focused person"
        >
          <Crosshair />
        </Button>
      </div>

      {layout.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm text-muted-foreground">
            <Users className="size-4" /> No one is visible with the current filters.
          </div>
        </div>
      )}
    </div>
  );
}
