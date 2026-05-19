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
        <div className="p-4 space-y-4 pb-10">
            <ClrTranscriptFullPage model={model} options={options} />
            {verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}
        </div>
    );
};

export default ClrTranscriptDetailModal;
