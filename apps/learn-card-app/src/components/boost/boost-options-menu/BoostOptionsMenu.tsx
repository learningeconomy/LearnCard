import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import ShareLinkCreate from '../../share-links/ShareLinkCreate';

import * as m from '../../../paraglide/messages.js';
import TrashBin from '../../svgs/TrashBin';
import Settings from '../../svgs/Settings';
import ShareBoostLink from './ShareBoostLink';
import JsonPreviewModal from './JsonPreviewModal';
import BracketsIcon from '../../svgs/BracketsIcon';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import Star from 'learn-card-base/svgs/Star';
import TimeCircle from 'learn-card-base/svgs/TimeCircle';

import {
    ModalTypes,
    ToastTypeEnum,
    getLogger,
    useModal,
    useConfirmation,
    useGetRecordForUri,
    useToast,
} from 'learn-card-base';

import { VC, UnsignedVC } from '@learncard/types';
import { BoostMenuType } from '../hooks/useBoostMenu';
import useFeaturedCredentials, {
    FeaturedCredentialsLimitError,
} from '../hooks/useFeaturedCredentials';
import { LCR } from 'learn-card-base/types/credential-records';
import {
    MAX_FEATURED_CREDENTIALS,
    getFeaturableCredentialUri,
} from './featuredCredentials.helpers';

const log = getLogger('boost-options-menu');

const CANCEL_BUTTON_CLASS_NAME =
    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-4 min-w-[100px]';
const CONFIRM_BUTTON_CLASS_NAME =
    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-4 min-w-[100px]';

const FeaturedConfirmationCopy: React.FC<{ title: string; body: string }> = ({ title, body }) => (
    <div className="flex flex-col items-center gap-1 text-center mb-4 font-poppins">
        <h2 className="text-lg font-semibold text-grayscale-900">{title}</h2>
        <p className="text-sm text-grayscale-600 leading-relaxed">{body}</p>
    </div>
);

type BoostOptionsMenuProps = {
    handleCloseModal: () => void;
    handleDelete: () => Promise<void>;
    boost: VC | UnsignedVC;
    boostUri?: string;
    record?: Partial<LCR>;
    menuType?: BoostMenuType;
    categoryType?: string;
    handleManageIssuances?: () => void;
    /**
     * Earned credentials only: opens the previous-version history sheet. Provided by the
     * caller only when encrypted local history exists on the record.
     */
    onViewHistory?: () => void;
    /**
     * For managed boosts: whether the boost is a DRAFT. Deleting is only offered for drafts
     * (a LIVE managed boost has issued credentials). When omitted, delete is left enabled to
     * preserve existing behavior for non-status-aware callers.
     */
    isDraft?: boolean;
};

