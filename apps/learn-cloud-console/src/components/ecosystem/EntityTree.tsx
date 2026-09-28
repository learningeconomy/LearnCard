import { useState } from 'react';
import { Badge } from '../ui/badge';
import { ChevronRight, Crown } from 'lucide-react';
import { kindColors, kindIcon } from '../../lib/entity-taxonomy';
import { LABELS } from '../../lib/labels';
import { Link } from 'wouter';
import { cn } from '../../lib/utils';

type UnifiedEntity = {
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
    groupNames?: string[];
};

type TreeNode = {
    entity: UnifiedEntity;
    children: TreeNode[];
};

interface Props {
    entities: UnifiedEntity[];
    expandAll?: boolean;
}

const countAll = (node: TreeNode): number => node.children.reduce((n, c) => n + 1 + countAll(c), 0);

const Row = ({
    node,
    depth,
    expandedIds,
    toggleExpand,
    expandAll,
}: {
    node: TreeNode;
    depth: number;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    expandAll?: boolean;
}) => {
    const { entity: e, children } = node;
    const open = expandAll || expandedIds.has(e.id);

    const Icon = kindIcon[e.kind];
    const total = countAll(node);
    const isLeaf = children.length === 0;
    const isRoot = e.kind === 'ecosystem' && e.slugPath?.length === 1;

    const content = (
        <div className="group flex items-center gap-2 sm:gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            {!isLeaf && (
                <button
                    type="button"
                    aria-label={open ? 'Collapse' : 'Expand'}
                    onClick={ev => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        toggleExpand(e.id);
                    }}
                    className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <ChevronRight
                        className={cn('w-4 h-4 transition-transform', open && 'rotate-90')}
                    />
                </button>
            )}

            <div
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    kindColors[e.kind]
                )}
            >
                <Icon className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">
                    {e.name}
                    {isRoot && (
                        <Badge className="bg-gold/15 text-gold hover:bg-gold/15 text-[10px] ml-2 align-middle gap-1">
                            <Crown className="w-3 h-3" />
                            {LABELS.root}
                        </Badge>
                    )}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {e.typeLabel}
                    {e.subtitle ? ` · ${e.subtitle}` : ''}
                </p>
            </div>

            {total > 0 && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                    {LABELS.below(total)}
                </Badge>
            )}
        </div>
    );

    return (
        <div className="min-w-0">
            {e.link ? (
                <Link href={e.link} className="block">
                    {content}
                </Link>
            ) : (
                content
            )}

            {!isLeaf && open && (
                <div className="relative ml-4 sm:ml-6 pl-4 sm:pl-5 mt-2 space-y-2 border-l border-dashed border-border">
                    {children.map(child => (
                        <div key={child.entity.id} className="relative">
                            <span className="absolute -left-4 sm:-left-5 top-6 w-4 sm:w-5 border-t border-dashed border-border" />
                            <Row
                                node={child}
                                depth={depth + 1}
                                expandedIds={expandedIds}
                                toggleExpand={toggleExpand}
                                expandAll={expandAll}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export function EntityTree({ entities, expandAll }: Props) {
    const tree: TreeNode[] = [];
    const nodeMap = new Map<string, TreeNode>();

    entities.forEach(e => {
        nodeMap.set(e.id, { entity: e, children: [] });
    });

    entities.forEach(e => {
        const node = nodeMap.get(e.id)!;
        let addedToParent = false;

        if (e.kind === 'ecosystem' && e.slugPath && e.slugPath.length > 1) {
            const parentId = e.slugPath[e.slugPath.length - 2];
            const parentNode = nodeMap.get(parentId);
            if (parentNode) {
                parentNode.children.push(node);
                addedToParent = true;
            }
        } else if (e.kind !== 'ecosystem' && e.ownerEcosystemId) {
            const parentNode = nodeMap.get(e.ownerEcosystemId);
            if (parentNode) {
                parentNode.children.push(node);
                addedToParent = true;
            }
        }

        if (!addedToParent) {
            tree.push(node);
        }
    });

    const kindOrder = {
        ecosystem: 0,
        institution: 1,
        employer: 2,
        group: 3,
    };

    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            const aIsRoot = a.entity.kind === 'ecosystem' && a.entity.slugPath?.length === 1;
            const bIsRoot = b.entity.kind === 'ecosystem' && b.entity.slugPath?.length === 1;
            if (aIsRoot && !bIsRoot) return -1;
            if (!aIsRoot && bIsRoot) return 1;

            const kindDiff = kindOrder[a.entity.kind] - kindOrder[b.entity.kind];
            if (kindDiff !== 0) return kindDiff;

            return a.entity.name.localeCompare(b.entity.name);
        });
        nodes.forEach(n => sortNodes(n.children));
    };

    sortNodes(tree);

    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        tree.forEach(rootNode => {
            initial.add(rootNode.entity.id);
            rootNode.children.forEach(childNode => {
                initial.add(childNode.entity.id);
            });
        });
        return initial;
    });

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (tree.length === 0) return null;

    return (
        <div className="space-y-2">
            {tree.map(node => (
                <Row
                    key={node.entity.id}
                    node={node}
                    depth={0}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                    expandAll={expandAll}
                />
            ))}
        </div>
    );
}
