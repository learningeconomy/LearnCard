import { beforeEach, describe, expect, it } from 'vitest';

import { setLocale } from '../../paraglide/runtime.js';
import { ScoutsRoleEnum } from '../../stores/troopRole';
import { getTroopIdRoleLabel } from './troopIdCopy';

describe('Troop ID role copy', () => {
    beforeEach(() => setLocale('en', { reload: false }));

    it('resolves every role label in the active locale', () => {
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.scout)).toBe('Scout');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.leader)).toBe('Leader');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.national)).toBe('National Admin');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.global)).toBe('Global Admin');

        setLocale('ar', { reload: false });

        expect(getTroopIdRoleLabel(ScoutsRoleEnum.scout)).toBe('كشاف');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.leader)).toBe('قائد');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.national)).toBe('مسؤول وطني');
        expect(getTroopIdRoleLabel(ScoutsRoleEnum.global)).toBe('مسؤول عام');
    });
});
