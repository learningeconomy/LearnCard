import { VC } from '@learncard/types';

import type { ClrTranscriptDisplayModel, ViewOptions } from '../../helpers/clrRenderer.helpers';
import { useVerification } from '../boost/boostCMS/BoostPreview/BoostPreview';

import ClrTranscriptFullPage from './surfaces/ClrTranscriptFullPage';
import VerificationsBox from '../../pages/ids/view-id/IdDetails/VerificationsBox';

type Props = {
    model: ClrTranscriptDisplayModel;
    options: ViewOptions;
    boost: VC;
    boostUri?: string;
};

const ClrTranscriptDetailModal = ({
    model,
    options,
    boost,
    boostUri,
}: Props) => {
    const verificationItems = useVerification(boost);

    return (
        <div className="h-full overflow-y-auto">
            <ClrTranscriptFullPage
                model={model}
                options={options}
                boost={boost}
                boostUri={boostUri}
            />
            {verificationItems.length > 0 && (
                <div className="px-4 pb-10">
                    <VerificationsBox verificationItems={verificationItems} />
                </div>
            )}
        </div>
    );
};

export default ClrTranscriptDetailModal;
