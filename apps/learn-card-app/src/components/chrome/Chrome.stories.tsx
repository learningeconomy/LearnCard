import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IonContent, IonPage } from '@ionic/react';
import { createMemoryHistory } from 'history';

import { AppShellRouter } from '../app-shell/AppShellRouter';
import type { IonMode } from '../app-shell/ionMode';
import { AppButton } from '../controls/AppButton';
import { AppButtons } from '../controls/AppButtons';
import { AppBackButton, AppFooter, AppHeader, AppTitle, AppToolbar } from '.';

type PreviewProps = {
    mode: IonMode;
    translucent: boolean;
    noBorder: boolean;
};

const ROWS = Array.from({ length: 30 }, (_, index) => `Row ${index + 1}`);

/**
 * A full page: header (back button, title, end button), scrolling IonContent and a footer.
 * `translucent` blurs the content under the iOS header. The page sits in a 390x700 frame, so the
 * header and footer pin to the frame like they do to the screen.
 */
const PagePreview: React.FC<PreviewProps> = ({ mode, translucent, noBorder }) => (
    <AppShellRouter history={createMemoryHistory({ initialEntries: ['/page'] })}>
        <div className="relative h-[700px] w-[390px] overflow-hidden border border-grayscale-200">
            <IonPage>
                <AppHeader
                    mode={mode}
                    translucent={translucent}
                    className={noBorder ? 'ion-no-border' : undefined}
                >
                    <AppToolbar mode={mode}>
                        <AppButtons slot="start" mode={mode}>
                            <AppBackButton defaultHref="/home" mode={mode} />
                        </AppButtons>
                        <AppTitle mode={mode}>Page title</AppTitle>
                        <AppButtons slot="end" mode={mode}>
                            <AppButton mode={mode}>More</AppButton>
                        </AppButtons>
                    </AppToolbar>
                </AppHeader>
                <IonContent fullscreen={translucent}>
                    {ROWS.map(row => (
                        <p key={row} className="border-b border-grayscale-100 px-4 py-3">
                            {row}
                        </p>
                    ))}
                </IonContent>
                <AppFooter mode={mode} className={noBorder ? 'ion-no-border' : undefined}>
                    <AppToolbar mode={mode}>
                        <div className="flex justify-center p-2">
                            <AppButton mode={mode}>Continue</AppButton>
                        </div>
                    </AppToolbar>
                </AppFooter>
            </IonPage>
        </div>
    </AppShellRouter>
);

const COLORS = [
    'primary',
    'light',
    'dark',
    'grayscale-100',
    'grayscale-900',
    'blue-500',
    'pink-500',
];

/** Toolbars in theme colors, both modes. */
const ColorsPreview: React.FC = () => (
    <div className="flex w-[390px] flex-col gap-2">
        {(['md', 'ios'] as const).map(mode =>
            COLORS.map(color => (
                <AppToolbar key={`${mode}-${color}`} mode={mode} color={color}>
                    <AppTitle mode={mode}>
                        {color} ({mode})
                    </AppTitle>
                </AppToolbar>
            ))
        )}
    </div>
);

const meta: Meta<typeof PagePreview> = {
    title: 'Chrome/AppHeader, AppToolbar, AppFooter',
    component: PagePreview,
    args: { mode: 'md', translucent: false, noBorder: false },
    argTypes: { mode: { control: 'inline-radio', options: ['md', 'ios'] } },
};

export default meta;

type Story = StoryObj<typeof PagePreview>;

export const Page: Story = {};

export const IosTranslucent: Story = { args: { mode: 'ios', translucent: true } };

export const NoBorder: Story = { args: { noBorder: true } };

export const Colors: Story = { render: () => <ColorsPreview /> };
