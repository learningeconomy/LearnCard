import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../../paraglide/runtime.js';
import BoostOptionsMenu from './BoostOptionsMenu';

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { achievement: 'achievement' },
    ModalTypes: { Center: 'Center', FullScreen: 'FullScreen' },
    useConfirmation: () => vi.fn(),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn(), closeAllModals: vi.fn() }),
}));

vi.mock('../hooks/useBoostMenu', () => ({
    BoostMenuType: { earned: 'EARNED', managed: 'MANAGED' },
}));
vi.mock('../../../helpers/troop.helpers', () => ({ isTroopCategory: () => false }));
vi.mock('./ShareBoostLink', () => ({ default: () => null }));
vi.mock('../../../pages/troop/ShareTroopIdModal', () => ({ default: () => null }));
vi.mock('./ViewJsonModal', () => ({ default: () => null }));
vi.mock('../../svgs/TrashBin', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/ReplyIcon', () => ({ default: () => null }));
vi.mock('../../svgs/BracketsIcon', () => ({ default: () => null }));

describe('BoostOptionsMenu', () => {
    afterEach(() => setLocale('en', { reload: false }));

    it('renders every earned-boost action in the active locale', () => {
        setLocale('fr', { reload: false });

        const html = renderToStaticMarkup(
            <BoostOptionsMenu
                handleCloseModal={vi.fn()}
                handleDeleteBoost={vi.fn()}
                showDeleteButton
                boost={{} as never}
                boostCredential={{} as never}
                boostUri="urn:boost:test"
                menuType={'EARNED' as never}
            />
        );

        expect(html).toContain('Supprimer');
        expect(html).toContain('Partager');
        expect(html).toContain('Voir les données');
        expect(html).not.toContain('View Data');
    });
});
