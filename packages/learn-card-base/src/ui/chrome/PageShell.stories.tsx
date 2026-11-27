import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { IonMode } from '../app-shell/ionMode';
import { AppButton } from '../controls/AppButton';
import { AppButtons } from '../controls/AppButtons';
import {
    AppContent,
    AppFooter,
    AppHeader,
    AppPage,
    AppTitle,
    AppToolbar,
    type AppContentHandle,
} from '.';

type PreviewProps = {
    mode: IonMode;
    fullscreen: boolean;
    color?: string;
};

const ROWS = Array.from({ length: 30 }, (_, index) => `Row ${index + 1}`);

const Rows: React.FC = () => (
    <div className="flex flex-col gap-2 p-4">
        {ROWS.map(row => (
            <div key={row} className="rounded-[12px] bg-white p-3 text-sm text-grayscale-900">
                {row}
            </div>
        ))}
    </div>
);

/**
 * A page in a 390x700 frame: header, scrolling AppContent and footer. With `fullscreen` the
 * content scrolls under the (translucent, in iOS mode) header and footer.
 */
const PagePreview: React.FC<PreviewProps> = ({ mode, fullscreen, color }) => (
    <div className="relative h-[700px] w-[390px] overflow-hidden border border-grayscale-200">
        <AppPage>
            <AppHeader mode={mode} translucent={fullscreen}>
                <AppToolbar mode={mode}>
                    <AppTitle mode={mode}>Page title</AppTitle>
                </AppToolbar>
            </AppHeader>
            <AppContent mode={mode} fullscreen={fullscreen} color={color}>
                <Rows />
            </AppContent>
            <AppFooter mode={mode} translucent={fullscreen}>
                <AppToolbar mode={mode}>
                    <div className="px-4 text-sm">Footer toolbar</div>
                </AppToolbar>
            </AppFooter>
        </AppPage>
    </div>
);

/** The imperative scroll API and the scroll events (`scrollEvents` + `onIonScroll`). */
const ScrollApiPreview: React.FC = () => {
    const content = useRef<AppContentHandle>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrolling, setScrolling] = useState(false);
    return (
        <div className="relative h-[700px] w-[390px] overflow-hidden border border-grayscale-200">
            <AppPage>
                <AppHeader>
                    <AppToolbar>
                        <AppButtons slot="start">
                            <AppButton onClick={() => content.current?.scrollToTop(300)}>
                                Top
                            </AppButton>
                        </AppButtons>
                        <AppTitle>
                            {scrollTop}px{scrolling ? ' (scrolling)' : ''}
                        </AppTitle>
                        <AppButtons slot="end">
                            <AppButton onClick={() => content.current?.scrollToBottom(300)}>
                                Bottom
                            </AppButton>
                        </AppButtons>
                    </AppToolbar>
                </AppHeader>
                <AppContent
                    ref={content}
                    color="grayscale-100"
                    scrollEvents
                    onIonScrollStart={() => setScrolling(true)}
                    onIonScroll={event => setScrollTop(Math.round(event.detail.scrollTop))}
                    onIonScrollEnd={() => setScrolling(false)}
                >
                    <Rows />
                </AppContent>
            </AppPage>
        </div>
    );
};

const meta: Meta<typeof PagePreview> = {
    title: 'Page Shell/AppPage and AppContent',
    component: PagePreview,
    parameters: { layout: 'centered' },
    args: { mode: 'md', fullscreen: false, color: undefined },
    argTypes: {
        mode: { control: 'inline-radio', options: ['md', 'ios'] },
        color: { control: 'text' },
    },
};

export default meta;

type Story = StoryObj<typeof PagePreview>;

export const Page: Story = {};

export const IosFullscreen: Story = { args: { mode: 'ios', fullscreen: true } };

export const Colored: Story = { args: { color: 'grayscale-800' } };

export const ScrollApi: Story = { render: () => <ScrollApiPreview /> };
