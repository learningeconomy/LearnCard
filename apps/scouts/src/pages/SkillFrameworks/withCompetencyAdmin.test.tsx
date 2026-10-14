// @vitest-environment happy-dom

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModalsProvider, useModalsContext } from 'learn-card-base/components/modals/ModalsContext';
import { Modals } from 'learn-card-base/components/modals/Modals';
import { useModal } from 'learn-card-base/components/modals/useModal';
import { ModalTypes } from 'learn-card-base/components/modals/types/Modals';
import { withCompetencyAdmin } from './withCompetencyAdmin';
import SelectFrameworkToManageModal from './SelectFrameworkToManageModal';
import EditAlignmentModal from './EditAlignmentModal';
import ConfirmAlignmentDeletionModal from './ConfirmAlignmentDeletionModal';
import { FrameworkNodeRole } from '../../components/boost/boost';
import AdminToolsOptionsContainer from '../adminToolsPage/AdminToolsModal/AdminToolsOptionsContainer';
import {
    AdminToolOptionsEnum,
    getAdminToolOptions,
} from '../adminToolsPage/AdminToolsModal/admin-tools.helpers';

vi.mock('learn-card-base', async () => {
    const { useModal } = await import('learn-card-base/components/modals/useModal');
    const { useQuery } = await import('@tanstack/react-query');
    const { ModalTypes } = await import('learn-card-base/components/modals/types/Modals');

    return {
        isLocalhost: false,
        useModal,
        ModalTypes: {
            Cancel: ModalTypes.Cancel,
            Center: ModalTypes.Center,
            FullScreen: ModalTypes.FullScreen,
        },
        useDeviceTypeByWidth: () => ({ isMobile: true, isDesktop: false }),
        useCountSkillsInFramework: () => ({ data: { count: 1 } }),
        useListMySkillFrameworks: () => ({ data: [] }),
        useGetCurrentUserTroopIdsResolved: () =>
            useQuery({
                queryKey: ['competency-admin-role'],
                queryFn: async () => ({ isScoutGlobalAdmin: true }),
                enabled: false,
            }),
    };
});

vi.mock('../../components/boost/boost', () => ({
    FrameworkNodeRole: { tier: 'tier', competency: 'competency' },
}));
vi.mock('@emoji-mart/react', () => ({ default: () => null }));
vi.mock('./FrameworkImage', () => ({ default: () => null }));
vi.mock('./FrameworkSkillsCount', () => ({ default: () => null }));
vi.mock('./SkillBreadcrumbText', () => ({ default: () => null }));
vi.mock('./AlignmentToggle', () => ({ default: () => null }));
vi.mock('../../i18n/TransP', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({
    IonFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
    IonInput: ({
        value,
        placeholder,
        onIonInput,
    }: {
        value?: string;
        placeholder?: string;
        onIonInput: (event: { detail: { value: string } }) => void;
    }) => (
        <input
            value={value ?? ''}
            placeholder={placeholder}
            onChange={event => onIonInput({ detail: { value: event.target.value } })}
        />
    ),
    IonTextarea: ({
        value,
        placeholder,
        onIonInput,
    }: {
        value?: string;
        placeholder?: string;
        onIonInput: (event: { detail: { value: string } }) => void;
    }) => (
        <textarea
            value={value ?? ''}
            placeholder={placeholder}
            onChange={event => onIonInput({ detail: { value: event.target.value } })}
        />
    ),
    IonSpinner: () => null,
}));

vi.mock('./CreateFrameworkModal', () => ({ default: () => null }));
vi.mock('./ManageSkills', () => ({ default: () => null }));
vi.mock('./ViewSkillFramework', () => ({ default: () => null }));
vi.mock('./SkillFrameworks', () => ({ default: () => <div>Framework tool</div> }));
vi.mock('../skills/SkillsAdminPanelFramework', () => ({ default: () => null }));
vi.mock('../adminToolsPage/AdminToolsModal/AdminToolsOptionsContainerHeader', () => ({
    default: () => null,
}));
vi.mock('../adminToolsPage/AdminToolsModal/AdminToolsModalFooter', () => ({ default: () => null }));
vi.mock('../adminToolsPage/bulk-import/AdminToolsBulkBoostImportOption', () => ({
    default: () => <div>Bulk import tool</div>,
}));

