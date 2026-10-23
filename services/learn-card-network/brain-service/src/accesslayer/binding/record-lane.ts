import { IntegrationManifestValidator, type RecordClass } from '@learncard/types';
import { neogma } from '@instance';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import { assertSignedListingVersionOrThrow } from '@helpers/manifest-signature.helpers';
import { getIntentTargetId, getTargetDeclarationId } from '@helpers/install-intent.helpers';
import type { BindingRecordType } from 'types/binding';

/**
 * Record classes Platform Issuance consumes. Platform-native capabilities have no manifest,
 * so this server-owned constant stands in for the consumer declaration (ADR-013 §3.1).
 */
export const PLATFORM_SUPPORTED_RECORD_CLASSES: readonly RecordClass[] = ['academic'];

const readProviderRecordClasses = async (
    binding: BindingRecordType
): Promise<RecordClass[] | null> => {
    if (binding.provider.resourceType !== 'INTEGRATION_INSTALL') return null;

    const intentId = await readTargetIntentId(binding.provider.resourceId);
    const intent = intentId ? await readInstallIntentById(intentId) : null;
    const target = intent?.spec?.targets.find(
        candidate =>
            getIntentTargetId(intent.intentId, getTargetDeclarationId(candidate)) ===
            binding.provider.resourceId
    );
    const version = target ? await readListingVersionById(target.versionId) : null;

    if (!version) return null;

    // The class must come from the signed, reviewed manifest, never from Binding input.
    const manifest = IntegrationManifestValidator.parse(
        await assertSignedListingVersionOrThrow('INTEGRATION', version)
    );

    if (!manifest.capabilities.provided.includes('record-provisioning')) return null;

    return manifest.supportedRecordClasses;
};

const readTargetIntentId = async (targetId: string): Promise<string | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (t:IntegrationInstall {id: $targetId}) RETURN t.intentId AS intentId`,
        { targetId }
    );
    const intentId: unknown = result.records[0]?.get('intentId');

    return typeof intentId === 'string' ? intentId : null;
};

/** Reasons a record-lane Binding cannot yet be approved; empty when the declaration is complete. */
export const resolveRecordLaneGaps = async (binding: BindingRecordType): Promise<string[]> => {
    if (binding.capability !== 'record-provisioning') {
        return ['This record lane has no Binding declaration format yet.'];
    }

    const metadata = binding.capabilityMetadata;

    if (!metadata) {
        return [
            'A binding-specific record class, mode, legal basis, and identity declaration are required.',
        ];
    }

    const gaps: string[] = [];

    if (metadata.mode !== 'TRANSACTIONAL') {
        gaps.push('ETL record-provisioning declarations are not implemented.');
    } else if (!metadata.transactional) {
        gaps.push('A Transactional Binding must declare its ADR-012 §3.2 intent declaration.');
    }

    // ADR-013 D3: the employment lane waits for the employment-record consent tier.
    if (metadata.recordClass !== 'academic') {
        gaps.push('Only the academic record class is implemented.');
    }

    if (
        binding.consumer.resourceType !== 'ECOSYSTEM' ||
        !PLATFORM_SUPPORTED_RECORD_CLASSES.includes(metadata.recordClass)
    ) {
        gaps.push('The consumer must be Platform Issuance and support the declared record class.');
    }

    const providerClasses = await readProviderRecordClasses(binding);

    if (!providerClasses?.includes(metadata.recordClass)) {
        gaps.push(
            "The provider's signed manifest must provide record-provisioning for the declared record class."
        );
    }

    return gaps;
};
