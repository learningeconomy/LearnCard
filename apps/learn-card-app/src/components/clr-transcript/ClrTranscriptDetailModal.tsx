import { VC } from '@learncard/types';

import type { ClrTranscriptDisplayModel, ViewOptions } from '../../helpers/clrRenderer.helpers';
import { useVerification } from '../boost/boostCMS/BoostPreview/BoostPreview';

import ClrTranscriptFullPage from './surfaces/ClrTranscriptFullPage';
import VerificationsBox from '../../pages/ids/view-id/IdDetails/VerificationsBox';

type Props = {
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
    credential: VC;
};

const ClrTranscriptDetailModal = ({ model, options, credential }: Props) => {
    const verificationItems = useVerification(credential);

    return (
        <div className="h-full overflow-y-auto">
            <ClrTranscriptFullPage model={model} options={options} credential={credential} />
            {verificationItems.length > 0 && (
                <div className="px-4 pb-10">
                    <VerificationsBox verificationItems={verificationItems} />
                </div>
            )}
        </div>
    );
};

export default ClrTranscriptDetailModal;
