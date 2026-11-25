import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import DashboardHeaderCard from './DashboardHeaderCard';
import * as m from '../../../paraglide/messages.js';

afterEach(cleanup);

it('reports hover, focus and press start on the avatar before the click', () => {
    const onAvatarIntent = vi.fn();
    const onAvatarClick = vi.fn();
    render(
        <DashboardHeaderCard
            brandName="LearnCard"
            displayName="Ada Lovelace"
            profileImage=""
            onAvatarClick={onAvatarClick}
            onAvatarIntent={onAvatarIntent}
        />
    );
    const avatar = screen.getByRole('button', {
        name: m['dashboard.header.avatarAria']({ brand: 'LearnCard' }),
    });

    fireEvent.pointerEnter(avatar);
    fireEvent.focus(avatar);
    fireEvent.pointerDown(avatar);
    fireEvent.touchStart(avatar);
    expect(onAvatarIntent).toHaveBeenCalledTimes(4);
    expect(onAvatarClick).not.toHaveBeenCalled();
});
