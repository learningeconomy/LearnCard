import React from 'react';

import OpenSyllabusCourse from './openSyllabus-course/OpenSyllabusCourse';
import OpenSyllabusSchool from './openSyllabus-course/OpenSyllabusSchool';
import OpenSyllabusTextbooks from './openSyllabus-course/OpenSyllabusTextbooks';
import OpenSyllabusLearningOutcomes from './openSyllabus-course/OpenSyllabusLearningOutcomes';

import { VC } from '@learncard/types';

const OpenSyllabusMetaData: React.FC<{ credential: VC }> = ({ credential }) => {
    return (
        <>
            {/* course meta data */}
            <OpenSyllabusCourse credential={credential} />

            {/* school */}
            <OpenSyllabusSchool credential={credential} />

            {/* textbooks */}
            <OpenSyllabusTextbooks credential={credential} />

            {/* learning outcomes */}
            <OpenSyllabusLearningOutcomes credential={credential} />
        </>
    );
};

export default OpenSyllabusMetaData;
