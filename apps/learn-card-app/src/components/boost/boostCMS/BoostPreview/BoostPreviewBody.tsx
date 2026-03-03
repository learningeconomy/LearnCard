import React from 'react';
import { formatNumber } from '@learncard/helpers';
import { UserProfilePicture, useCurrentUser } from 'learn-card-base';
import { IonGrid, IonRow } from '@ionic/react';

// import { IonSpinner } from '@ionic/react';

import { filterBoostRecipients } from '../../boostHelpers';

import { BoostRecipientInfo, VC } from '@learncard/types';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

type BoostPreviewBodyProps = {
    recipients: BoostRecipientInfo[];
    recipientCountOverride?: number;
    handleEditOnClick?: () => void;
    showRecipientText?: boolean;
    customRecipientContainerClass?: string;
    customBoostPreviewContainerClass?: string;
    customBoostPreviewContainerRowClass?: string;
    canEdit?: boolean;
    nameOverride?: string;
    credential?: VC;
};

export const BoostPreviewBody: React.FC<BoostPreviewBodyProps> = ({
    recipients = [],
    recipientCountOverride,
    handleEditOnClick,
    showRecipientText = true,
    canEdit = false,
    customRecipientContainerClass = '',
    customBoostPreviewContainerClass,
    customBoostPreviewContainerRowClass,
    nameOverride,
    credential,
}) => {
    const currentUser = useCurrentUser();

    let _recipients = filterBoostRecipients(recipients);

    let count =
        typeof recipientCountOverride === 'number'
            ? recipientCountOverride
            : _recipients?.length ?? 0;

    const recipientsEl = (
        <section
            className={`boost-small-card-body flex items-center justify-center text-center text-[14px] overflow-hidden text-grayscale-500 p-[10px] ${customRecipientContainerClass}`}
        >
            {_recipients?.slice(0, 3)?.map((recipient, index) => {
                const _recipient = recipient.hasOwnProperty('to') ? recipient?.to : recipient;

                return (
                    <div
                        key={index}
                        className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden mx-[-5px]"
                    >
                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-2xl mr-3"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            user={_recipient}
                        />
                    </div>
                );
            })}
            {count > 3 && (
                <span className="small-boost-issue-count ml-[10px] font-semibold">
                    +{formatNumber(count - 3)}
                </span>
            )}
        </section>
    );

    return (
        <IonGrid
            className={`flex gap-[5px] rounded-[20px] w-full ${customBoostPreviewContainerClass}`}
        >
            <IonRow
                className={`w-full flex justify-center flex-col ${customBoostPreviewContainerRowClass}`}
            >
                {showRecipientText && (
                    <>
                        {count > 0 && (
                            <p className="text-grayscale-900 font-semibold">
                                Issued to{' '}
                                <span className="text-grayscale-900 font-semibold">
                                    {formatNumber(count)} {count > 1 ? 'people' : 'person'}
                                </span>
                            </p>
                        )}
                        <p className="text-grayscale-600 font-semibold text-center">
                            by{' '}
                            <span className="font-bold text-gray-900 text-center">
                                {nameOverride || currentUser?.name}
                            </span>
                        </p>
                    </>
                )}
                <div className="flex items-center justify-center mt-[-6px] mb-[5px]">
                    <CredentialVerificationDisplay credential={credential} managedBoost={true} />
                    {count > 0 && (
                        <p className="font-poppins text-[12px] text-grayscale-700 ml-[3px]">
                            {count} {count === 1 ? 'person' : 'people'}
                        </p>
                    )}
                </div>

                {count > 0 ? (
                    recipientsEl
                ) : (
                    <p className="text-grayscale-600 font-semibold text-center mt-2 text-lg">
                        No one has <br /> claimed it yet.
                    </p>
                )}

                {canEdit && (
                    <button
                        onClick={handleEditOnClick}
                        className="text-grayscale-900 shadow-3xl bg-white px-[32px] py-[8px] rounded-full text-lg font-medium normal font-poppins mt-4"
                    >
                        Edit
                    </button>
                )}
            </IonRow>
        </IonGrid>
    );
};

export default BoostPreviewBody;
