import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import EndorsementAttachmentsList from './EndorsementAttachmentsList';
import EndorsementMediaAttachmentUploader from './EndorsementMediaAttachmentUploader';

import { useModal, ModalTypes } from 'learn-card-base';

import { EndorsementState } from '../EndorsementForm/endorsement-state.helpers';
import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';

export const EndorsementMediaForm: React.FC<{
    errors: Record<string, string[]>;
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
}> = ({ errors, endorsement, setEndorsement }) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    const handleAddMedia = () => {
        newModal(
            <EndorsementMediaAttachmentUploader
                endorsement={endorsement}
                setEndorsement={setEndorsement}
            />
        );
    };

    return (
        <div className="w-full flex flex-col items-start gap-2 justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
            <h4 className="text-sm text-indigo-500 font-semibold text-left">
                {m['endorsement.optional']()}
            </h4>
            <p className="text-[17px] text-grayscale-900 text-left">
                <TransP
                    m={m['endorsement.media.addAny']}
                    components={[
                        <span className="font-semibold" />,
                        <span className="font-semibold" />,
                    ]}
                />
            </p>
            <button
                onClick={handleAddMedia}
                className="flex items-center justify-between w-full text-[17px] text-grayscale-900 bg-grayscale-100 rounded-[15px] px-[16px] py-4 mt-2 cursor-pointer"
            >
                {m['endorsement.media.addSupporting']()}{' '}
                <Plus className="w-6 h-6 text-grayscale-800" />
            </button>

            {endorsement?.mediaAttachments.length > 0 && (
                <EndorsementAttachmentsList
                    endorsement={endorsement}
                    setEndorsement={setEndorsement}
                />
            )}
        </div>
    );
};

export default EndorsementMediaForm;