const BoostOptionsMenu: React.FC<BoostOptionsMenuProps> = ({
    handleCloseModal,
    handleDelete,
    boost,
    boostUri,
    record: _record,
    menuType,
    categoryType,
    handleManageIssuances,
    onViewHistory,
    isDraft,
}) => {
    const confirm = useConfirmation();
    const flags = useFlags();
    const { presentToast } = useToast();
    const featured = useFeaturedCredentials();

    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { data: retrievedRecord } = useGetRecordForUri(
        _record?.uri,
        Boolean(menuType === BoostMenuType.earned && !_record?.id && _record?.uri)
    );

    const record = retrievedRecord || _record;

    const featurableUri =
        menuType === BoostMenuType.earned ? getFeaturableCredentialUri(boost, record) : undefined;

    const presentFeaturedLimitToast = () => {
        presentToast(m['boost.featured.limitReached']({ max: MAX_FEATURED_CREDENTIALS }), {
            type: ToastTypeEnum.Error,
            hasDismissButton: true,
        });
    };

    const handleFeatureOnProfile = async (uri: string) => {
        const confirmed = await confirm({
            text: (
                <FeaturedConfirmationCopy
                    title={m['boost.featured.featureConfirm.title']()}
                    body={m['boost.featured.featureConfirm.text']()}
                />
            ),
            confirmText: m['boost.featured.featureConfirm.confirm'](),
            cancelText: m['common.cancel'](),
            cancelButtonClassName: CANCEL_BUTTON_CLASS_NAME,
            confirmButtonClassName: CONFIRM_BUTTON_CLASS_NAME,
        });
        if (!confirmed) return;

        try {
            await featured.featureCredential(uri);
            presentToast(m['toasts.boost.featuredOnProfile'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            handleCloseModal();
        } catch (error) {
            if (error instanceof FeaturedCredentialsLimitError) {
                presentFeaturedLimitToast();
                return;
            }

            log.error('featureCredential::error', error);
            presentToast(m['toasts.boost.featuredUpdateFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleRemoveFromProfile = async (uri: string) => {
        const confirmed = await confirm({
            text: (
                <FeaturedConfirmationCopy
                    title={m['boost.featured.removeConfirm.title']()}
                    body={m['boost.featured.removeConfirm.text']()}
                />
            ),
            confirmText: m['boost.featured.removeConfirm.confirm'](),
            cancelText: m['common.cancel'](),
            cancelButtonClassName: CANCEL_BUTTON_CLASS_NAME,
            confirmButtonClassName: CONFIRM_BUTTON_CLASS_NAME,
        });
        if (!confirmed) return;

        try {
            await featured.unfeatureCredential(uri);
            presentToast(m['toasts.boost.removedFromProfile'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            handleCloseModal();
        } catch (error) {
            log.error('unfeatureCredential::error', error);
            presentToast(m['toasts.boost.featuredUpdateFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const presentShareBoostLink = () => {
        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={boost}
                boostUri={boostUri || record?.uri}
                credentialRecordUri={record?.uri}
                categoryType={categoryType!}
                onShareWithOtherCredentials={
                    flags?.shareMultipleEnabled === true &&
                    menuType === BoostMenuType.earned &&
                    record?.uri
                        ? () =>
                              newModal(
                                  <ShareLinkCreate
                                      initialSelectedUri={record.uri}
                                      onDismiss={closeModal}
                                  />,
                                  {},
                                  { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
                              )
                        : undefined
                }
            />,
            {},
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    const handleShare = async () => {
        handleCloseModal?.();
        presentShareBoostLink();
    };

    const selfBoostConfirmationAlert = async () => {
        await confirm({
            text: m['boost.confirmDelete'](),
            onConfirm: async () => {
                await handleDelete();
                closeAllModals();
            },
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const presentViewJsonModal = () => {
        newModal(
            <JsonPreviewModal boost={boost} />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const boostMenuOptions: {
        id?: number;
        title?: string;
        description?: string;
        disabled?: boolean;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [];

    if (menuType === BoostMenuType.managed && handleManageIssuances) {
        boostMenuOptions.push({
            id: 0,
            title: m['boost.menu.manageIssuances'](),
            icon: <Settings className="text-grayscale-900 w-5 h-5" />,
            onClick: () => handleManageIssuances(),
        });
    }

    // Managed boosts: only offer Delete on DRAFTs (a LIVE managed boost has issued
    // credentials). `isDraft === undefined` preserves prior always-on behavior for callers
    // that don't pass status. Other menu types fall back to "has a record" as before.
    const canDelete = menuType === BoostMenuType.managed ? isDraft !== false : Boolean(record?.id);

    if (canDelete) {
        boostMenuOptions.push({
            id: 1,
            title: m['common.delete'](),
            icon: <TrashBin className="text-grayscale-900" />,
            onClick: () => selfBoostConfirmationAlert(),
        });
    }

    if (menuType === BoostMenuType.earned) {
        boostMenuOptions.push({
            id: 2,
            title: m['common.share'](),
            icon: <ReplyIcon version="2" className="text-grayscale-900" />,
            onClick: () => handleShare(),
        });

        // Featuring needs a publicly resolvable boost URI and a network profile to show it on.
        if (featurableUri && featured.hasProfile) {
            const isFeatured = featured.isFeatured(featurableUri);
            const limitReached = !isFeatured && !featured.canFeatureMore;

            boostMenuOptions.push({
                id: 5,
                title: isFeatured
                    ? m['boost.menu.removeFromProfile']()
                    : m['boost.menu.featureOnProfile'](),
                description: featured.isUpdating
                    ? m['common.updating']()
                    : limitReached
                      ? m['boost.featured.limitHint']({ max: MAX_FEATURED_CREDENTIALS })
                      : undefined,
                disabled: featured.isUpdating || limitReached,
                icon: <Star className="text-grayscale-900 w-5 h-5" />,
                onClick: () => {
                    if (featured.isUpdating) return;
                    if (isFeatured) {
                        handleRemoveFromProfile(featurableUri);
                    } else if (limitReached) {
                        presentFeaturedLimitToast();
                    } else {
                        handleFeatureOnProfile(featurableUri);
                    }
                },
            });
        }

        if (onViewHistory) {
            boostMenuOptions.push({
                id: 4,
                title: m['boost.menu.viewPreviousVersions'](),
                icon: <TimeCircle className="text-grayscale-900 w-5 h-5" />,
                onClick: () => {
                    handleCloseModal();
                    onViewHistory();
                },
            });
        }
    }

    boostMenuOptions.push({
        id: 3,
        title: m['boost.menu.viewData'](),
        icon: <BracketsIcon className="text-grayscale-900" />,
        onClick: () => presentViewJsonModal(),
    });

    return (
        <ul className="w-full flex flex-col items-center justify-center ion-padding">
            {boostMenuOptions?.map(action => {
                const { id, title, description, disabled, icon, onClick } = action;
                return (
                    <li
                        key={id}
                        className="w-full border-b-grayscale-100 border-b-solid border-b-2 last:border-0"
                    >
                        <button
                            className={`text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 ${
                                disabled ? 'opacity-60' : ''
                            }`}
                            type="button"
                            aria-disabled={disabled || undefined}
                            onClick={onClick}
                        >
                            <span className="flex flex-col items-start text-left">
                                <span className="text-grayscale-900">{title}</span>
                                {description && (
                                    <span className="text-xs text-grayscale-500">
                                        {description}
                                    </span>
                                )}
                            </span>
                            {icon}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default BoostOptionsMenu;
