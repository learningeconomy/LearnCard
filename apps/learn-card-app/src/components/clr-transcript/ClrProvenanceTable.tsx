import React from 'react';

import type { CourseDisplayModel, SourceMappedField } from '../../helpers/clrRenderer.helpers';

type Row = {
    field: string;
    value: string;
    sourcePath: string;
    specField: string;
    credentialId?: string;
};

const ClrProvenanceTable: React.FC<{
    course: CourseDisplayModel;
}> = ({ course }) => {
    const pushRow = <T,>(rows: Row[], field: string, f?: SourceMappedField<T>) => {
        if (!f) return;
        rows.push({
            field,
            value: Array.isArray(f.value) ? f.value.join(', ') : String(f.value),
            sourcePath: f.sourcePath,
            specField: f.specField,
            credentialId: f.sourceCredentialId,
        });
    };

    const buildRows = (course: CourseDisplayModel): Row[] => {
        const rows: Row[] = [];
        pushRow(rows, 'Course Name', course.name);
        pushRow(rows, 'Course Code', course.humanCode);
        pushRow(rows, 'Description', course.description);
        pushRow(rows, 'Achievement Type', course.achievementType);
        pushRow(rows, 'Credits Available', course.creditsAvailable);
        pushRow(rows, 'Credits Earned', course.creditsEarned);
        pushRow(rows, 'Term', course.term);
        pushRow(rows, 'Earned', course.earnedAt);
        pushRow(rows, 'Valid Until', course.validUntil);
        for (const [i, result] of course.results.entries()) {
            pushRow(rows, `Result ${i + 1}`, result.value);
            if (result.resultType) pushRow(rows, `Result ${i + 1} Type`, result.resultType);
            if (result.label) pushRow(rows, `Result ${i + 1} Label`, result.label);
            if (result.valueMin) pushRow(rows, `Result ${i + 1} Min`, result.valueMin);
            if (result.valueMax) pushRow(rows, `Result ${i + 1} Max`, result.valueMax);
            if (result.allowedValue) pushRow(rows, `Result ${i + 1} Allowed`, result.allowedValue);
        }
        return rows;
    };

    const rows = buildRows(course);

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                Field Provenance
            </p>
            <div className="rounded-xl border border-grayscale-200 overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-grayscale-50 border-b border-grayscale-200">
                            <th className="text-left px-3 py-2 font-semibold text-grayscale-500">
                                Field
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-grayscale-500">
                                Value
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-grayscale-500">
                                Source path
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-grayscale-500">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-grayscale-100 last:border-0">
                                <td className="px-3 py-2 font-medium text-grayscale-700 whitespace-nowrap">
                                    {row.field}
                                </td>
                                <td
                                    className="px-3 py-2 text-grayscale-900 max-w-[90px] truncate"
                                    title={row.value}
                                >
                                    {row.value}
                                </td>
                                <td className="px-3 py-2 font-mono text-[10px] text-grayscale-400 whitespace-nowrap">
                                    {row.sourcePath}
                                </td>
                                <td className="px-3 py-2">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                        Verified
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] font-mono text-grayscale-400 break-all">
                Source credential: {course.sourceCredentialId}
            </p>
        </div>
    );
};

export default ClrProvenanceTable;
