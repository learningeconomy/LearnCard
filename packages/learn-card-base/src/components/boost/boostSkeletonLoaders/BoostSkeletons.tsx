import { IonSkeletonText } from '@ionic/react';

export const BoostTextSkeleton: React.FC<{
    containerClassName?: string;
    skeletonStyles?: React.CSSProperties;
}> = ({ containerClassName, skeletonStyles }) => {
    return (
        <section className={containerClassName}>
            <IonSkeletonText animated={true} style={{ ...skeletonStyles }} />
        </section>
    );
};

export const BoostSkeleton: React.FC<{
    containerClassName?: string;
    skeletonStyles?: React.CSSProperties;
}> = ({ containerClassName, skeletonStyles }) => {
    return (
        <section className={containerClassName}>
            <IonSkeletonText animated={true} style={{ ...skeletonStyles }} />
        </section>
    );
};

export default BoostTextSkeleton;
