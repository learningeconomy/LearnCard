import React from 'react';
import AddToLearnCardMenu from './AddToLearnCardMenu';
import { useModal } from 'learn-card-base';
import CaretLeft from '../svgs/CaretLeft';
import { X } from 'lucide-react';

const AddToLearnCardMenuWrapper = () => {
    const { closeModal } = useModal();

    return (
        <div className="w-full flex flex-col gap-3 relative">
            <div
                className="flex items-center justify-between w-full max-w-[600px] p-[10px] rounded-[15px] border-4 border-white"
                style={{
                    background: 'linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.80) 100%)',
                    boxShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(5px)',
                }}
            >
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex items-center justify-center h-[32px] w-[32px] rounded-full"
                        aria-label="Close"
                    >
                        <CaretLeft className="h-[18px] w-[18px] text-grayscale-900" />
                    </button>
                    <h2 className="text-[18px] font-poppins font-semibold text-grayscale-900">
                        What would you like to do?
                    </h2>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="flex items-center justify-center absolute right-2 h-[32px] w-[32px] rounded-full"
                        aria-label="Close"
                    >
                        <X className="h-[32px] w-[32px] text-grayscale-600" />
                    </button>
                </div>
            </div>
            <div
                className="w-full max-w-[600px] rounded-[15px] border-4 border-white"
                style={{
                    background: 'linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.80) 100%)',
                    boxShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(5px)',
                }}
            >
                <AddToLearnCardMenu className="bg-white" />
            </div>
        </div>
    );
};

export default AddToLearnCardMenuWrapper;
