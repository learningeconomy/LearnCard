import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, documentsOutline } from 'ionicons/icons';
import { Overlay } from 'learn-card-base';
import {
    getCredentialName,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import type { ExistingCredentialMatch } from './findDuplicateCredential';
import * as m from '../../../paraglide/messages.js';

export type DuplicateCredentialAction = 'skip' | 'save' | 'cancel';

interface DuplicateCredentialPromptProps {
    existing: ExistingCredentialMatch;
    onChoose: (action: DuplicateCredentialAction) => void;
}

export const DuplicateCredentialPrompt: React.FC<DuplicateCredentialPromptProps> = ({
    existing,
    onChoose,
}) => {
    const skipButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        skipButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onChoose('cancel');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onChoose]);

    const credentialName = getCredentialName(existing.credential);
    const issuerName =
        typeof existing.credential.issuer === 'object'
            ? existing.credential.issuer?.name
            : undefined;
    const imageUrl = getImageUrlFromCredential(existing.credential, existing.record.category);

    return (
        <Overlay>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="duplicate-credential-title"
                className="relative p-6 sm:p-8"
            >
                <button
                    type="button"
                    aria-label={m['common.cancel']()}
                    onClick={() => onChoose('cancel')}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-grayscale-500 transition-colors hover:bg-grayscale-100 hover:text-grayscale-900"
                >
                    <IonIcon icon={closeOutline} className="text-2xl" />
                </button>

                <div className="pr-10">
                    <h1
                        id="duplicate-credential-title"
                        className="text-xl font-semibold text-grayscale-900"
                    >
                        {m['claim.duplicate.title']()}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-grayscale-600">
                        {m['claim.duplicate.description']()}
                    </p>
                </div>

                <div className="my-6 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4">
                    <p className="mb-3 text-xs font-medium text-grayscale-700">
                        {m['claim.duplicate.existingLabel']()}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-grayscale-100 text-grayscale-600">
                            {imageUrl ? (
                                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <IonIcon icon={documentsOutline} className="text-2xl" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-grayscale-900">
                                {credentialName}
                            </p>
                            {issuerName && (
                                <p className="mt-0.5 truncate text-xs text-grayscale-500">
                                    {m['claim.duplicate.issuedBy']({ issuer: issuerName })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        ref={skipButtonRef}
                        type="button"
                        onClick={() => onChoose('skip')}
                        className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {m['claim.duplicate.skip']()}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChoose('save')}
                        className="w-full rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                    >
                        {m['claim.duplicate.save']()}
                    </button>
                </div>
            </div>
        </Overlay>
    );
};
