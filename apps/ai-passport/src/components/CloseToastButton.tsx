import { useCallback } from 'react';
import CaretUp from './svgs/CaretUp';
import { showToast } from '../stores/toastStore';

const CloseToastButton = () => {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showToast.set(false);
    }, []);

    return (
        <button
            onClick={handleClick}
            className="absolute bottom-[-25px] right-[50%] translate-x-[50%] rounded-full bg-cyan-200 p-4 z-[50] cursor-pointer hover:bg-cyan-300 transition-colors"
            aria-label="Close toast"
        >
            <CaretUp />
        </button>
    );
};

export default CloseToastButton;