vi.mock('learn-card-base/hooks/useDeviceTypeByWidth', () => ({
    useDeviceTypeByWidth: () => ({ isMobile: true, isDesktop: false }),
}));

const ProtectedEditor = withCompetencyAdmin(({ title }: { title: string }) => {
    const { closeModal } = useModal();

    return (
        <div>
            <h1>{title}</h1>
            <input aria-label="Framework name" />
            <button onClick={closeModal}>Close editor</button>
        </div>
    );
});

const modalTypes = { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen };
const onEditorClose = vi.fn(() => false);

const Harness: React.FC<{ title: string; renderOnRoute?: boolean; editor?: React.ReactNode }> = ({
    title,
    renderOnRoute,
    editor,
}) => {
    const { newModal, replaceModal } = useModal();
    const { modals } = useModalsContext();

    return (
        <>
            <button
                onClick={() =>
                    newModal(
                        editor ?? <ProtectedEditor title={title} />,
                        { onClose: onEditorClose, disableCloseHandlers: true },
                        modalTypes
                    )
                }
            >
                Open editor
            </button>
            <button onClick={() => newModal(<h1>Unrelated overlay</h1>, undefined, modalTypes)}>
                Open unrelated
            </button>
            <button onClick={() => replaceModal(<h1>Replacement overlay</h1>)}>
                Replace editor
            </button>
            <output data-testid="modal-count">{modals.length}</output>
            <output data-testid="open-modal-ids">
                {modals
                    .filter(modal => modal.open)
                    .map(modal => modal.id)
                    .join(',')}
            </output>
            {renderOnRoute && <ProtectedEditor title={title} />}
            <Modals />
        </>
    );
};

