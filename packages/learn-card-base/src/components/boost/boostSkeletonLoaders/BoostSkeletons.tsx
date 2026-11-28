import { AppSkeletonText } from 'learn-card-base/ui/feedback/AppSkeletonText';

export const BoostTextSkeleton: React.FC<{
    containerClassName?: string;
    skeletonStyles?: React.CSSProperties;
}> = ({ containerClassName, skeletonStyles }) => {
    return (
        <section className={containerClassName}>
            <AppSkeletonText animated={true} style={{ ...skeletonStyles }} />
        </section>
    );
};

export const BoostSkeleton: React.FC<{
    containerClassName?: string;
    skeletonStyles?: React.CSSProperties;
}> = ({ containerClassName, skeletonStyles }) => {
    return (
        <section className={containerClassName}>
            <AppSkeletonText animated={true} style={{ ...skeletonStyles }} />
        </section>
    );
};

export default BoostTextSkeleton;
