import React from 'react';
import { UserProfilePicture, useCurrentUser } from 'learn-card-base';
import { filterBoostRecipients } from '../../boostHelpers';
import { BoostRecipientInfo } from '@learncard/types';

type CertificatePreviewRecipientsProps = {
    recipients: BoostRecipientInfo[];
};

const CertificatePreviewRecipients: React.FC<CertificatePreviewRecipientsProps> = ({
    recipients,
}) => {
    let _recipients = filterBoostRecipients(recipients);

    return (
        <div className="flex items-center">
            {_recipients?.slice(0, 3)?.map((recipient, index) => {
                const _recipient = recipient.hasOwnProperty('to') ? recipient?.to : recipient;

                return (
                    <div
                        key={index}
                        className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[50px] w-[50px] rounded-full overflow-hidden mx-[-6px] bg-white"
                    >
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-2xl mr-3"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            user={_recipient}
                        />
                    </div>
                );
            })}
            {_recipients?.length > 3 && (
                <div className="bg-grayscale-200 text-grayscale-600 px-[4px] py-[2px] rounded-full ml-[-5px] font-poppins">
                    +{_recipients?.length - 3}
                </div>
            )}
        </div>
    );
};

export default CertificatePreviewRecipients;
