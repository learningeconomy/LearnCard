import { IonSkeletonText } from '@ionic/react';

export const BadgeSkeleton: React.FC<{
    badgeContainerCustomClass?: string;
    badgeCircleCustomClass?: string;
}> = ({ badgeContainerCustomClass, badgeCircleCustomClass }) => {
    return (
        <div
            className={`relative flex items-center justify-center w-full mt-8 mb-8 select-none ${badgeContainerCustomClass} bg-none`}
        >
            <div
                className={`absolute z-10 w-full h-full rounded-br-[100%] rounded-bl-[100%] !bg-none overflow-hidden top-[-10px]`}
            >
                <IonSkeletonText animated={true} style={{ width: '100%', height: '100%' }} />
            </div>
            <div
                className={`relative z-50 flex items-center justify-center rounded-full ${badgeCircleCustomClass} shadow-none bg-none mt-[-10px]`}
            ></div>
        </div>
    );
};

export default BadgeSkeleton;
