import React from 'react';
import useTheme from '../../../theme/hooks/useTheme';
import { boostCategoryMetadata, BoostCategoryOptionsEnum } from 'learn-card-base';

export type BoostSelectCategoryMenuProps = {
    categories: BoostCategoryOptionsEnum[];
    onClick?: (category: BoostCategoryOptionsEnum) => void;
    selectedBoostType: BoostCategoryOptionsEnum;
    closeModal: () => void;
};

export const BoostSelectCategoryMenu: React.FC<BoostSelectCategoryMenuProps> = ({
    categories,
    onClick,
    selectedBoostType,
    closeModal,
}) => {
    const { getThemedCategoryIcons } = useTheme();

    return (
        <div className="p-[10px] flex flex-col">
            {categories?.map(boostCategory => {
                const isSelected = boostCategory === selectedBoostType;

                const { title } = boostCategoryMetadata[boostCategory];

                const { Icon, IconWithShape: ThemedIconWithShape } = getThemedCategoryIcons(
                    boostCategoryMetadata[boostCategory].credentialType
                );

                const { IconWithShape: AllIconWithShape } =
                    boostCategoryMetadata[BoostCategoryOptionsEnum.all];

                if (boostCategory === BoostCategoryOptionsEnum.family) return <></>;

                let icon = null;

                if (ThemedIconWithShape) {
                    icon = <ThemedIconWithShape className="h-[40px] w-[40px]" />;
                } else if (Icon && !ThemedIconWithShape) {
                    icon = <Icon className="h-[40px] w-[40px]" />;
                }

                if (boostCategory === BoostCategoryOptionsEnum.all) {
                    icon = <AllIconWithShape className="h-[40px] w-[40px]" />;
                }

                return (
                    <button
                        key={boostCategory}
                        role="button"
                        onClick={() => {
                            onClick?.(boostCategory);
                            closeModal?.();
                        }}
                        className={`flex items-center gap-[10px] rounded-[15px] p-[10px] ${
                            isSelected ? 'bg-grayscale-100 font-[600]' : ''
                        }`}
                    >
                        {icon}
                        <p className="font-poppins text-grayscale-800 text-[18px]">{title}</p>
                    </button>
                );
            })}
        </div>
    );
};

export default BoostSelectCategoryMenu;
