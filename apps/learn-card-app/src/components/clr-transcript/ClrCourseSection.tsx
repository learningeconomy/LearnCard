import ClrCourseTable from './ClrCourseTable';

import type {
    ClrTranscriptDisplayModel,
    CourseDisplayModel,
} from '../../helpers/clrRenderer.helpers';

type Props = {
    model: ClrTranscriptDisplayModel;
    onSelectCourse: (course: CourseDisplayModel) => void;
    adminMode?: boolean;
};

const ClrCourseSection = ({ model, onSelectCourse, adminMode = false }: Props) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2 mb-4">
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                    Course History
                </p>
                <p className="text-xs text-grayscale-500">
                    {model.summary.courseCount} course{model.summary.courseCount !== 1 ? 's' : ''}
                    {model.summary.totalCreditsAvailable !== undefined &&
                        `, ${model.summary.totalCreditsAvailable} credits`}
                </p>
            </div>
            <ClrCourseTable
                courses={model.courses}
                onSelectCourse={onSelectCourse}
                adminMode={adminMode}
            />
        </div>
    );
};

export default ClrCourseSection;
