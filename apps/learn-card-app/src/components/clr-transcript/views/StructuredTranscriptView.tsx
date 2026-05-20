import type { ClrTranscriptDisplayModel } from '../../../helpers/clrRenderer.helpers';
import { formatClrDate } from '../../../helpers/clrRenderer.helpers';
import ClrTranscriptResultsList from '../ClrTranscriptResultsList';

type Props = {
    model: ClrTranscriptDisplayModel;
    showSource?: boolean;
};

const StructuredTranscriptView = ({ model, showSource = false }: Props) => {
    return (
        <div className="space-y-4">
            {model.programs.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-grayscale-900">Programs</p>
                    {model.programs.map(program => (
                        <div
                            key={program.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-xl p-3 space-y-1"
                        >
                            <p className="text-sm text-grayscale-900">
                                {program.name?.value || 'Program'}
                            </p>
                            {program.description?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {program.description.value}
                                </p>
                            )}
                            {(program.earnedAt?.value || program.validUntil?.value) && (
                                <p className="text-xs text-grayscale-500">
                                    {program.earnedAt?.value && `Earned: ${formatClrDate(program.earnedAt.value)}`}
                                    {program.earnedAt?.value && program.validUntil?.value && ' · '}
                                    {program.validUntil?.value && `Expires: ${formatClrDate(program.validUntil.value)}`}
                                </p>
                            )}
                            <ClrTranscriptResultsList results={program.results} showResultType={showSource} />
                        </div>
                    ))}
                </div>
            )}
            <div className="space-y-4">
                <p className="text-sm font-medium text-grayscale-900">Courses</p>
                {(() => {
                    const withTerm = model.courses.filter(c => c.term?.value);
                    const withoutTerm = model.courses.filter(c => !c.term?.value);
                    const termGroups = Array.from(
                        withTerm.reduce((map, course) => {
                            const t = course.term!.value;
                            if (!map.has(t)) map.set(t, []);
                            map.get(t)!.push(course);
                            return map;
                        }, new Map<string, typeof withTerm>())
                    );

                    const renderCourse = (course: (typeof model.courses)[number]) => (
                        <div
                            key={course.sourceCredentialId}
                            className="bg-white border border-grayscale-200 rounded-xl p-3 space-y-1"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {course.humanCode?.value && (
                                            <span className="text-xs font-mono font-medium text-grayscale-600 bg-grayscale-100 px-1.5 py-0.5 rounded">
                                                {course.humanCode.value}
                                            </span>
                                        )}
                                        <p className="text-sm text-grayscale-900">
                                            {course.name?.value || 'Course'}
                                        </p>
                                    </div>
                                    {course.description?.value && (
                                        <p className="text-xs text-grayscale-600 leading-relaxed mt-0.5">
                                            {course.description.value}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                    {course.creditsEarned?.value !== undefined && (
                                        <span className="text-xs font-medium text-grayscale-900 whitespace-nowrap">
                                            {course.creditsEarned.value} cr earned
                                        </span>
                                    )}
                                    {course.creditsAvailable?.value !== undefined && (
                                        <span className="text-xs text-grayscale-500 whitespace-nowrap">
                                            {course.creditsAvailable.value} cr available
                                        </span>
                                    )}
                                </div>
                            </div>
                            {(course.earnedAt?.value || course.validUntil?.value) && (
                                <p className="text-xs text-grayscale-500">
                                    {course.earnedAt?.value && `Earned: ${formatClrDate(course.earnedAt.value)}`}
                                    {course.earnedAt?.value && course.validUntil?.value && ' · '}
                                    {course.validUntil?.value && `Expires: ${formatClrDate(course.validUntil.value)}`}
                                </p>
                            )}
                            <ClrTranscriptResultsList results={course.results} showResultType={showSource} />
                        </div>
                    );

                    return (
                        <>
                            {termGroups.map(([term, courses]) => (
                                <div key={term} className="space-y-2">
                                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                        {term}
                                    </p>
                                    {courses.map(renderCourse)}
                                </div>
                            ))}
                            {withoutTerm.length > 0 && (
                                <div className="space-y-2">
                                    {termGroups.length > 0 && (
                                        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                                            Other
                                        </p>
                                    )}
                                    {withoutTerm.map(renderCourse)}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default StructuredTranscriptView;
