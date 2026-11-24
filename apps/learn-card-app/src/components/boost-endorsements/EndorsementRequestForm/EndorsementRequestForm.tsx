import React, { useState } from 'react';

import EndorsementRequestFormHeader from './EndorsementRequestFormHeader';
import EndorsementRequestFormFooter from './EndorsementRequestFormFooter';
import EndorsementRequestOptions from './EndorsementRequestOptions';

import {
    initialEndorsementRequestState,
    EndorsementRequestState,
} from './endorsement-request.helpers';

import { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';

export const EndorsementRequestForm: React.FC<{
    credential: VC;
    shareCredentialUri?: string;
    categoryType: CredentialCategoryEnum;
}> = ({ credential, shareCredentialUri, categoryType }) => {
    const [endorsementRequest, setEndorsementRequest] = useState<EndorsementRequestState>(
        initialEndorsementRequestState
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div className="h-full w-full overflow-y-auto pt-4">
                <section className="bg-white max-w-[800px] w-full mx-auto rounded-[20px]">
                    <EndorsementRequestFormHeader
                        credential={credential}
                        categoryType={categoryType}
                    />
                    <div className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-[150px] bg-grayscale-100 h-full">
                        <EndorsementRequestOptions
                            credential={credential}
                            shareCredentialUri={shareCredentialUri}
                            categoryType={categoryType}
                            endorsementRequest={endorsementRequest}
                            setEndorsementRequest={setEndorsementRequest}
                        />
                    </div>
                </section>
            </div>
            <EndorsementRequestFormFooter />
        </div>
    );
};

export default EndorsementRequestForm;
