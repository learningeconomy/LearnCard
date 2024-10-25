import React from 'react';
import { format } from 'date-fns';

import TruncateTextBox from './TruncateTextBox';
import IssueHistoryBox from './IssueHistoryBox';
import { VC, VerificationItem } from '@learncard/types';
import VerificationsBox from './VerificationsBox';
import {
    BoostAchievementCredential,
    IssueHistory,
    MediaMetadata,
    VideoMetadata,
} from '../../types';

type TroopIdDetailsProps = {
    credential: VC | BoostAchievementCredential;
    verificationItems: VerificationItem[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    issueHistory?: IssueHistory[];
    showBackButton?: boolean;
    showFrontFace: () => void;
    customDescription?: React.ReactNode;
    customCriteria?: React.ReactNode;
    customIssueHistoryComponent?: React.ReactNode;
    enableLightbox?: boolean;
};

export const TroopIdDetails: React.FC<TroopIdDetailsProps> = ({
    credential,
    verificationItems,
    issueHistory,
    customIssueHistoryComponent,
}) => {
    const expiration = credential.expirationDate
        ? format(new Date(credential.expirationDate), 'MMM dd, yyyy')
        : undefined;

    const isExpired =
        credential.expirationDate &&
        Number(new Date(credential.expirationDate)) < Number(new Date());

    const achievement =
        'achievement' in credential.credentialSubject
            ? credential.credentialSubject.achievement
            : undefined;
    const criteria = achievement?.criteria?.narrative;
    const description = achievement?.description || 'TODO Placeholder description...';

    return (
        <section className="flex flex-col gap-[10px] w-full">
            {(description || expiration) && (
                <TruncateTextBox headerText="Details" subHeaderText="About" text={description}>
                    {/* {expiration && (
                        <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                            Expire{isExpired ? 'd' : 's'} on {expiration}
                        </p>
                    )} */}
                    <div className="flex flex-col gap-[5px] font-notoSans text-[14px] pt-[10px] border-t-[1px] border-solid border-grayscale-200 w-full">
                        <div className="flex gap-[4px]">
                            <span className="font-[600] text-grayscale-900 font-notoSans">
                                Issued by:
                            </span>
                            <span className="text-grayscale-700 font-notoSans">Troop TODO</span>
                        </div>
                        <div className="flex gap-[4px]">
                            <span className="font-[600] text-grayscale-900 font-notoSans">
                                National Network:
                            </span>
                            <span className="text-grayscale-700 font-notoSans">
                                Girl Scouts of TODO
                            </span>
                        </div>
                        <div className="flex gap-[4px]">
                            <span className="font-[600] text-grayscale-900 font-notoSans">
                                Global Network:
                            </span>
                            <span className="text-grayscale-700 font-notoSans">TODO Scouting</span>
                        </div>
                    </div>
                </TruncateTextBox>
            )}

            {issueHistory && issueHistory?.length > 0 ? (
                <IssueHistoryBox
                    issueHistory={issueHistory}
                    customIssueHistoryComponent={customIssueHistoryComponent}
                />
            ) : (
                <TruncateTextBox subHeaderText="History" text="Has not been issued" />
            )}

            {/* <TruncateTextBox subHeaderText="Permissions" text="TODO..." /> */}

            {verificationItems && verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}
        </section>
    );
};

export default TroopIdDetails;
