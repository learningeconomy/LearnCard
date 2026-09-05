import { useMemo, useState, useRef, useEffect } from 'react';
// Prototype overlaid localStorage bindings ("roster ↑ • records ↑", "verify only"); omitted — bindings live on /bindings (ADR-008). Edges here are real graph relations only.
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    Globe,
    Layers,
    School,
    Building2,
    Scan,
} from 'lucide-react';

interface UnifiedEntity {
    id: string;
    name: string;
    subtitle: React.ReactNode;
    searchString: string;
    typeLabel: string;
    kind: 'ecosystem' | 'group' | 'institution' | 'employer';
    status?: string;
    role?: string;
    link?: string;
    slugPath?: string[];
    ownerEcosystemId?: string;
    groupIds?: string[];
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    entities: UnifiedEntity[];
}

type Node = {
    kind: 'ecosystem' | 'group' | 'institution' | 'employer';
    id: string;
    label: string;
    sub: string;
    x: number;
    y: number;
    w: number;
    count?: number;
};

type Edge = {
    from: string;
    to: string;
    label: string;
    dashed?: boolean;
    tone: string;
};

const TONES = {
    ecosystem: { border: 'border-primary', text: 'text-primary' },
    group: { border: 'border-violet', text: 'text-violet' },
    institution: { border: 'border-emerald', text: 'text-emerald' },
    employer: { border: 'border-coral', text: 'text-coral' },
} as const;

const MAX_PER_TIER = 7;
const NODE_H = 52;
const NODE_W = 188;
const GAP = 20;

