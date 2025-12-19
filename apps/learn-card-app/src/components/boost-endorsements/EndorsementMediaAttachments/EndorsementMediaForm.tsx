import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import EndorsementAttachmentsList from './EndorsementAttachmentsList';
import EndorsementMediaAttachmentUploader from './EndorsementMediaAttachmentUploader';

import { useModal, ModalTypes } from 'learn-card-base';

import { EndorsementState } from '../EndorsementForm/endorsement-state.helpers';

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
            <h4 className="text-sm text-indigo-500 font-semibold text-left">Optional</h4>
            <p className="text-[17px] text-grayscale-900 text-left">
                Add any <span className="font-semibold">links, images, videos,</span> or{' '}
                <span className="font-semibold">documents</span> that support your endorsement.
            </p>
            <button
                onClick={handleAddMedia}
                className="flex items-center justify-between w-full text-[17px] text-grayscale-900 bg-grayscale-100 rounded-[15px] px-[16px] py-4 mt-2 cursor-pointer"
            >
                Add Supporting Media <Plus className="w-6 h-6 text-grayscale-800" />
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
