import React from 'react';

import { BoostVCTypeOptionButtonProps } from '../boostOptions';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import {
    useModal,
    useIsCurrentUserLCNUser,
    ModalTypes,
    useGetCredentialList,
} from 'learn-card-base';
import useJoinLCNetworkModal from '../../../network-prompts/hooks/useJoinLCNetworkModal';
import NewAiSessionContainer from '../../../new-ai-session/NewAiSessionContainer';

import useTheme from '../../../../theme/hooks/useTheme';

export const BoostVCTypeOptionButton: React.FC<BoostVCTypeOptionButtonProps> = ({
    IconComponent,
    iconCircleClass,
    iconClassName,
    title,
    categoryType,
    setSelectedCategoryType,
    isActive,
    ShapeIcon,
    shapeColor,
    iconStyles,
    WalletIcon,
    onClickOverride,
}) => {
    const { getThemedCategoryIcons } = useTheme();
    const { Icon, IconWithShape } = getThemedCategoryIcons(categoryType);

    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen });
    const {
        data: currentLCNUser,
        isLoading: currentLCNUserLoading,
        refetch,
    } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];
    const getSingular = (word: string) => {
        if (word.endsWith('ies')) {
            return word.slice(0, -3) + 'y';
        } else if (word.endsWith('s')) {
            return word.slice(0, -1);
        }
        return word;
    };
    const handleNewSession = (showAiAppSelector?: boolean) => {
        if (!currentLCNUser && !currentLCNUserLoading) {
            handlePresentJoinNetworkModal();
            return;
        }

        newModal(
            <NewAiSessionContainer
                existingTopics={existingTopics}
                showAiAppSelector={showAiAppSelector}
                // shortCircuitStep={shortCircuitStep}
            />,
            {
                hideButton: true,
            },
            {
                mobile: ModalTypes.FullScreen,
                desktop: ModalTypes.Right,
            }
        );
    };
    return (
        <>
            <button
                onClick={() => {
                    if (onClickOverride) {
                        onClickOverride(categoryType);
                        return;
                    }

                    if (title === 'AI Sessions') {
                        handleNewSession(true);
                    } else {
                        setSelectedCategoryType(categoryType);
                    }
                }}
                className="relative flex items-center justify-center bg-white text-black px-[18px] py-[6px] font-poppins text-lg font-normal text-center w-full max-w-[90%] mb-4"
            >
                <div
                    className={`flex items-center justify-center absolute h-[35px] w-[35px] left-1 rounded-full ${iconCircleClass}`}
                >
                    {IconWithShape ? (
                        <IconWithShape className={`h-[40px] ${iconClassName}`} />
                    ) : (
                        <Icon className={`h-[40px] ${iconClassName}`} />
                    )}
                    {/* {IconComponent && <IconComponent className={`h-[30px] ${iconClassName}`} />}
                    {ShapeIcon && (
                        <>
                            <ShapeIcon className={`${shapeColor}`} />
                            <WalletIcon
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${iconStyles}`}
                            />
                        </>
                    )} */}
                </div>
                {getSingular(title)}
                {isActive && (
                    <div
                        className={`flex items-center justify-center absolute h-[35px] w-[35px] right-1 rounded-full`}
                    >
                        <Checkmark
                            className={`h-[30px] w-[30px] text-emerald-600`}
                            strokeWidth="4"
                        />
                    </div>
                )}
            </button>
        </>
    );
};

export default BoostVCTypeOptionButton;
