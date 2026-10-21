import React from 'react';
import { ConsentFlowContractDetails } from '@learncard/types';
import { isSupportedPersonalField } from '../../helpers/contract.helpers';
import * as m from '../../paraglide/messages.js';
import TransP from '../../i18n/TransP';
import { getLocale } from '../../paraglide/runtime.js';
import { localizeContractPersonalField } from '../../i18n/contractPersonalField';

type HumanReadableContractTermsProps = {
    contractDetails: ConsentFlowContractDetails;
};

const HumanReadableContractTerms: React.FC<HumanReadableContractTermsProps> = ({
    contractDetails,
}) => {
    const terms = contractDetails.contract;
    const locale = getLocale();

    const isRequestingToRead = Object.keys(terms.read.credentials.categories ?? {}).length > 0;
    const isRequestingToWrite = Object.keys(terms.write.credentials.categories ?? {}).length > 0;

    const readPersonalFields = Object.keys(terms.read.personal)
        .filter(p => isSupportedPersonalField(p))
        .map(p => {
            if (p.toLowerCase() === 'image') return 'profile picture';
            return p.toLowerCase();
        });

    const pieces: React.ReactNode[] = [];

    if (readPersonalFields.length > 0) {
        const fieldList = new Intl.ListFormat(locale, {
            style: 'long',
            type: 'conjunction',
        }).format(readPersonalFields.map(localizeContractPersonalField));
        pieces.push(
            <span className="font-notoSans font-[600]">
                {m['consentFlow.terms.viewPersonal']({ fields: fieldList })}
            </span>
        );
    }
    if (isRequestingToRead) {
        pieces.push(
            <TransP
                m={m['consentFlow.terms.viewCredentials']}
                components={[<span key="credentials" className="font-notoSans font-[600]" />]}
            />
        );
    }
    if (isRequestingToWrite) {
        pieces.push(
            <span className="font-notoSans font-[600]">
                {m['consentFlow.terms.sendCredentials']()}
            </span>
        );
    }

    // Locale-aware list join ("A, B, and C" / "A, B y C" / "A، B وC") that
    // interleaves the bold React nodes with the correct separators.
    const listParts = new Intl.ListFormat(locale, {
        style: 'long',
        type: 'conjunction',
    }).formatToParts(pieces.map((_, i) => String(i)));

    return (
        <span className="font-notoSans">
            {listParts.map((part, i) => (
                <React.Fragment key={i}>
                    {part.type === 'element' ? pieces[Number(part.value)] : part.value}
                </React.Fragment>
            ))}
            .
        </span>
    );
};

export default HumanReadableContractTerms;
