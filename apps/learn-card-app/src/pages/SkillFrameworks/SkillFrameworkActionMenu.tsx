import React from 'react';
import { useModal, ModalTypes, useWallet } from 'learn-card-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import User from 'apps/scouts/src/components/svgs/User';
import Pencil from 'apps/scouts/src/components/svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import EditFrameworkModal from './EditFrameworkModal';
import ManageFrameworkNetworksModal from './ManageFrameworkNetworksModal';
import ManageFrameworkAdminsModal from './ManageFrameworkAdminsModal';

type SkillFrameworkActionMenuProps = {
    frameworkId?: string;
};

const SkillFrameworkActionMenu: React.FC<SkillFrameworkActionMenuProps> = ({ frameworkId }) => {
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    // Delete framework mutation
    const deleteFrameworkMutation = useMutation({
        mutationFn: async (id: string) => {
            const wallet = await initWallet();
            return await wallet.invoke.deleteSkillFramework(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            closeModal();
        },
        onError: error => {
            console.error('Failed to delete framework:', error);
            alert('Failed to delete framework. Please try again.');
        },
    });

    const handleEdit = () => {
        if (!frameworkId) return;
        closeModal();
        newModal(<EditFrameworkModal frameworkId={frameworkId} />, {
            sectionClassName: '!bg-transparent !shadow-none',
            cancelButtonTextOverride: 'Back',
        });
    };

    const handleManageNetworks = () => {
        if (!frameworkId) return;
        closeModal();
        newModal(
            <ManageFrameworkNetworksModal frameworkId={frameworkId} />,
            undefined,
            {
                desktop: ModalTypes.Center,
                mobile: ModalTypes.Center,
            }
        );
    };

    const handleManageAdmins = () => {
        if (!frameworkId) return;
        closeModal();
        newModal(
            <ManageFrameworkAdminsModal frameworkId={frameworkId} />,
            undefined,
            {
                desktop: ModalTypes.Center,
                mobile: ModalTypes.Center,
            }
        );
    };

    const handleDelete = () => {
        if (!frameworkId) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete this framework? This action cannot be undone.'
        );

        if (confirmed) {
            deleteFrameworkMutation.mutate(frameworkId);
        }
    };

    const options = [
        {
            label: 'Edit Framework',
            icon: <Pencil className="w-[35px] h-[35px]" />,
            onClick: handleEdit,
        },
        {
            label: 'Manage Networks',
            icon: <User className="w-[35px] h-[35px]" />,
            onClick: handleManageNetworks,
        },
        {
            label: 'Manage Admins',
            icon: <User className="w-[35px] h-[35px]" />,
            onClick: handleManageAdmins,
        },
        {
            label: 'Delete Framework',
            icon: <TrashBin className="w-[35px] h-[35px]" />,
            onClick: handleDelete,
            className: 'text-red-600',
        },
    ];

    return (
        <section className="flex flex-col text-grayscale-800 p-[20px]">
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={option.onClick}
                    className={`flex gap-[10px] items-center py-[10px] text-[18px] font-notoSans hover:bg-grayscale-100 rounded-[8px] ${option.className || ''}`}
                    disabled={deleteFrameworkMutation.isPending}
                >
                    {option.icon}
                    {option.label}
                </button>
            ))}
        </section>
    );
};

export default SkillFrameworkActionMenu;
