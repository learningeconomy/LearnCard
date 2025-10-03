import React, { useState } from 'react';

import AlignmentRow from './AlignmentRow';
import InfoIcon from '../svgs/InfoIcon';
import InfoBox from './InfoBox';

type Alignment = {
    targetUrl: string;
    targetName: string;
    targetFramework: string;
};

type AlignmentsBoxProps = {
    alignment: Alignment | Alignment[];
    style: 'Certificate' | 'boost';
};

const AlignmentsBox: React.FC<AlignmentsBoxProps> = ({ alignment, style }) => {
    const [showInfo, setShowInfo] = useState(false);
    const alignmentText = `
    Alignments in your Open Badge credential link your achievement to established frameworks, standards, or competencies. 
    Each alignment shows how your boost directly relates to skills, knowledge areas, and professional standards that are recognized in your field.
    `;

    const alignments = Array.isArray(alignment)
        ? alignment.map((object, index) => (
              <AlignmentRow
                  key={index}
                  url={object.targetUrl}
                  name={object.targetName}
                  framework={object.targetFramework}
              />
          ))
        : alignment && (
              <AlignmentRow
                  url={alignment.targetUrl}
                  name={alignment.targetName}
                  framework={alignment.targetFramework}
              />
          );

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full">
            <div className="flex w-full items-center">
                <h3
                    className={
                        style === 'Certificate'
                            ? 'text-[17px] text-grayscale-900 font-poppins'
                            : 'text-[22px] font-mouse'
                    }
                >
                    Alignments
                </h3>
                <button className="ml-auto" onClick={() => setShowInfo(!showInfo)}>
                    <InfoIcon color={showInfo ? '#6366F1' : undefined} />
                </button>
            </div>
            {showInfo && <InfoBox text={alignmentText} handleClose={() => setShowInfo(false)} />}
            {alignments}
        </div>
    );
};

export default AlignmentsBox;
