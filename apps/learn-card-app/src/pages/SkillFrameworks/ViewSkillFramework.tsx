import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SkillFramework, SkillFrameworkNode } from 'apps/learn-card-app/src/components/boost/boost';
import { IonFooter } from '@ionic/react';
import { useModal } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import { ThreeDotVertical } from '@learncard/react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

type ViewSkillFrameworkProps = {
    framework: SkillFramework;
};

const ViewSkillFramework: React.FC<ViewSkillFrameworkProps> = ({ framework }) => {
    const { closeModal } = useModal();

    console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    console.log(framework);

    // Local editable copy to support in-place editing in Sheet mode
    const [data, setData] = useState<SkillFramework>(framework);
    useEffect(() => setData(framework), [framework]);
    const skills = data.skills;

    // Mode: 'grid' cards view vs 'sheet' editable table
    const [mode, setMode] = useState<'grid' | 'sheet'>('sheet');

    const ResponsiveGridLayout = WidthProvider(Responsive);
    const GRID_ROW_HEIGHT = 60;
    const CARD_MIN_ROWS = 4;
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Estimate item height based on nested subskills count
    const countDescendants = (node?: SkillFrameworkNode): number => {
        if (!node || !Array.isArray(node.subskills)) return 0;
        return node.subskills.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
    };

    // Build responsive layouts from the skills array with dynamic heights
    const buildLayouts = () => {
        const gen = (cols: number) =>
            skills.map((s, i) => {
                const descendants = countDescendants(s);
                // Base rows for title + a little description space, then add rows for subskills
                const base = 3; // baseline rows
                const extra = Math.ceil(descendants / 2); // heuristic: 2 items per row height
                const h = Math.min(12, base + extra); // cap to avoid overly tall items
                return {
                    i: (s.targetCode || `${s.targetName}-${i}`).toString(),
                    x: i % cols,
                    y: Math.floor(i / cols) * h,
                    w: 1,
                    h,
                    minH: 4,
                };
            });
        return {
            lg: gen(6),
            md: gen(5),
            sm: gen(4),
            xs: gen(2),
            xxs: gen(1),
        };
    };
    const [layouts, setLayouts] = useState<any>(buildLayouts());

    // When skills or mode change, (re)measure card heights and adjust layout h to fit content exactly
    useLayoutEffect(() => {
        if (mode !== 'grid') return;
        // Timeout to allow DOM to paint before measuring
        const id = window.setTimeout(() => {
            const measureH = (key: string) => {
                const el = cardRefs.current[key];
                if (!el) return CARD_MIN_ROWS;
                const px = el.scrollHeight;
                return Math.max(CARD_MIN_ROWS, Math.ceil(px / GRID_ROW_HEIGHT));
            };

            const update = (prev: any, cols: number) => {
                return prev.map((item: any, idx: number) => {
                    const h = measureH(item.i);
                    // Keep x/y/w, only update h
                    return { ...item, h };
                });
            };

            setLayouts((prev: any) => ({
                lg: update(prev.lg || [], 6),
                md: update(prev.md || [], 5),
                sm: update(prev.sm || [], 4),
                xs: update(prev.xs || [], 2),
                xxs: update(prev.xxs || [], 1),
            }));
        }, 0);
        return () => window.clearTimeout(id);
    }, [skills, mode]);

    const NodeItem: React.FC<{ node: SkillFrameworkNode; path: string }> = ({ node, path }) => {
        const [open, setOpen] = useState(true);
        const hasChildren = Array.isArray(node.subskills) && node.subskills.length > 0;

        return (
            <li key={path} className="w-full">
                <div className="flex items-start gap-2">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => setOpen(o => !o)}
                            className="mt-[2px] h-5 w-5 shrink-0 flex items-center justify-center rounded border border-grayscale-300 bg-white text-grayscale-700 hover:bg-grayscale-50"
                            aria-label={open ? 'Collapse' : 'Expand'}
                        >
                            <span className="text-[12px] leading-none">{open ? '-' : '+'}</span>
                        </button>
                    ) : (
                        <span className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-grayscale-300" />
                    )}
                    <div className="flex-1">
                        <div className="text-[14px] font-medium text-grayscale-900 leading-5">
                            {node.targetName}
                        </div>
                        {node.targetDescription && (
                            <div className="text-[12px] text-grayscale-700 leading-5">
                                {node.targetDescription}
                            </div>
                        )}
                        {node.targetFramework && (
                            <div className="text-[11px] text-grayscale-500 leading-4 mt-1">
                                {node.targetFramework}
                            </div>
                        )}
                        {hasChildren && open && (
                            <ul className="mt-2 pl-4 border-l border-grayscale-200 flex flex-col gap-2">
                                {node.subskills!.map((child, i) => (
                                    <NodeItem
                                        key={`${path}-${i}`}
                                        node={child}
                                        path={`${path}-${i}`}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </li>
        );
    };

    // -------- Sheet mode helpers --------
    type FlatRow = {
        path: number[];
        node: SkillFrameworkNode;
        depth: number;
    };

    const flattenNodes = (
        nodes: SkillFrameworkNode[],
        parentPath: number[] = [],
        depth = 0
    ): FlatRow[] => {
        const rows: FlatRow[] = [];
        nodes.forEach((n, idx) => {
            const path = [...parentPath, idx];
            rows.push({ path, node: n, depth });
            if (Array.isArray(n.subskills) && n.subskills.length) {
                rows.push(...flattenNodes(n.subskills, path, depth + 1));
            }
        });
        return rows;
    };

    const makePathKey = (path: number[]) => path.join('.') || 'root';

    const updateNodeAtPath = (
        nodes: SkillFrameworkNode[],
        path: number[],
        updater: (node: SkillFrameworkNode) => SkillFrameworkNode
    ): SkillFrameworkNode[] => {
        if (path.length === 0) return nodes;
        const [head, ...rest] = path;
        return nodes.map((n, i) => {
            if (i !== head) return n;
            if (rest.length === 0) return updater(n);
            const children = Array.isArray(n.subskills) ? n.subskills : [];
            const updatedChildren = updateNodeAtPath(children, rest, updater);
            return { ...n, subskills: updatedChildren };
        });
    };

    const handleChange = (path: number[], field: keyof SkillFrameworkNode, value: string) => {
        setData(prev => ({
            ...prev,
            skills: updateNodeAtPath(prev.skills, path, node => ({ ...node, [field]: value })),
        }));
    };

    // Precompute flat rows for Sheet mode (top-level to respect hooks rules)
    const flatRows = useMemo(() => flattenNodes(skills), [skills]);

    return (
        <div className="h-full relative bg-grayscale-100">
            <section className="h-full bg-grayscale-100 pt-[30px] px-[20px] pb-[200px] overflow-y-auto z-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-semibold text-grayscale-900">Skills</h2>
                    <div className="inline-flex rounded-full bg-white p-1 shadow-button-bottom border border-grayscale-200">
                        <button
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                mode === 'sheet'
                                    ? 'bg-emerald-700 text-white'
                                    : 'text-grayscale-700'
                            }`}
                            onClick={() => setMode('sheet')}
                        >
                            Sheet
                        </button>
                        <button
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                mode === 'grid' ? 'bg-emerald-700 text-white' : 'text-grayscale-700'
                            }`}
                            onClick={() => setMode('grid')}
                        >
                            Grid
                        </button>
                    </div>
                </div>

                {mode === 'sheet' ? (
                    <div className="bg-white border border-grayscale-200 rounded-[12px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead className="bg-grayscale-50 border-b border-grayscale-200">
                                    <tr>
                                        <th className="text-left text-[12px] font-semibold text-grayscale-600 uppercase tracking-wide px-3 py-2 w-[28%]">
                                            Name
                                        </th>
                                        <th className="text-left text-[12px] font-semibold text-grayscale-600 uppercase tracking-wide px-3 py-2 w-[18%]">
                                            Framework
                                        </th>
                                        <th className="text-left text-[12px] font-semibold text-grayscale-600 uppercase tracking-wide px-3 py-2 w-[34%]">
                                            Description
                                        </th>
                                        <th className="text-left text-[12px] font-semibold text-grayscale-600 uppercase tracking-wide px-3 py-2 w-[12%]">
                                            Code
                                        </th>
                                        <th className="text-left text-[12px] font-semibold text-grayscale-600 uppercase tracking-wide px-3 py-2 w-[8%]">
                                            Type
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flatRows.map(({ path, node, depth }) => (
                                        <tr
                                            key={makePathKey(path)}
                                            className="border-b border-grayscale-100"
                                        >
                                            <td className="px-3 py-2">
                                                <div className="flex items-center">
                                                    <div style={{ width: depth * 16 }} />
                                                    <input
                                                        className="w-full bg-transparent border border-grayscale-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-grayscale-900"
                                                        value={node.targetName || ''}
                                                        onChange={e =>
                                                            handleChange(
                                                                path,
                                                                'targetName',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Name"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full bg-transparent border border-grayscale-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-grayscale-900"
                                                    value={node.targetFramework || ''}
                                                    onChange={e =>
                                                        handleChange(
                                                            path,
                                                            'targetFramework' as any,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Framework"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full bg-transparent border border-grayscale-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-grayscale-900"
                                                    value={node.targetDescription || ''}
                                                    onChange={e =>
                                                        handleChange(
                                                            path,
                                                            'targetDescription' as any,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Description"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full bg-transparent border border-grayscale-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-grayscale-900"
                                                    value={node.targetCode || ''}
                                                    onChange={e =>
                                                        handleChange(
                                                            path,
                                                            'targetCode' as any,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Code"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full bg-transparent border border-grayscale-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-200 text-grayscale-900"
                                                    value={node.targetType || ''}
                                                    onChange={e =>
                                                        handleChange(
                                                            path,
                                                            'targetType' as any,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Type"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <ResponsiveGridLayout
                        className="layout"
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 6, md: 5, sm: 4, xs: 2, xxs: 1 }}
                        rowHeight={60}
                        margin={[16, 16]}
                        containerPadding={[0, 0]}
                        layouts={layouts}
                        isResizable
                        isDraggable={false}
                        useCSSTransforms
                    >
                        {skills.map((skill, index) => {
                            const key = (
                                skill.targetCode || `${skill.targetName}-${index}`
                            ).toString();
                            return (
                                <div
                                    key={key}
                                    ref={el => (cardRefs.current[key] = el)}
                                    className="bg-white rounded-[12px] shadow-card p-[12px] border border-grayscale-200 overflow-y-auto"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="text-[12px] font-medium text-grayscale-500 leading-5">
                                                {skill.targetFramework || 'Skill'}
                                            </div>
                                            <div className="text-[16px] font-semibold text-grayscale-900 leading-6">
                                                {skill.targetName}
                                            </div>
                                        </div>
                                    </div>
                                    {skill.targetDescription && (
                                        <p className="mt-2 text-[12px] text-grayscale-700 leading-5 line-clamp-2">
                                            {skill.targetDescription}
                                        </p>
                                    )}
                                    {Array.isArray(skill.subskills) &&
                                        skill.subskills.length > 0 && (
                                            <div className="mt-3">
                                                <div className="text-[12px] font-semibold text-grayscale-600 mb-1">
                                                    Subskills
                                                </div>
                                                <ul className="flex flex-col gap-2">
                                                    {skill.subskills.map((sub, i) => (
                                                        <NodeItem
                                                            key={`${key}-sub-${i}`}
                                                            node={sub}
                                                            path={`${key}-sub-${i}`}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                )}
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-grayscale-100 border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    <button
                        onClick={closeModal}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom"
                    >
                        <X className="w-[20px] h-[20px]" />
                    </button>
                    <button
                        onClick={closeModal}
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1"
                    >
                        Import Skills
                    </button>
                    <button
                        // onClick={closeModal}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom"
                    >
                        <Pencil strokeWidth="2" className="w-[20px] h-[20px]" />
                    </button>
                    <button
                        // onClick={closeModal}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom"
                    >
                        <ThreeDotVertical className="w-[20px] h-[20px]" />
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default ViewSkillFramework;
