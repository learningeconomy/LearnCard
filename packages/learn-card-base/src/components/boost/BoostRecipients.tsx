import React from 'react';
import { UserProfilePicture } from '../profilePicture/ProfilePicture';
import { IonSpinner } from '@ionic/react';

type BoostRecipientsProps = {
    recipients: any[];
    recipientsLoading?: boolean;
    customContainerClass?: string;
};

const BoostRecipients: React.FC<BoostRecipientsProps> = ({
    recipients = [],
    recipientsLoading,
    customContainerClass,
}) => {
    if (recipients?.length > 0) {
        recipients?.forEach(recipient => {
            // rendering state.issueTo recipients
            if (!recipient.hasOwnProperty('to')) {
                recipients.push(recipient);
                return;
            }

            // rendering boost recipients
            if (!recipients?.find(_r => _r?.to?.profileId === recipient?.to?.profileId)) {
                recipients.push(recipient);
            }
        });
    }

    let count = recipients?.length ?? 0;

    return (
        <section className={`boost-recipients-container flex ${customContainerClass}`}>
            {recipientsLoading && <IonSpinner />}
            {recipients?.slice(0, 3)?.map((recipient, index) => {
                const _recipient = recipient.hasOwnProperty('to') ? recipient?.to : recipient;

                return (
                    <div
                        key={index}
                        className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[25px] w-[25px] rounded-full overflow-hidden mx-[-5px]"
                    >
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-2xl mr-3"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            user={_recipient}
                            customSize={500}
                        />
                    </div>
                );
            })}
            {count > 3 && (
                <span className="small-boost-issue-count ml-[10px] font-semibold">
                    +{count - 3}
                </span>
            )}
        </section>
    );
};

export default BoostRecipients;
