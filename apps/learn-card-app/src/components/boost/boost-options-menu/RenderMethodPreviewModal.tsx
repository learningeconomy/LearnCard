import React from 'react';
import Lottie from 'react-lottie-player';

import { RenderMethodDisplay } from '../../render-method/RenderMethodDisplay';

import { VC, UnsignedVC } from '@learncard/types';
import { ModalTypes, useModal } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getSvgMustacheRenderMethod } from '../../../helpers/renderMethod.helpers';

const Pulpo = '/lotties/cuteopulpo.json';

type RenderMethodPreviewModalProps = {
    boost: VC | UnsignedVC;
};

const RenderMethodPreviewModal: React.FC<RenderMethodPreviewModalProps> = ({ boost }) => {
    const { closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    // renderMethod lives on the outer CertifiedBoostCredential (standards-compliant location)
    // but the template data (name, image, credentialSubject, etc.) lives in the inner boostCredential
    const renderMethod = getSvgMustacheRenderMethod(boost as VC);
    const dataVc = unwrapBoostCredential(boost as VC) as VC;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg w-11/12 max-w-[420px] max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold">Preview</h2>
                    <button
                        onClick={() => closeModal()}
                        className="text-red-600 flex items-center"
                        type="button"
                    >
                        Close
                    </button>
                </div>
                <div className="overflow-auto">
                    {renderMethod ? (
                        <RenderMethodDisplay
                            vc={dataVc}
                            renderMethod={renderMethod}
                            fallback={
                                <div className="min-h-[420px] flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                                    <Lottie
                                        loop
                                        play
                                        path={Pulpo}
                                        style={{ width: 160, height: 160 }}
                                    />
                                    <div className="space-y-1">
                                        <p className="text-xl font-bold text-grayscale-900">
                                            No render method available
                                        </p>
                                        <p className="text-sm text-grayscale-600">
                                            This credential does not include a supported template.
                                        </p>
                                    </div>
                                </div>
                            }
                        />
                    ) : (
                        <div className="min-h-[420px] flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                            <Lottie loop play path={Pulpo} style={{ width: 160, height: 160 }} />
                            <div className="space-y-1">
                                <p className="text-xl font-bold text-grayscale-900">
                                    No render method available
                                </p>
                                <p className="text-sm text-grayscale-600">
                                    This credential does not include a supported template.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RenderMethodPreviewModal;
