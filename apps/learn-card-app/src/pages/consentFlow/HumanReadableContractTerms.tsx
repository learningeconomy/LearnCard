import React from 'react';
import { joinWithAnd } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';
import { isSupportedPersonalField } from '../../helpers/contract.helpers';

type HumanReadableContractTermsProps = {
    contractDetails: ConsentFlowContractDetails;
};

const HumanReadableContractTerms: React.FC<HumanReadableContractTermsProps> = ({
    contractDetails,
}) => {
    const terms = contractDetails.contract;

    const isRequestingToRead = Object.keys(terms.read.credentials.categories ?? {}).length > 0;
    const isRequestingToWrite = Object.keys(terms.write.credentials.categories ?? {}).length > 0;

    const readPersonalFields = Object.keys(terms.read.personal)
        .filter(p => isSupportedPersonalField(p))
        .map(p => {
            if (p.toLowerCase() === 'image') return 'profile picture';
            return p.toLowerCase();
        });

    const textPieces: React.ReactNode[] = [];

    if (readPersonalFields.length > 0) {
        textPieces.push(
            <span className="font-notoSans font-[600]">
                view your {joinWithAnd(readPersonalFields)}
            </span>
        );
    }
    if (isRequestingToRead) {
        textPieces.push(
            <>
                <span className="font-notoSans font-[600]">view and access credentials</span> you
                select to share
            </>
        );
    }
    if (isRequestingToWrite) {
        textPieces.push(<span className="font-notoSans font-[600]">send credentials to you</span>);
    }

    // terms.write.personal is not implemented and probably doesn't actually make sense
    //
    // const isRequestingToWritePersonal = Object.keys(terms.write.personal ?? {}).length > 0;
    // if (isRequestingToWritePersonal) {
    //     textPieces.push(
    //         <span className="font-notoSans font-[600]">
    //             write information to your LearnCard
    //         </span>
    //     );
    // }

    const numPieces = textPieces.length;

    return (
        <span className="font-notoSans">
            {textPieces.map((text, index) => (
                <React.Fragment key={index}>
                    {text}
                    {numPieces === 2 && index === 0 && ' and '}
                    {numPieces > 2 && index < numPieces - 2 && ', '}
                    {numPieces > 2 && index === numPieces - 2 && ', and '}
                </React.Fragment>
            ))}
            .
        </span>
    );
};

export default HumanReadableContractTerms;
