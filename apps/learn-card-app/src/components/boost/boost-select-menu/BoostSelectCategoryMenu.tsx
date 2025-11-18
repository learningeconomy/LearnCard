import React from 'react';

import { boostCategoryOptions, BoostCategoryOptionsEnum } from '../boost-options/boostOptions';

import useTheme from '../../../theme/hooks/useTheme';

export type BoostSelectCategoryMenuProps = {
    categories: any[];
    onClick?: (type: BoostCategoryOptionsEnum) => void;
    selectedBoostType: any;
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
            {categories?.map(category => {
                const { type } = category;
                const isSelected = type === selectedBoostType;

                const { title } = boostCategoryOptions[type];

                const { Icon, IconWithShape: ThemedIconWithShape } = getThemedCategoryIcons?.(type);

                const { IconWithShape: AllIconWithShape } =
                    boostCategoryOptions?.[BoostCategoryOptionsEnum.all];

                if (type === BoostCategoryOptionsEnum.family) return <></>;

                let icon = null;

                if (ThemedIconWithShape) {
                    icon = <ThemedIconWithShape className="h-[40px] w-[40px]" />;
                } else if (Icon && !ThemedIconWithShape) {
                    icon = <Icon className="h-[40px] w-[40px]" />;
                }

                if (type === BoostCategoryOptionsEnum.all) {
                    icon = <AllIconWithShape className="h-[40px] w-[40px]" />;
                }

                return (
                    <button
                        key={type}
                        role="button"
                        onClick={() => {
                            onClick?.(type);
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
