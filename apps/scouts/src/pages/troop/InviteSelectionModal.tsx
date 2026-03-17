import React from 'react';
import IdentificationCard from '../../components/svgs/IdentificationCard';
import TroopUserIcon from '../../components/svgs/TroopUserIcon';
import ScoutIdThumbPlaceholder from '../../components/svgs/ScoutIdThumbPlaceholder';
import LeaderIdThumbPlaceholder from '../../components/svgs/LeaderIdThumbPlaceholder';

interface InviteSelectionModalProps {
    onInviteLeader: () => void;
    onInviteScout: () => void;
    handleCloseModal: () => void;
    scoutNoun: string;
}

const InviteSelectionModal: React.FC<InviteSelectionModalProps> = ({
    onInviteLeader,
    onInviteScout,
    handleCloseModal,
    scoutNoun,
}) => {
    return (
        <div className="w-full flex flex-col items-center justify-center px-3 py-7 bg-white rounded-2xl">
            <h2 className="text-xl font-poppins font-semibold text-grayscale-900 mb-6 text-center">Who would you like to invite?</h2>
            
            <div className="flex flex-col gap-4 w-full">
                <button
                    onClick={() => {
                        onInviteLeader();
                    }}
                    className="flex items-center gap-4 w-full p-4 rounded-xl border-2 border-grayscale-100 hover:border-sp-green-forest transition-colors text-left"
                >
                    <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-full overflow-hidden bg-grayscale-100">
                        <LeaderIdThumbPlaceholder className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold text-grayscale-900 line-clamp-1">Invite Troop Leader</p>
                        <p className="text-sm text-grayscale-500 line-clamp-2">Add a scout leader to this troop</p>
                    </div>
                </button>

                <button
                    onClick={() => {
                        onInviteScout();
                    }}
                    className="flex items-center gap-4 w-full p-4 rounded-xl border-2 border-grayscale-100 hover:border-sp-green-forest transition-colors text-left"
                >
                    <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-full overflow-hidden bg-grayscale-100">
                        <ScoutIdThumbPlaceholder className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold text-grayscale-900 line-clamp-1">Invite Scout</p>
                        <p className="text-sm text-grayscale-500 line-clamp-2">Add a new scout to this troop</p>
                    </div>
                </button>
            </div>

            <button
                onClick={handleCloseModal}
                className="mt-6 text-grayscale-500 font-medium hover:text-grayscale-900 transition-colors"
            >
                Cancel
            </button>
        </div>
    );
};

export default InviteSelectionModal;
