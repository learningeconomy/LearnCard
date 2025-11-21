import React from 'react';

import { IonSkeletonText } from '@ionic/react';

export const AdminToolsConsentFlowContractSkeletonLoader: React.FC = () => {
    return (
        <ul className="w-full relative ion-padding">
            <li className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] border-gray-200 border-b-2 last:border-b-0 flex bg-grayscale-100 items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm">
                <div className="flex items-center justify-start w-full bg-white-100">
                    {/* Image placeholder */}
                    <div className="flex items-center justify-start rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                        <IonSkeletonText
                            animated
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '8px',
                            }}
                        />
                    </div>

                    <div className="right-side flex justify-between w-full">
                        {/* Text placeholders */}
                        <div className="flex flex-col items-start justify-center text-left flex-1">
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '150px',
                                    height: '16px',
                                    marginBottom: '6px',
                                }}
                            />
                            <IonSkeletonText animated style={{ width: '100px', height: '12px' }} />
                        </div>

                        {/* Share button placeholder */}
                        <div className="flex items-center rounded-[10px] px-[10px] py-[5px]">
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    );
};

export default AdminToolsConsentFlowContractSkeletonLoader;
