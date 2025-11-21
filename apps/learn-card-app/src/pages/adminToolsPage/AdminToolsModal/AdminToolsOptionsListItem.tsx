import React, { useEffect, useState } from 'react';

import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import AdminToolsOptionsContainer from './AdminToolsOptionsContainer';

import { AdminToolOption, AdminToolOptionsEnum } from './admin-tools.helpers';
import { useModal, ModalTypes, useWallet } from 'learn-card-base';

export const AdminToolOptionsListItem: React.FC<{
    option: AdminToolOption;
    shortCircuitDevTool?: AdminToolOptionsEnum;
}> = ({ option, shortCircuitDevTool }) => {
    const { initWallet } = useWallet();
    const { newModal } = useModal();

    const [count, setCount] = useState<number>(0);

    const { label } = option;

    const getDevToolCount = async () => {
        const wallet = await initWallet();
        if (
            option?.type === AdminToolOptionsEnum.SIGNING_AUTHORITY ||
            shortCircuitDevTool === AdminToolOptionsEnum.SIGNING_AUTHORITY
        ) {
            const signingAuthorities = await wallet?.invoke?.getRegisteredSigningAuthorities();
            setCount(signingAuthorities?.length || 0);
            return;
        } else if (
            option?.type === AdminToolOptionsEnum.API_TOKENS ||
            shortCircuitDevTool === AdminToolOptionsEnum.API_TOKENS
        ) {
            const apiTokens = await wallet?.invoke?.getAuthGrants();
            setCount(apiTokens?.length || 0);
            return;
        }
        setCount(0);
        return;
    };

    useEffect(() => {
        if (shortCircuitDevTool === option?.type) {
            setTimeout(() => {
                newModal(
                    <AdminToolsOptionsContainer option={option} />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
            }, 500);
        }
    }, [shortCircuitDevTool]);

    useEffect(() => {
        getDevToolCount();
    }, [option, shortCircuitDevTool]);

    const handleAdminToolOption = () => {
        setTimeout(() => {
            newModal(
                <AdminToolsOptionsContainer option={option} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        }, 500);
    };

    return (
        <li
            onClick={handleAdminToolOption}
            role="button"
            className="w-full flex items-center justify-between py-[15px] cursor-pointer border-b border-grayscale-200 last:border-b-0"
        >
            <div className="flex flex-col items-start">
                <p
                    className={`text-grayscale-900 text-[17px] font-notoSans font-[600] leading-[24px] tracking-[0.25px] pr-2`}
                >
                    {label}
                </p>
                <p className="text-grayscale-600 text-[14px] font-notoSans font-[400] leading-[21px] tracking-[0.25px]">
                    {option.description}
                </p>
            </div>

            <div className="flex items-center justify-end">
                {count > 0 && (
                    <p className="text-grayscale-500 text-[14px] font-notoSans font-[400] leading-[21px] tracking-[0.25px]">
                        {count}
                    </p>
                )}
                <SlimCaretRight className="w-[25px] h-[26px] text-grayscale-500" />
            </div>
        </li>
    );
};

export default AdminToolOptionsListItem;
