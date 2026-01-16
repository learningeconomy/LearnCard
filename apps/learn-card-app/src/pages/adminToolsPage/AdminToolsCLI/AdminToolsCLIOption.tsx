import React from 'react';
import { useHistory } from 'react-router-dom';

import { useModal } from 'learn-card-base';

import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

type AdminToolsCLIOptionProps = {
    option: AdminToolOption;
};

const AdminToolsCLIOption: React.FC<AdminToolsCLIOptionProps> = ({ option }) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const handleOpenCLI = () => {
        closeAllModals();
        history.push('/cli');
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-grayscale-700 text-sm">
                The LearnCard CLI provides an interactive terminal for exploring and testing the
                LearnCard API. You can execute JavaScript commands, interact with your wallet, and
                test credential operations.
            </p>

            <div className="bg-grayscale-50 rounded-lg p-4 border border-grayscale-200">
                <h4 className="font-semibold text-grayscale-900 mb-2">Features:</h4>

                <ul className="text-sm text-grayscale-700 space-y-1 list-disc list-inside">
                    <li>Execute JavaScript with access to your LearnCard wallet</li>
                    <li>Test credential issuance, verification, and storage</li>
                    <li>Explore boost creation and network operations</li>
                    <li>Click-to-copy for DIDs and LearnCard URIs</li>
                    <li>Command history and auto-complete sidebar</li>
                </ul>
            </div>

            <button
                onClick={handleOpenCLI}
                className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
            >
                {option.actionLabel}
            </button>
        </div>
    );
};

export default AdminToolsCLIOption;
