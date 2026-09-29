import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { ModalTypes, useConfirmation, useModal } from 'learn-card-base';
import type { SamplePersonaConfig } from 'learn-card-base/config/tenantConfig';
import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';

import TrashBin from '../../svgs/TrashBin';
import SyncCircleArrows from '../../svgs/SyncCircleArrows';
import * as m from '../../../paraglide/messages.js';
import { useTheme } from '../../../theme/hooks/useTheme';
import SamplePersonaAddButton from './SamplePersonaAddButton';
import DemoSchoolBox from './DemoSchoolBox';
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
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
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
                    className={`py-[7px] px-[20px] rounded-[30px] bg-${primaryColor} font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px]`}
                >
                    {m['passport.buildMyLearnCard.samplePersona.checking']()}
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </button>
            ) : sampleDataExists ? (
                <button
                    type="button"
                    onClick={() => void confirmRemoval()}
                    disabled={isRemoving}
                    className={`py-[7px] px-[20px] rounded-[30px] ${
                        isRemoving ? 'bg-red-500' : 'bg-rose-500'
                    } font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px]`}
                >
                    {isRemoving
                        ? removalStatus === 'deleting'
                            ? m['passport.buildMyLearnCard.samplePersona.deleting']()
                            : removalStatus === 'disconnecting'
                              ? m['passport.buildMyLearnCard.samplePersona.disconnecting']()
                              : m['passport.buildMyLearnCard.samplePersona.checking']()
                        : m['passport.buildMyLearnCard.samplePersona.removeAction']()}
                    {isRemoving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <TrashBin version="2" className="text-white" strokeWidth="2" />
                    )}
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
                    className={`py-[7px] px-[20px] rounded-[30px] bg-${primaryColor} font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px]`}
                >
                    {m['passport.buildMyLearnCard.samplePersona.chooseAction']()}
                    <SyncCircleArrows />
                </button>
            )}
        </section>
    );
};

const SamplePersonaBox: React.FC = () => {
    const flags = useFlags();
    const { samplePersonas, legacySamplePersonaContractUris } = useFeatureConfig();
    if (flags.enableNewDemoFlow !== true) return <DemoSchoolBox />;

    if (samplePersonas.length === 0 && legacySamplePersonaContractUris.length === 0) return null;

    return <SamplePersonaBoxContent />;
};

export default SamplePersonaBox;
