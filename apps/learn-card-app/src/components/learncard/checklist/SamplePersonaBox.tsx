import React from 'react';

import { ModalTypes, useConfirmation, useModal } from 'learn-card-base';
import type { SamplePersonaConfig } from 'learn-card-base/config/tenantConfig';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import TrashBin from '../../svgs/TrashBin';
import * as m from '../../../paraglide/messages.js';
import SamplePersonaAddButton from './SamplePersonaAddButton';
import { useSamplePersonas } from './useSamplePersonas';

interface PersonaPickerProps {
    personas: SamplePersonaConfig[];
    onAdded: () => void;
}

const PersonaPicker: React.FC<PersonaPickerProps> = ({ personas, onAdded }) => (
    <div className="p-6 font-poppins space-y-5">
        <div>
            <h2 className="text-xl font-semibold text-grayscale-900">
                {m['passport.buildMyLearnCard.samplePersona.pickerTitle']()}
            </h2>
            <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                {m['passport.buildMyLearnCard.samplePersona.pickerDescription']()}
            </p>
        </div>
        <div className="space-y-3">
            {personas.map(persona => (
                <div
                    key={persona.id}
                    className="rounded-2xl border border-grayscale-200 p-4 space-y-3"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-grayscale-900">
                            {persona.displayName ?? persona.id}
                        </h3>
                        {persona.description && (
                            <p className="text-xs text-grayscale-500 mt-1">{persona.description}</p>
                        )}
                    </div>
                    <SamplePersonaAddButton
                        persona={persona}
                        label={m['passport.buildMyLearnCard.samplePersona.addPersonaAction']({
                            persona: persona.displayName ?? persona.id,
                        })}
                        onComplete={onAdded}
                        className="w-full"
                    />
                </div>
            ))}
        </div>
    </div>
);

const SamplePersonaBoxContent: React.FC = () => {
    const confirm = useConfirmation();
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const {
        personas,
        sampleDataExists,
        isLoading,
        isRemoving,
        removalStatus,
        refreshSampleCaches,
        removeSampleCredentials,
    } = useSamplePersonas();

    if (personas.length === 0 && !sampleDataExists) return null;

    const handleAdded = (): void => {
        refreshSampleCaches();
        closeAllModals();
    };

    const addSample = (): void => {
        if (personas.length <= 1) return;

        newModal(
            <PersonaPicker personas={personas} onAdded={handleAdded} />,
            { hideButton: false },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const confirmRemoval = async (): Promise<void> => {
        const confirmed = await confirm({
            text: m['passport.buildMyLearnCard.samplePersona.removeConfirmation'](),
            confirmText: m['passport.buildMyLearnCard.samplePersona.removeAction'](),
            cancelText: m['common.cancel'](),
        });

        if (confirmed) await removeSampleCredentials();
    };

    return (
        <section
            className="flex flex-col gap-5 p-6 rounded-[20px] font-poppins bg-white shadow-bottom-2-4"
            aria-label={m['passport.buildMyLearnCard.samplePersona.title']()}
        >
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {sampleDataExists
                            ? m['passport.buildMyLearnCard.samplePersona.sampleTitle']()
                            : m['passport.buildMyLearnCard.samplePersona.title']()}
                    </h2>
                    {sampleDataExists && (
                        <CircleCheckmark className="h-6 w-6 text-emerald-600 shrink-0" />
                    )}
                </div>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {sampleDataExists
                        ? m['passport.buildMyLearnCard.samplePersona.removeDescription']()
                        : m['passport.buildMyLearnCard.samplePersona.description']()}
                </p>
            </div>

            {isLoading ? (
                <button
                    type="button"
                    disabled
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm opacity-40 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {m['passport.buildMyLearnCard.samplePersona.checking']()}
                </button>
            ) : sampleDataExists ? (
                <button
                    type="button"
                    onClick={() => void confirmRemoval()}
                    disabled={isRemoving}
                    className="py-3 px-4 rounded-[20px] border border-red-200 text-red-700 font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isRemoving ? (
                        <span className="w-4 h-4 border-2 border-red-200 border-t-red-700 rounded-full animate-spin" />
                    ) : (
                        <TrashBin version="2" className="w-4 h-4" strokeWidth="2" />
                    )}
                    {isRemoving
                        ? removalStatus === 'deleting'
                            ? m['passport.buildMyLearnCard.samplePersona.deleting']()
                            : removalStatus === 'disconnecting'
                              ? m['passport.buildMyLearnCard.samplePersona.disconnecting']()
                              : m['passport.buildMyLearnCard.samplePersona.checking']()
                        : m['passport.buildMyLearnCard.samplePersona.removeAction']()}
                </button>
            ) : personas.length === 1 ? (
                <SamplePersonaAddButton
                    persona={personas[0]!}
                    onComplete={handleAdded}
                    className="w-full"
                />
            ) : (
                <button
                    type="button"
                    onClick={addSample}
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {m['passport.buildMyLearnCard.samplePersona.chooseAction']()}
                </button>
            )}
        </section>
    );
};

const SamplePersonaBox: React.FC = () => {
    const { samplePersonas, legacySamplePersonaContractUris } = useFeatureConfig();

    if (samplePersonas.length === 0 && legacySamplePersonaContractUris.length === 0) return null;

    return <SamplePersonaBoxContent />;
};

export default SamplePersonaBox;
