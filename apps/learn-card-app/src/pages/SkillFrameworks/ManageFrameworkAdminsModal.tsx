import React, { useState } from 'react';
import { useModal, useWallet } from 'learn-card-base';
import { IonSpinner, IonInput } from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LCNProfile } from '@learncard/types';
import CaretDown from 'apps/scouts/src/components/svgs/CaretDown';
import ScoutsTroopIcon from 'apps/scouts/src/assets/icons/ScoutsTroopIcon';
import TrashBin from 'learn-card-base/svgs/TrashBin';

type ManageFrameworkAdminsModalProps = {
    frameworkId: string;
};

const ManageFrameworkAdminsModal: React.FC<ManageFrameworkAdminsModalProps> = ({
    frameworkId,
}) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    const [newAdminProfileId, setNewAdminProfileId] = useState('');

    // Fetch current admins
    const {
        data: admins = [],
        isLoading,
        isError,
    } = useQuery<LCNProfile[]>({
        queryKey: ['frameworkAdmins', frameworkId],
        queryFn: async () => {
            const wallet = await initWallet();
            return await wallet.invoke.getSkillFrameworkAdmins(frameworkId);
        },
    });

    // Add admin mutation
    const addAdminMutation = useMutation({
        mutationFn: async (profileId: string) => {
            const wallet = await initWallet();
            return await wallet.invoke.addSkillFrameworkAdmin(frameworkId, profileId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['frameworkAdmins', frameworkId] });
            setNewAdminProfileId('');
        },
        onError: error => {
            console.error('Failed to add admin:', error);
            alert('Failed to add admin. Please check the Profile ID and try again.');
        },
    });

    // Remove admin mutation
    const removeAdminMutation = useMutation({
        mutationFn: async (profileId: string) => {
            const wallet = await initWallet();
            return await wallet.invoke.removeSkillFrameworkAdmin(frameworkId, profileId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['frameworkAdmins', frameworkId] });
        },
        onError: error => {
            console.error('Failed to remove admin:', error);
            alert('Failed to remove admin. Please try again.');
        },
    });

    const handleAddAdmin = () => {
        const profileId = newAdminProfileId.trim();
        if (!profileId) return;

        addAdminMutation.mutate(profileId);
    };

    const handleRemoveAdmin = (profileId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to remove this admin? They will lose management access to this framework.'
        );

        if (confirmed) {
            removeAdminMutation.mutate(profileId);
        }
    };

    return (
        <section className="bg-grayscale-100 rounded-[20px] flex flex-col max-w-[600px]">
            <div className="py-[10px] pl-[10px] pr-[20px] flex gap-[10px] items-center shadow-bottom-1-5">
                <ScoutsTroopIcon className="w-[65px] h-[65px]" />
                <p className="text-grayscale-800 font-poppins text-[20px] leading-[130%] tracking-[-0.25px]">
                    Manage Admins
                </p>
                <CaretDown className="ml-auto text-grayscale-800" />
            </div>

            <div className="grow p-[15px] min-h-[300px] max-h-[500px] overflow-y-auto flex flex-col gap-[15px]">
                {/* Add Admin Section */}
                <div className="bg-white p-[15px] rounded-[10px] flex flex-col gap-[10px]">
                    <p className="text-grayscale-900 font-poppins text-[16px] font-[600]">
                        Add New Admin
                    </p>
                    <div className="flex gap-[10px]">
                        <IonInput
                            onIonInput={e => setNewAdminProfileId(e.detail.value ?? '')}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] !px-[15px] !h-[40px] flex-1"
                            placeholder="Enter Profile ID"
                            value={newAdminProfileId}
                        />
                        <button
                            onClick={handleAddAdmin}
                            disabled={!newAdminProfileId.trim() || addAdminMutation.isPending}
                            className="bg-emerald-700 text-white px-[20px] py-[7px] rounded-[30px] text-[14px] font-poppins font-[600] disabled:bg-grayscale-600 whitespace-nowrap"
                        >
                            {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
                        </button>
                    </div>
                </div>

                {/* Current Admins List */}
                <div className="flex flex-col gap-[10px]">
                    <p className="text-grayscale-900 font-poppins text-[16px] font-[600]">
                        Current Admins ({admins.length})
                    </p>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-[40px]">
                            <IonSpinner name="crescent" />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-[40px]">
                            <p className="text-red-600 font-poppins text-[14px]">
                                Failed to load admins. Please try again.
                            </p>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-[40px] bg-white rounded-[10px]">
                            <p className="text-grayscale-600 font-poppins text-[14px]">
                                No admins yet. Add one above.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-[8px]">
                            {admins.map(admin => (
                                <div
                                    key={admin.profileId}
                                    className="bg-white p-[12px] rounded-[10px] flex items-center gap-[10px]"
                                >
                                    {admin.profilePicture ? (
                                        <img
                                            src={admin.profilePicture}
                                            alt={admin.displayName || 'Admin'}
                                            className="w-[40px] h-[40px] rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-[40px] h-[40px] rounded-full bg-grayscale-200 flex items-center justify-center">
                                            <span className="text-grayscale-600 font-poppins text-[16px]">
                                                {(admin.displayName || 'A')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col flex-1">
                                        <p className="text-grayscale-900 font-poppins text-[14px] font-[600]">
                                            {admin.displayName || 'Unknown'}
                                        </p>
                                        <p className="text-grayscale-600 font-poppins text-[12px]">
                                            {admin.profileId}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAdmin(admin.profileId)}
                                        disabled={removeAdminMutation.isPending}
                                        className="text-red-600 hover:text-red-800 p-[8px] disabled:opacity-50"
                                        title="Remove admin"
                                    >
                                        <TrashBin className="w-[20px] h-[20px]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-[15px] flex gap-[10px] items-center">
                <button
                    onClick={closeModal}
                    className="bg-emerald-700 text-white px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 font-[600] leading-[130%] tracking-[-0.25px] shadow-button-bottom"
                >
                    Done
                </button>
            </div>
        </section>
    );
};

export default ManageFrameworkAdminsModal;
