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
    categoryType: CredentialCategoryEnum;
}> = ({ credential, categoryType }) => {
    const [endorsementRequest, setEndorsementRequest] = useState<EndorsementRequestState>(
        initialEndorsementRequestState
    );

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                <EndorsementRequestFormHeader credential={credential} categoryType={categoryType} />
                <div className="w-full flex flex-col items-center justify-center px-4 pt-4 pb-[150px] bg-grayscale-100 h-full">
                    <EndorsementRequestOptions
                        credential={credential}
                        categoryType={categoryType}
                        endorsementRequest={endorsementRequest}
                        setEndorsementRequest={setEndorsementRequest}
                    />
                </div>
            </section>
            <EndorsementRequestFormFooter />
        </section>
    );
};

export default EndorsementRequestForm;