describe('competency admin gate with the real fullscreen modal stack', () => {
    let queryClient: QueryClient;
    let portal: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        onEditorClose.mockClear();
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: Infinity } },
        });
        queryClient.setQueryData(['competency-admin-role'], { isScoutGlobalAdmin: true });
        portal = document.createElement('div');
        portal.id = 'modal-mid-root';
        document.body.appendChild(portal);
    });

    afterEach(() => {
        cleanup();
        queryClient.clear();
        portal.remove();
        vi.useRealTimers();
    });

    const renderHarness = (title: string, renderOnRoute = false, editor?: React.ReactNode) =>
        render(
            <QueryClientProvider client={queryClient}>
                <ModalsProvider>
                    <Harness title={title} renderOnRoute={renderOnRoute} editor={editor} />
                </ModalsProvider>
            </QueryClientProvider>
        );

    const loseAccess = async (reason: 'failed' | 'non-admin') => {
        await act(async () => {
            if (reason === 'failed') {
                queryClient
                    .getQueryCache()
                    .find({ queryKey: ['competency-admin-role'] })!
                    .setState({
                        status: 'error',
                        error: new Error('Role lookup failed'),
                    });
            } else {
                queryClient.setQueryData(['competency-admin-role'], { isScoutGlobalAdmin: false });
            }
            await vi.advanceTimersByTimeAsync(0);
        });
    };

    it.each([
        ['Create Framework', 'failed'],
        ['Create Framework', 'non-admin'],
        ['Manage JSON', 'failed'],
        ['Manage JSON', 'non-admin'],
    ] as const)('removes the %s fullscreen shell when access becomes %s', async (title, reason) => {
        renderHarness(title);
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));

        expect(portal.querySelector('aside.open[data-lc-surface="fullscreen"]')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Close editor' })).toBeTruthy();

        await loseAccess(reason);

        expect(screen.queryByRole('button', { name: 'Close editor' })).toBeNull();
        expect(portal.querySelector('aside.open')).toBeNull();
        expect(onEditorClose).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(portal.querySelector('aside')).toBeNull();
        expect(screen.getByTestId('modal-count').textContent).toBe('0');
    });

    it('closes only the affected editor when an unrelated overlay is above it', async () => {
        renderHarness('Create Framework');
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open unrelated' }));

        await loseAccess('non-admin');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(screen.getByTestId('open-modal-ids').textContent).toBe('1');
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(screen.getByText('Unrelated overlay')).toBeTruthy();
        expect(screen.queryByText('Create Framework')).toBeNull();
        expect(portal.querySelectorAll('aside.open')).toHaveLength(1);
        expect(onEditorClose).not.toHaveBeenCalled();
    });

    it('does not dismiss another modal when a route-mounted gate closes', async () => {
        renderHarness('Framework panel', true);
        fireEvent.click(screen.getByRole('button', { name: 'Open unrelated' }));

        await loseAccess('failed');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(screen.queryByText('Framework panel')).toBeNull();
        expect(screen.getByText('Unrelated overlay')).toBeTruthy();
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(portal.querySelectorAll('aside.open')).toHaveLength(1);
    });

    it('preserves a replacement modal after the guarded editor was unmounted', async () => {
        renderHarness('Manage JSON');
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
        fireEvent.click(screen.getByRole('button', { name: 'Replace editor' }));

        await loseAccess('failed');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(screen.getByText('Replacement overlay')).toBeTruthy();
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(portal.querySelectorAll('aside.open')).toHaveLength(1);
    });

    it.each(['selector', 'admin-tools'] as const)(
        'removes the %s shell when its inline permission gate closes',
        async kind => {
            const editor =
                kind === 'selector' ? (
                    <SelectFrameworkToManageModal />
                ) : (
                    <AdminToolsOptionsContainer
                        option={{
                            ...getAdminToolOptions()[0],
                            type: AdminToolOptionsEnum.SKILL_FRAMEWORKS,
                        }}
                    />
                );
            renderHarness('Framework management', false, editor);
            fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
            expect(portal.querySelector('aside.open')).not.toBeNull();

            await loseAccess('failed');
            await act(async () => {
                await vi.advanceTimersByTimeAsync(300);
            });

            expect(portal.querySelector('aside')).toBeNull();
            expect(screen.getByTestId('modal-count').textContent).toBe('0');
        }
    );

    it('keeps a badge-author selection modal open when global-admin access is absent', async () => {
        renderHarness(
            'Select competencies',
            false,
            <SelectFrameworkToManageModal onFrameworkSelectOverride={vi.fn()} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));

        await loseAccess('non-admin');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(screen.queryByText('Create Framework')).toBeNull();
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(portal.querySelectorAll('aside.open')).toHaveLength(1);
    });

    it('keeps unrelated Admin Tools open when global-admin access is absent', async () => {
        renderHarness(
            'Bulk import',
            false,
            <AdminToolsOptionsContainer option={getAdminToolOptions()[0]} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));

        await loseAccess('failed');
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(screen.getByText('Bulk import tool')).toBeTruthy();
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(portal.querySelectorAll('aside.open')).toHaveLength(1);
    });

    it.each([
        ['add', 'failed'],
        ['add', 'non-admin'],
        ['edit', 'failed'],
        ['edit', 'non-admin'],
        ['delete', 'failed'],
        ['delete', 'non-admin'],
    ] as const)(
        'dismisses an already-open %s competency modal when access becomes %s',
        async (kind, reason) => {
            const handleAdd = vi.fn();
            const handleEdit = vi.fn();
            const handleDelete = vi.fn();
            const node = {
                id: 'competency',
                type: 'Alignment' as const,
                targetName: 'First aid',
                role: FrameworkNodeRole.competency,
            };
            const framework = { id: 'fw', name: 'Scout skills', skills: [] };
            const editor =
                kind === 'delete' ? (
                    <ConfirmAlignmentDeletionModal
                        frameworkId={framework.id}
                        node={node}
                        onDelete={handleDelete}
                    />
                ) : (
                    <EditAlignmentModal
                        framework={framework}
                        node={node}
                        isCreate={kind === 'add'}
                        handleAdd={handleAdd}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                );

            renderHarness('Competency management', false, editor);
            fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
            const action = screen.getByRole('button', {
                name: kind === 'add' ? 'Create' : /Delete/,
            });
            const input = kind === 'delete' ? null : screen.getByPlaceholderText('Title');
            if (kind === 'edit') expect(handleEdit).toHaveBeenCalled();
            handleEdit.mockClear();

            await loseAccess(reason);

            expect(
                screen.queryByRole('button', { name: kind === 'add' ? 'Create' : /Delete/ })
            ).toBeNull();
            expect(screen.queryByPlaceholderText('Title')).toBeNull();
            expect(portal.querySelector('aside.open')).toBeNull();
            fireEvent.click(action);
            if (input) fireEvent.change(input, { target: { value: 'Unauthorized change' } });
            await act(async () => {
                await vi.advanceTimersByTimeAsync(300);
            });

            expect(handleAdd).not.toHaveBeenCalled();
            expect(handleEdit).not.toHaveBeenCalled();
            expect(handleDelete).not.toHaveBeenCalled();
            expect(screen.getByTestId('modal-count').textContent).toBe('0');
        }
    );

    it.each(['failed', 'non-admin'] as const)(
        'dismisses both an editor and its open delete confirmation when access becomes %s',
        async reason => {
            const handleDelete = vi.fn();
            const node = {
                id: 'competency',
                type: 'Alignment' as const,
                targetName: 'First aid',
                role: FrameworkNodeRole.competency,
            };
            renderHarness(
                'Edit competency',
                false,
                <EditAlignmentModal
                    framework={{ id: 'fw', name: 'Scout skills', skills: [] }}
                    node={node}
                    handleDelete={handleDelete}
                />
            );
            fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
            fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
            expect(screen.getByTestId('modal-count').textContent).toBe('2');
            const actions = screen.getAllByRole('button', { name: /Delete/ });
            expect(actions).toHaveLength(2);

            await loseAccess(reason);

            expect(screen.queryAllByRole('button', { name: /Delete/ })).toHaveLength(0);
            expect(portal.querySelectorAll('aside.open')).toHaveLength(0);
            actions.forEach(action => fireEvent.click(action));
            await act(async () => {
                await vi.advanceTimersByTimeAsync(301);
            });

            expect(handleDelete).not.toHaveBeenCalled();
            expect(screen.getByTestId('modal-count').textContent).toBe('0');
        }
    );

    it('lets global admins create, edit, and delete competencies', () => {
        const handleAdd = vi.fn();
        const handleEdit = vi.fn();
        const onDelete = vi.fn();
        const node = {
            id: 'competency',
            type: 'Alignment' as const,
            targetName: 'First aid',
            role: FrameworkNodeRole.competency,
        };
        const framework = { id: 'fw', name: 'Scout skills', skills: [] };
        const addView = renderHarness(
            'Add competency',
            false,
            <EditAlignmentModal framework={framework} node={node} isCreate handleAdd={handleAdd} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));
        expect(handleAdd).toHaveBeenCalledWith('root', node, []);
        addView.unmount();

        const editView = renderHarness(
            'Edit competency',
            false,
            <EditAlignmentModal framework={framework} node={node} handleEdit={handleEdit} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
        handleEdit.mockClear();
        fireEvent.change(screen.getByPlaceholderText('Title'), {
            target: { value: 'Updated first aid' },
        });
        expect(handleEdit).toHaveBeenCalledWith(
            expect.objectContaining({ targetName: 'Updated first aid' }),
            []
        );
        editView.unmount();

        renderHarness(
            'Delete competency',
            false,
            <ConfirmAlignmentDeletionModal
                frameworkId={framework.id}
                node={node}
                onDelete={onDelete}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open editor' }));
        fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
        expect(onDelete).toHaveBeenCalledWith(1);
    });
});
