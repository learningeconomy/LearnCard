import { Ecosystem } from '@models';
import { Ecosystem as EcosystemType, EcosystemSettings } from '@learncard/types';
import { FlatEcosystemType } from 'types/ecosystem';

export const inflateEcosystem = (flat: FlatEcosystemType): EcosystemType => {
    const { settings, parentEcosystemId, ...rest } = flat;

    let parsedSettings: EcosystemSettings = {};

    if (settings) {
        try {
            parsedSettings = JSON.parse(settings) as EcosystemSettings;
        } catch {
            console.warn(`Failed to parse settings for ecosystem ${flat.id}; defaulting to {}`);
            parsedSettings = {};
        }
    }

    return { ...rest, parentEcosystemId: parentEcosystemId ?? null, settings: parsedSettings };
};

export const getEcosystemById = async (id: string): Promise<EcosystemType | null> => {
    const flat = await Ecosystem.findOne({ where: { id }, plain: true });

    return flat ? inflateEcosystem(flat as FlatEcosystemType) : null;
};

export const getChildEcosystems = async (parentEcosystemId: string): Promise<EcosystemType[]> => {
    const results = await Ecosystem.findMany({ where: { parentEcosystemId } });

    return results.map(result => inflateEcosystem(result.dataValues as FlatEcosystemType));
};

export const getRootEcosystemsForTenant = async (
    rootEcosystemId: string
): Promise<EcosystemType[]> => {
    const results = await Ecosystem.findMany({ where: { rootEcosystemId } });

    return results.map(result => inflateEcosystem(result.dataValues as FlatEcosystemType));
};
