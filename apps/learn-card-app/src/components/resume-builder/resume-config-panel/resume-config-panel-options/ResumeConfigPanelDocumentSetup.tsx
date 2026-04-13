import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { resumeBuilderStore } from '../../../../stores/resumeBuilderStore';
import ResumeBuilderToggle from '../../ResumeBuilderToggle';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

const ResumeConfigPanelDocumentSetup: React.FC = () => {
    const [open, setOpen] = useState<boolean>(true);
    const documentSetup = resumeBuilderStore.useTracked.documentSetup();
    const setDocumentSetup = resumeBuilderStore.set.setDocumentSetup;
    const brandingConfig = useBrandingConfig();

    return (
        <div className="bg-white border border-grayscale-200 rounded-2xl overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-[19px] font-500 text-grayscale-900">Document Setup</span>
                <IonIcon
                    color="grayscale-800"
                    icon={open ? chevronDownOutline : chevronUpOutline}
                />
            </button>

            {open && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-2 w-full">
                                <p className="text-xs font-semibold text-grayscale-900">
                                    {brandingConfig?.name} QR code •{' '}
                                    {documentSetup?.showQRCode ? 'On' : 'Off'}
                                </p>
                                <ResumeBuilderToggle
                                    checked={Boolean(documentSetup?.showQRCode)}
                                    onChange={checked => setDocumentSetup({ showQRCode: checked })}
                                />
                            </div>
                            <p className="text-sm text-grayscale-700 mt-1">
                                This code allows employers to view the credentials attached to this
                                resume.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-grayscale-700">
                            File Name
                        </label>
                        <input
                            type="text"
                            className="resume-builder-input-bg w-full text-sm bg-grayscale-100 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                            placeholder="resume.pdf"
                            value={documentSetup?.fileName ?? ''}
                            onChange={e => setDocumentSetup({ fileName: e.target.value })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeConfigPanelDocumentSetup;
