/**
 * MapNode — custom React Flow node for pathway nodes.
 *
 * Visual states:
 *   - inFocus (depth ≤ 2): full card with title + status chip
 *   - outOfFocus (depth > 2): dimmed + smaller, so the whole graph is
 *     still visible but the focus area stands out (docs § 10 progressive
 *     disclosure)
 */

import React from 'react';

import { Handle, Position } from '@xyflow/react';

import type { PathwayNode } from '../types';

export type MapNodeData = {
    node: PathwayNode;
    inFocus: boolean;
    isFocusNode: boolean;
} & Record<string, unknown>;

const STATUS_STYLES: Record<PathwayNode['progress']['status'], string> = {
    'not-started': 'bg-grayscale-100 text-grayscale-600 border-grayscale-200',
    'in-progress': 'bg-amber-50 text-amber-700 border-amber-100',
    stalled: 'bg-red-50 text-red-700 border-red-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    skipped: 'bg-grayscale-100 text-grayscale-400 border-grayscale-200',
};

const STATUS_LABELS: Record<PathwayNode['progress']['status'], string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    stalled: 'Stalled',
    completed: 'Done',
    skipped: 'Skipped',
};

const MapNode: React.FC<{ data: MapNodeData }> = ({ data }) => {
    const { node, inFocus, isFocusNode } = data;

    return (
        <div
            className={`font-poppins transition-opacity ${
                inFocus ? 'opacity-100' : 'opacity-40'
            }`}
            style={{ width: 200 }}
        >
            <Handle type="target" position={Position.Left} className="!bg-grayscale-300 !border-0" />

            <div
                className={`p-3 rounded-2xl border bg-white ${
                    isFocusNode
                        ? 'border-grayscale-900 shadow-md'
                        : 'border-grayscale-200'
                }`}
            >
                <p className="text-sm font-semibold text-grayscale-900 leading-snug line-clamp-2 mb-2">
                    {node.title}
                </p>

                <span
                    className={`inline-block text-[10px] font-medium uppercase tracking-wide border rounded-full px-2 py-0.5 ${
                        STATUS_STYLES[node.progress.status]
                    }`}
                >
                    {STATUS_LABELS[node.progress.status]}
                </span>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-grayscale-300 !border-0" />
        </div>
    );
};

export default MapNode;
