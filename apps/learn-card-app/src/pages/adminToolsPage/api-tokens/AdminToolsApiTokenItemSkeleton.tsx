import { AppSkeletonText } from 'learn-card-base/ui/feedback/AppSkeletonText';

export const AdminToolsApiTokenItemSkeleton: React.FC = () => {
    return (
        <div className="w-full flex items-center justify-between p-4">
            <div className="w-full">
                <AppSkeletonText
                    animated
                    style={{ width: '60%', height: '18px', borderRadius: 6 }}
                />
                <div className="mt-2" />
                <AppSkeletonText
                    animated
                    style={{ width: '90%', height: '16px', borderRadius: 6 }}
                />
                <div className="mt-2" />
                <AppSkeletonText
                    animated
                    style={{ width: '80%', height: '16px', borderRadius: 6 }}
                />
                <div className="mt-2" />
                <AppSkeletonText
                    animated
                    style={{ width: '40%', height: '14px', borderRadius: 6 }}
                />
            </div>

            <div className="flex flex-col items-end justify-center gap-2 ml-4">
                <AppSkeletonText
                    animated
                    style={{
                        width: 80,
                        height: 28,
                        borderRadius: 999,
                    }}
                />
                <div className="flex items-center gap-2 mt-2">
                    <AppSkeletonText
                        animated
                        style={{ width: 35, height: 35, borderRadius: 999 }}
                    />
                    <AppSkeletonText
                        animated
                        style={{ width: 35, height: 35, borderRadius: 999 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminToolsApiTokenItemSkeleton;
