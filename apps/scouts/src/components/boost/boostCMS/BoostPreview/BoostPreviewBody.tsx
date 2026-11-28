import React from 'react';
import { UserProfilePicture, useCurrentUser } from 'learn-card-base';
import * as m from '../../../../paraglide/messages.js';
import { TransP } from '../../../../i18n/TransP';

//
import { BoostRecipientInfo } from '@learncard/types';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppGrid, AppRow } from 'learn-card-base/ui/layout';

type BoostPreviewBodyProps = {
    recipients: BoostRecipientInfo[];
    recipientCountOverride?: number;
    handleEditOnClick?: () => void;
    showRecipientText?: boolean;
    customRecipientContainerClass?: string;
    customBoostPreviewContainerClass?: string;
    customBoostPreviewContainerRowClass?: string;
    canEdit?: boolean;
    hideBodyPreviewOnCard?: boolean;
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
    hideBodyPreviewOnCard,
}) => {
    const currentUser = useCurrentUser();

    const _recipients = [];

    if (recipients?.length > 0) {
        recipients?.forEach(recipient => {
            // rendering state.issueTo recipients
            if (!recipient.hasOwnProperty('to')) {
                _recipients.push(recipient);
                return;
            }

            // rendering boost recipients
            if (!_recipients?.find(_r => _r?.to?.profileId === recipient?.to?.profileId)) {
                _recipients.push(recipient);
            }
        });
    }

    const count =
        typeof recipientCountOverride === 'number'
            ? recipientCountOverride
            : (_recipients?.length ?? 0);

    const recipientsEl = (
        <section
            className={`boost-small-card-body flex justify-center items-center text-center text-[14px] overflow-hidden text-grayscale-500 p-[10px] ${customRecipientContainerClass}`}
        >
            {_recipients?.slice(0, 3)?.map((recipient, index) => {
                const _recipient = recipient.hasOwnProperty('to') ? recipient?.to : recipient;

                return (
                    <div
                        key={index}
                        className="profile-thumb-img border-2 border-white border-solid  vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden mx-[-5px]"
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

    return (
        <AppGrid
            className={`flex gap-[5px] rounded-[20px] w-full ${customBoostPreviewContainerClass}`}
        >
            <AppRow
                className={`w-full flex justify-center flex-col ${customBoostPreviewContainerRowClass}`}
            >
                {showRecipientText && (
                    <>
                        {count > 0 && (
                            <p>
                                <TransP
                                    m={m['boostCMS.issuedToCount']}
                                    values={{
                                        count: String(count),
                                        person:
                                            count === 1
                                                ? m['boostCMS.person']()
                                                : m['boostCMS.people'](),
                                    }}
                                    components={[
                                        <span
                                            key="c"
                                            className="text-grayscale-900 font-semibold"
                                        />,
                                    ]}
                                />
                            </p>
                        )}
                        <p className="text-grayscale-600 font-semibold">
                            <TransP
                                m={m['boostCMS.by']}
                                values={{ name: currentUser?.name ?? '' }}
                                components={[
                                    <span
                                        key="n"
                                        className="font-bold text-gray-900 text-center"
                                    />,
                                ]}
                            />
                        </p>
                    </>
                )}

                {!hideBodyPreviewOnCard && count > 0 && recipientsEl}

                {!hideBodyPreviewOnCard && count === 0 && (
                    <p className="text-grayscale-600 font-semibold text-center mt-0 text-sm leading-5">
                        {m['boostCMS.notClaimed']()}
                    </p>
                )}

                {/* {canEdit && (
                    <button
                        onClick={handleEditOnClick}
                        className="text-grayscale-900 shadow-3xl bg-white px-[32px] py-[8px] rounded-full text-xl font-medium mt-4"
                    >
                        Edit
                    </button>
                )} */}
            </AppRow>
        </AppGrid>
    );
};

export default BoostPreviewBody;
