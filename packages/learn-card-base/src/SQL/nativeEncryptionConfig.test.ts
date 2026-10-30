import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import scoutsConfig from '../../../../apps/scouts/capacitor.config';

it.each(['android/app/src/main/assets', 'ios/App/App'])(
    'keeps ScoutPass %s encryption and OTA settings aligned with its canonical config',
    directory => {
        const generated = JSON.parse(
            readFileSync(resolve('../../apps/scouts', directory, 'capacitor.config.json'), 'utf8')
        );
        expect(generated.plugins.CapacitorUpdater.defaultChannel).toBe('1.0.9');
        expect(generated.plugins.CapacitorUpdater).toEqual(scoutsConfig.plugins?.CapacitorUpdater);
        expect(generated.plugins.CapacitorSQLite).toEqual(scoutsConfig.plugins?.CapacitorSQLite);
        expect(generated.android).toEqual(scoutsConfig.android);
        expect(generated.server).toEqual(scoutsConfig.server);
    }
);
