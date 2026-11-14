import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SeedPhraseModal from './SeedPhraseModal';

const mocks = vi.hoisted(() => ({
    returnTo: null as string | null,
    signIn: vi.fn(),
    close: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    clearRedirect: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useModal: () => ({ closeModal: mocks.close }),
    redirectStore: {
        get: { lcnRedirect: () => mocks.returnTo },
        set: { lcnRedirect: mocks.clearRedirect },
    },
    ...(await import('../../../../../packages/learn-card-base/src/in-app-messages/authRedirectHistory')),
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'grayscale-900' } } }),
}));
vi.mock('./useSeedLogin', () => ({
    useSeedLogin: () => ({ signInWithSeed: mocks.signIn, validate: () => null }),
}));

beforeEach(() => {
    vi.clearAllMocks();
    mocks.returnTo = null;
    mocks.signIn.mockReset();
    mocks.signIn.mockResolvedValue(undefined);
});
afterEach(cleanup);
const submit = () => {
    render(<SeedPhraseModal />);
    fireEvent.change(screen.getByPlaceholderText('Paste your seed phrase or key here...'), {
        target: { value: 'a'.repeat(64) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import Passport' }));
};
it('returns to the selected native request after successful sign-in', async () => {
    mocks.returnTo = '/native-digital-credentials';
    submit();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(mocks.returnTo));
    expect(mocks.push).not.toHaveBeenCalledWith('/wallet');
    expect(mocks.clearRedirect).toHaveBeenCalledWith(null);
    expect(mocks.close).toHaveBeenCalledOnce();
});
it('keeps the existing landing page when sign-in has no pending destination', async () => {
    submit();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/wallet'));
    expect(mocks.clearRedirect).not.toHaveBeenCalled();
});
it('keeps the request destination available for a sign-in retry', async () => {
    mocks.returnTo = '/native-digital-credentials';
    mocks.signIn.mockRejectedValue(new Error('Connection unavailable'));
    submit();
    await screen.findByRole('alert');
    expect(mocks.clearRedirect).not.toHaveBeenCalled();
    expect(mocks.close).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
});
