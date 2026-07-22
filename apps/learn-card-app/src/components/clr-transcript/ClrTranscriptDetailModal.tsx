import React from 'react';

import ClrTranscriptFullPage from './surfaces/ClrTranscriptFullPage';
import { useVerification } from '../boost/boostCMS/BoostPreview/BoostPreview';
import VerificationsBox from '../../pages/ids/view-id/IdDetails/VerificationsBox';

import type { ClrTranscriptDisplayModel, ViewOptions } from '../../helpers/clrRenderer.helpers';

import { VC } from '@learncard/types';

const ClrTranscriptDetailModal: React.FC<{
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
    boost: VC;
    boostUri?: string;
}> = ({ model, options, boost, boostUri }) => {
    const verificationItems = useVerification(boost);

    return (
        <div className="h-full overflow-y-auto pb-[100px]">
            <ClrTranscriptFullPage
                model={model}
                options={options}
                boost={boost}
                boostUri={boostUri}
            />
            {verificationItems.length > 0 && (
                <div className="px-4 pb-10">
                    <VerificationsBox verificationItems={verificationItems} />
                </div>
            )}
        </div>
    );
};

export default ClrTranscriptDetailModal;