const truncate = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function EcosystemMapDialog({ open, onOpenChange, entities }: Props) {
    const [zoom, setZoom] = useState(1);
    const [fitZoom, setFitZoom] = useState(1);
    const [fullscreen, setFullscreen] = useState(false);
    const hasFitRef = useRef(false);
    const [containerSize, setContainerSize] = useState({ width: 1152, height: 480 });
    const containerRef = useRef<HTMLDivElement>(null);

    const { nodes, edges, graphWidth, graphHeight, tierLanes } = useMemo(() => {
        const laidNodes: Node[] = [];
        const laidEdges: Edge[] = [];

        // Build primary tree
        const roots = entities.filter(
            e => e.kind === 'ecosystem' && (!e.slugPath || e.slugPath.length === 1)
        );

        // Determine max ecosystem depth
        let maxEcoDepth = 0;
        entities.forEach(e => {
            if (e.kind === 'ecosystem' && e.slugPath) {
                maxEcoDepth = Math.max(maxEcoDepth, e.slugPath.length);
            }
        });
        if (maxEcoDepth === 0) maxEcoDepth = 1;

        const TIER_Y_SPACING = 88;
        const getTierY = (kind: string, depth: number) => {
            if (kind === 'ecosystem') return (depth - 1) * TIER_Y_SPACING;
            if (kind === 'group') return maxEcoDepth * TIER_Y_SPACING;
            if (kind === 'institution') return (maxEcoDepth + 1) * TIER_Y_SPACING;
            if (kind === 'employer') return (maxEcoDepth + 2) * TIER_Y_SPACING;
            return 0;
        };

        let currentColumn = 0;

        const processNode = (
            entity: UnifiedEntity,
            _parentId: string | null,
            depth: number
        ): { x: number; id: string } => {
            const id = `${entity.kind}-${entity.id}`;

            // Find children
            let children: UnifiedEntity[] = [];
            if (entity.kind === 'ecosystem') {
                children = entities.filter(e => {
                    if (e.kind === 'ecosystem') {
                        return (
                            e.slugPath &&
                            e.slugPath.length === depth + 1 &&
                            e.slugPath[depth - 1] === entity.slugPath?.[depth - 1]
                        );
                    }
                    return e.ownerEcosystemId === entity.id;
                });
            }

            // Sort children: ecosystem, group, institution, employer
            const kindOrder = { ecosystem: 0, group: 1, institution: 2, employer: 3 };
            children.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind]);

            const shownChildren = children.slice(0, MAX_PER_TIER);
            const overflow = children.length - shownChildren.length;

            const childPositions: number[] = [];

            shownChildren.forEach(child => {
                const childDepth = child.kind === 'ecosystem' ? depth + 1 : depth;
                const childPos = processNode(child, id, childDepth);
                childPositions.push(childPos.x);

                laidEdges.push({
                    from: id,
                    to: childPos.id,
                    label:
                        child.kind === 'ecosystem'
                            ? 'child'
                            : child.kind === 'group'
                              ? 'owns'
                              : 'member',
                    tone: 'hsl(var(--border))',
                });
            });

            if (overflow > 0) {
                const overflowX = currentColumn * (NODE_W + GAP);
                currentColumn++;
                childPositions.push(overflowX);
                const overflowId = `${id}-more`;

                const kind = children[shownChildren.length].kind;
                const y = getTierY(kind, kind === 'ecosystem' ? depth + 1 : depth);

                laidNodes.push({
                    id: overflowId,
                    label: `+${overflow} more`,
                    sub: 'same permissions',
                    x: overflowX,
                    y,
                    w: NODE_W,
                    kind,
                    count: overflow,
                });

                laidEdges.push({
                    from: id,
                    to: overflowId,
                    label: 'more',
                    tone: 'hsl(var(--border))',
                });
            }

            const x =
                childPositions.length > 0
                    ? (childPositions[0] + childPositions[childPositions.length - 1]) / 2
                    : (() => {
                          const position = currentColumn * (NODE_W + GAP);
                          currentColumn++;
                          return position;
                      })();

            const y = getTierY(entity.kind, depth);

            const sub =
                entity.kind === 'ecosystem' || entity.kind === 'group'
                    ? typeof entity.subtitle === 'string' &&
                      entity.subtitle !== 'No groups or members yet'
                        ? entity.subtitle
                        : entity.typeLabel
                    : entity.searchString.startsWith('in ')
                      ? ''
                      : entity.searchString;

            laidNodes.push({
                id,
                label: truncate(entity.name),
                sub,
                x,
                y,
                w: NODE_W,
                kind: entity.kind,
            });

            return { x, id };
        };

        const rootPositions: number[] = [];
        roots.forEach(root => {
            const pos = processNode(root, null, 1);
            rootPositions.push(pos.x);
        });

        // Add secondary edges (group -> org)
        entities.forEach(e => {
            if ((e.kind === 'institution' || e.kind === 'employer') && e.groupIds) {
                e.groupIds.forEach(gid => {
                    const fromId = `group-${gid}`;
                    const toId = `${e.kind}-${e.id}`;
                    if (
                        laidNodes.some(n => n.id === fromId) &&
                        laidNodes.some(n => n.id === toId)
                    ) {
                        laidEdges.push({
                            from: fromId,
                            to: toId,
                            label: 'in group',
                            dashed: true,
                            tone: 'hsl(var(--violet))',
                        });
                    }
                });
            }
        });

        const xs = laidNodes.map(n => n.x);
        const minX = xs.length > 0 ? Math.min(...xs) : 0;
        const maxX = xs.length > 0 ? Math.max(...xs.map((x, i) => x + laidNodes[i].w)) : 0;
        const maxY = laidNodes.length > 0 ? Math.max(...laidNodes.map(n => n.y)) + NODE_H : 0;

        const layoutWidth = maxX - minX;
        const layoutHeight = maxY;

        laidNodes.forEach(n => (n.x -= minX));

        const activeTiers: { y: number; kind: string }[] = [];
        const ySet = new Set<number>();
        laidNodes.forEach(n => {
            if (!ySet.has(n.y)) {
                ySet.add(n.y);
                activeTiers.push({ y: n.y, kind: n.kind });
            }
        });
        activeTiers.sort((a, b) => a.y - b.y);

        let ecoLabeled = false;
        const layoutTierLanes = activeTiers.map(t => {
            let label = '';
            if (t.kind === 'ecosystem') {
                if (!ecoLabeled) {
                    label = 'ECOSYSTEMS';
                    ecoLabeled = true;
                }
            } else if (t.kind === 'group') {
                label = 'GROUPS';
            } else if (t.kind === 'institution') {
                label = 'INSTITUTIONS';
            } else if (t.kind === 'employer') {
                label = 'EMPLOYERS';
            }
            return { y: t.y, label };
        });

        return {
            nodes: laidNodes,
            edges: laidEdges,
            graphWidth: layoutWidth,
            graphHeight: layoutHeight,
            tierLanes: layoutTierLanes,
        };
    }, [entities]);

    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    useEffect(() => {
        if (!open || !containerRef.current) return;

        hasFitRef.current = false;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setContainerSize({ width, height });
                    const newFitZoom = Math.min(
                        1,
                        (width - 48) / graphWidth,
                        (height - 48) / graphHeight
                    );
                    setFitZoom(newFitZoom);
                    if (!hasFitRef.current) {
                        setZoom(newFitZoom);
                        hasFitRef.current = true;
                    }
                }
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [open, graphWidth, graphHeight]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    fullscreen
                        ? 'w-screen max-w-none h-screen max-h-screen rounded-none border-0 overflow-hidden flex flex-col'
                        : 'w-[calc(100%-2rem)] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col'
                }
            >
                <DialogHeader>
                    <DialogTitle className="font-display">Ecosystem Map</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Every ecosystem, group, and organization you administer, and how they
                        relate.
                    </p>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                        Ecosystem
                    </Badge>
                    <Badge variant="outline" className="border-violet/40 text-violet">
                        Group
                    </Badge>
                    <Badge variant="outline" className="border-emerald/40 text-emerald">
                        Institution
                    </Badge>
                    <Badge variant="outline" className="border-coral/40 text-coral">
                        Employer
                    </Badge>
                    <span className="ml-2 text-muted-foreground">
                        lines: child / owns / member · dashed: in group
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title="Fit to view"
                            onClick={() => setZoom(fitZoom)}
                        >
                            <Scan className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title={fullscreen ? 'Exit full screen' : 'Full screen'}
                            onClick={() => {
                                setFullscreen(f => !f);
                            }}
                        >
                            {fullscreen ? (
                                <Minimize2 className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div
                    id="map-canvas-container"
                    ref={containerRef}
                    className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-muted/20"
                >
                    {(() => {
                        const scaledWidth = graphWidth * zoom;
                        const scaledHeight = graphHeight * zoom;

                        const svgWidth = Math.max(containerSize.width, scaledWidth + 48);
                        const svgHeight = Math.max(containerSize.height, scaledHeight + 88);

                        const tx = Math.max(24, (svgWidth - scaledWidth) / 2);
                        const ty = Math.max(40, (svgHeight - scaledHeight) / 2);

                        return (
                            <svg
                                width={svgWidth}
                                height={svgHeight}
                                className="block min-w-full min-h-full"
                            >
                                <g transform={`translate(${tx}, ${ty}) scale(${zoom})`}>
                                    {edges.map((e, i) => {
                                        const a = nodeMap.get(e.from);
                                        const b = nodeMap.get(e.to);
                                        if (!a || !b) return null;
                                        const x1 = a.x + a.w / 2;
                                        const y1 = a.y + NODE_H;
                                        const x2 = b.x + b.w / 2;
                                        const y2 = b.y;

                                        const midY = y1 + 18 + (e.dashed ? 8 : 0);
                                        const r = 12;

                                        const d =
                                            Math.abs(x2 - x1) < r * 2
                                                ? `M${x1},${y1} L${x2},${y2}`
                                                : (() => {
                                                      const dirX = x2 > x1 ? 1 : -1;
                                                      return `M${x1},${y1} 
                                            L${x1},${midY - r} 
                                            Q${x1},${midY} ${x1 + r * dirX},${midY} 
                                            L${x2 - r * dirX},${midY} 
                                            Q${x2},${midY} ${x2},${midY + r} 
                                            L${x2},${y2}`;
                                                  })();

                                        return (
                                            <g
                                                key={i}
                                                style={{ color: e.tone }}
                                                data-edge={`${e.from}->${e.to}`}
                                            >
                                                <path
                                                    d={d}
                                                    fill="none"
                                                    stroke={e.tone}
                                                    strokeWidth={1.5}
                                                    strokeDasharray={e.dashed ? '5 4' : undefined}
                                                    opacity={0.9}
                                                />
                                                <title>{e.label}</title>
                                            </g>
                                        );
                                    })}

                                    {nodes.map(n => {
                                        const tone =
                                            TONES[n.kind as keyof typeof TONES] || TONES.ecosystem;
                                        let Icon = Globe;
                                        if (n.kind === 'group') Icon = Layers;
                                        else if (n.kind === 'institution') Icon = School;
                                        else if (n.kind === 'employer') Icon = Building2;

                                        return (
                                            <foreignObject
                                                key={n.id}
                                                x={n.x}
                                                y={n.y}
                                                width={n.w}
                                                height={NODE_H}
                                            >
                                                <div
                                                    className={`flex items-start gap-2 px-3 py-2 h-full rounded-lg border bg-card text-card-foreground shadow-sm border-l-[3px] ${tone.border}`}
                                                >
                                                    <Icon
                                                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tone.text}`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-semibold truncate">
                                                            {n.label}
                                                        </div>
                                                        {n.sub && (
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                {n.sub}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </foreignObject>
                                        );
                                    })}

                                    {/* Tier lanes */}
                                    {tierLanes.map((tier, i) => (
                                        <g key={`tier-${i}`}>
                                            {i > 0 && (
                                                <line
                                                    x1={-24}
                                                    y1={tier.y - 44}
                                                    x2={graphWidth + 24}
                                                    y2={tier.y - 44}
                                                    className="stroke-border/40 stroke-[1px]"
                                                />
                                            )}
                                            {tier.label && (
                                                <text
                                                    x={-14}
                                                    y={tier.y + NODE_H / 2 + 3}
                                                    className="text-[10px] font-medium tracking-wider fill-muted-foreground/70"
                                                >
                                                    {tier.label}
                                                </text>
                                            )}
                                        </g>
                                    ))}
                                </g>
                            </svg>
                        );
                    })()}
                </div>

                <p className="text-xs text-muted-foreground">
                    Showing up to {MAX_PER_TIER} entities per tier.
                </p>
            </DialogContent>
        </Dialog>
    );
}
