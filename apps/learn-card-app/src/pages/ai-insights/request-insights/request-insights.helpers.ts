import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { currentUserStore } from 'learn-card-base';
import { LCNProfile } from '@learncard/types';

import ConnectIcon from 'learn-card-base/svgs/ConnectIcon';
import TrashBin from 'learn-card-base/svgs/TrashBin';

export enum RequestInsightsOptionsEnum {
    requestReminder = 'requestReminder',
    cancelRequest = 'cancelRequest',
    removeConnection = 'removeConnection',
}

export enum RequestInsightStatusEnum {
    accepted = 'accepted',
    pending = 'pending',
}

export const requestInsightsOptions: {
    id: number;
    label: string;
    icon: React.FC<{ className?: string; version?: 'thick' | 'thin' }>;
    type: RequestInsightsOptionsEnum;
}[] = [
    {
        id: 1,
        label: 'Insights Request Reminder',
        icon: ConnectIcon,
        type: RequestInsightsOptionsEnum.requestReminder,
    },
    {
        id: 2,
        label: 'Cancel Insights Request',
        icon: TrashBin,
        type: RequestInsightsOptionsEnum.cancelRequest,
    },
    {
        id: 3,
        label: 'Remove Insights',
        icon: TrashBin,
        type: RequestInsightsOptionsEnum.removeConnection,
    },
];

export const buildTeacherStudentContract = ({
    image = '',
    expiresAt = '',
    reasonForAccessing = 'Your teacher needs this data to view your progress and provide feedback.',
}: {
    image?: string;
    expiresAt?: string;
    reasonForAccessing?: string;
}) => {
    const redirectUrl = !IS_PRODUCTION
        ? 'http://localhost:3000/ai/insights'
        : 'https://learncard.app/ai/insights';

    return {
        contract: {
            read: {
                anonymize: true,
                credentials: {
                    categories: {
                        'AI Insight': { required: false, defaultEnabled: true },
                        'ai-assessment': { required: false, defaultEnabled: true },
                        'ai-topic': { required: false, defaultEnabled: true },
                        'ai-summary': { required: false, defaultEnabled: true },
                        ID: { required: false, defaultEnabled: true },
                        'Work History': { required: false, defaultEnabled: true },
                        Accommodation: { required: false, defaultEnabled: true },
                        Accomplishment: { required: false, defaultEnabled: true },
                        'Learning History': { required: false, defaultEnabled: true },
                        Achievement: { required: false, defaultEnabled: true },
                        'Social Badge': { required: false, defaultEnabled: true },
                        'learning-pathway': { required: false, defaultEnabled: true },
                    },
                },
                personal: {},
            },
            write: {
                credentials: { categories: {} },
                personal: {},
            },
        },
        name: 'AI Insights',
        subtitle: 'Share learning progress with your teacher',
        description: 'Allows your teacher to view selected insights',
        image,
        expiresAt,
        reasonForAccessing,
        needsGuardianConsent: false,
        redirectUrl,
        frontDoorBoostUri: '',
    };
};

/**
 * Creates a Teacher → Student ConsentFlow contract
 */
export const createTeacherStudentContract = async ({
    teacherProfile,
}: {
    teacherProfile: LCNProfile;
}) => {
    const pk =
        currentUserStore.get.currentUserPK() || currentUserStore?.get?.currentUser()?.privateKey;

    if (!pk) throw new Error('Teacher private key not found');

    const teacherWallet = await getBespokeLearnCard(pk, teacherProfile.did);

    const contractDefinition = buildTeacherStudentContract({
        image: teacherProfile?.image,
        expiresAt: '',
        reasonForAccessing:
            'Your teacher needs this data to view your progress and provide feedback.',
    });

    const contractUri = await teacherWallet.invoke.createContract({
        ...contractDefinition,
        autoboosts: [],
        writers: [teacherProfile.profileId],
    });

    return contractUri;
};
