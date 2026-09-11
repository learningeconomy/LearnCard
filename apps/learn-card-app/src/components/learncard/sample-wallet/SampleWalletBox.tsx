import React, { useState } from 'react';
import { useToast, ToastTypeEnum } from 'learn-card-base';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import { useSampleWallet } from './useSampleWallet';
import PersonaSelectorModal from './PersonaSelectorModal';

const SampleWalletBox: React.FC = () => {
    const { isActive, activePersonaName, exitSampleWallet } = useSampleWallet();
    const { presentToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const handleExit = async () => {
        setIsExiting(true);
        try {
            await exitSampleWallet();
        } catch (error) {
            presentToast('Something went wrong. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsExiting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-[20px] items-center justify-center p-[15px] rounded-[15px] bg-white shadow-bottom-2-4 mt-4">
                <div className="flex flex-col gap-[5px] w-full">
                    <h2 className="text-grayscale-900 font-notoSans text-[20px] flex items-center">
                        Sample Wallet
                        {isActive && <CircleCheckmark className="h-[32px] w-[32px] ml-auto" />}
                    </h2>
                    <p className="text-grayscale-600 font-notoSans text-[14px]">
                        Explore a realistic wallet for your role. Nothing is added to your account.
                    </p>
                </div>

                {!isActive ? (
                    <button
                        className="py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center bg-grayscale-900 hover:opacity-90 transition-opacity"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Try a Sample Wallet
                    </button>
                ) : (
                    <div className="w-full flex flex-col gap-3">
                        <div className="text-sm text-grayscale-600 text-center">
                            Active:{' '}
                            <span className="font-semibold text-grayscale-900">
                                {activePersonaName}
                            </span>
                        </div>
                        <button
                            className="py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-700 border border-grayscale-300 w-full flex gap-[10px] items-center justify-center hover:bg-grayscale-10 transition-colors disabled:opacity-60"
                            onClick={handleExit}
                            disabled={isExiting}
                        >
                            {isExiting ? (
                                <>
                                    Closing Sample Wallet...
                                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                </>
                            ) : (
                                'Back to My Wallet'
                            )}
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && <PersonaSelectorModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default SampleWalletBox;
