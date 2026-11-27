import React, { useState } from 'react';
import { IonApp } from '@ionic/react';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import { CredentialCategoryEnum } from 'learn-card-base';

import LaunchPadHeaderTitle from '../../src/pages/launchPad/LaunchPadHeader/LaunchPadHeaderTitle';
import CenteredSubHeader from '../../src/pages/skills/CenteredSubHeader';
import { SubheaderTypeEnum } from '../../src/components/main-subheader/MainSubHeader.types';
import NewBoostButton from '../../src/components/boost/NewBoostButton';

/**
 * `grid-1`: the app's IonGrid / IonRow / IonCol call sites (phase 4, grid batch), rendered with fixed
 * local data and no backend.
 * - Matrices cover what the call sites pass (`size`, camelCase and kebab-case breakpoint sizes,
 *   `auto`, Tailwind classes, `ion-padding` / `ion-no-padding`, inline styles, `role` + `onClick`)
 *   and the Ionic API they don't use yet (`fixed`, `offset*`, `push*`, `pull*`, `--ion-grid-*`).
 * - Excerpts are copied from the cited source lines; the components in the last section render for real.
 * Colors and heights are inline so the boxes don't depend on Tailwind generating fixture-only classes.
 */

const Block: React.FC<{ testId: string; title: string; children: React.ReactNode }> = ({
    testId,
    title,
    children,
}) => (
    <section data-testid={testId} className="w-full flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grayscale-600">
            {title}
        </h2>
        {children}
    </section>
);

const COLORS = ['#c7d2fe', '#bbf7d0', '#fde68a', '#fecaca', '#bae6fd', '#e9d5ff'];

const Box: React.FC<{ i?: number; label: string; h?: number }> = ({ i = 0, label, h = 32 }) => (
    <div
        style={{
            background: COLORS[i % COLORS.length],
            minHeight: h,
            fontSize: 11,
            fontFamily: 'monospace',
        }}
    >
        {label}
    </div>
);

const Frame: React.FC<{
    label: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}> = ({ label, children, style }) => (
    <div
        data-frame={label}
        style={{ background: '#f1f5f9', outline: '1px solid #cbd5e1', ...style }}
    >
        {children}
    </div>
);

const ClickRow: React.FC = () => {
    const [clicks, setClicks] = useState(0);
    return (
        <AppGrid>
            <AppRow role="button" onClick={() => setClicks(c => c + 1)} data-testid="click-row">
                <AppCol>
                    <Box label={`role=button row, clicks: ${clicks}`} />
                </AppCol>
            </AppRow>
        </AppGrid>
    );
};

export const GridVisualFixture: React.FC = () => (
    <main className="flex flex-col gap-6 p-4">
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="g1-sizes" title="Column sizes (synthetic)">
            <Frame label="equal">
                <AppGrid>
                    <AppRow>
                        <AppCol>
                            <Box i={0} label="auto-equal" />
                        </AppCol>
                        <AppCol>
                            <Box i={1} label="auto-equal" />
                        </AppCol>
                        <AppCol>
                            <Box i={2} label="auto-equal" />
                        </AppCol>
                    </AppRow>
                    <AppRow>
                        <AppCol size="12">
                            <Box i={3} label="12" />
                        </AppCol>
                        <AppCol size="6">
                            <Box i={4} label="6" />
                        </AppCol>
                        <AppCol size="6">
                            <Box i={5} label="6" />
                        </AppCol>
                        <AppCol size="9">
                            <Box i={0} label="9" />
                        </AppCol>
                        <AppCol size="3">
                            <Box i={1} label="3" />
                        </AppCol>
                        <AppCol size="2">
                            <Box i={2} label="2" />
                        </AppCol>
                        <AppCol size="10">
                            <Box i={3} label="10" />
                        </AppCol>
                        <AppCol size="11">
                            <Box i={4} label="11" />
                        </AppCol>
                        <AppCol>
                            <Box i={5} label="rest" />
                        </AppCol>
                    </AppRow>
                    <AppRow>
                        <AppCol size="auto">
                            <Box i={0} label="auto: shrink to content" />
                        </AppCol>
                        <AppCol>
                            <Box i={1} label="grow" />
                        </AppCol>
                        <AppCol size="auto">
                            <Box i={2} label="auto" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
        </Block>

        <Block testId="g1-responsive" title="Breakpoint sizes, offset, push, pull (synthetic)">
            <Frame label="responsive">
                <AppGrid>
                    <AppRow>
                        <AppCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                            <Box i={0} label="xs12 sm10 md8 lg6" />
                        </AppCol>
                        <AppCol size="6" sizeSm={4} sizeMd={4} sizeLg={3}>
                            <Box i={1} label="6 / size-sm 4 / size-md 4 / size-lg 3 (kebab)" />
                        </AppCol>
                        <AppCol size="6" sizeSm="4" sizeMd="4" sizeLg="3">
                            <Box i={2} label="kebab strings" />
                        </AppCol>
                        <AppCol size="12" sizeMd="auto" sizeXl="4">
                            <Box i={3} label="12 / md auto / xl 4" />
                        </AppCol>
                    </AppRow>
                    <AppRow>
                        <AppCol size="4" offset="2">
                            <Box i={4} label="4 offset 2" />
                        </AppCol>
                        <AppCol size="4" offsetMd="4" offsetXl="0">
                            <Box i={5} label="4 offset-md 4 offset-xl 0" />
                        </AppCol>
                    </AppRow>
                    <AppRow>
                        <AppCol size="9" push="3">
                            <Box i={0} label="9 push 3" />
                        </AppCol>
                        <AppCol size="3" pull="9" pullLg="0">
                            <Box i={1} label="3 pull 9 pull-lg 0" />
                        </AppCol>
                        <AppCol size="6" pushSm="6" sizeSm="3">
                            <Box i={2} label="6 / sm 3 push-sm 6" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
        </Block>

        <Block
            testId="g1-grid-props"
            title="Grid fixed, custom properties and padding classes (synthetic)"
        >
            <Frame label="fixed">
                <AppGrid fixed>
                    <AppRow>
                        <AppCol>
                            <Box i={0} label="fixed grid" />
                        </AppCol>
                        <AppCol>
                            <Box i={1} label="fixed grid" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="fixed-vars">
                <AppGrid
                    fixed
                    style={
                        {
                            '--ion-grid-width-md': '600px',
                            '--ion-grid-width': '300px',
                        } as React.CSSProperties
                    }
                >
                    <AppRow>
                        <AppCol>
                            <Box i={2} label="--ion-grid-width 300 / md 600" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="padding-vars">
                <AppGrid
                    style={
                        {
                            '--ion-grid-padding': '12px',
                            '--ion-grid-padding-md': '24px',
                            '--ion-grid-column-padding': '9px',
                            '--ion-grid-column-padding-lg': '2px',
                        } as React.CSSProperties
                    }
                >
                    <AppRow>
                        <AppCol>
                            <Box i={3} label="grid 12/md24, col 9/lg2" />
                        </AppCol>
                        <AppCol>
                            <Box i={4} label="grid 12/md24, col 9/lg2" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="columns-var">
                <AppGrid style={{ '--ion-grid-columns': '6' } as React.CSSProperties}>
                    <AppRow>
                        <AppCol size="2">
                            <Box i={5} label="2 of 6" />
                        </AppCol>
                        <AppCol size="4">
                            <Box i={0} label="4 of 6" />
                        </AppCol>
                        <AppCol size="3" offset="3">
                            <Box i={1} label="3 offset 3 of 6" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="no-padding">
                <AppGrid className="ion-no-padding">
                    <AppRow>
                        <AppCol>
                            <Box i={2} label="ion-no-padding grid" />
                        </AppCol>
                        <AppCol className="ion-padding">
                            <Box i={3} label="ion-padding col" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            {/* tests/visual/main.tsx credential-gutters / explicit-grid-spacing */}
            <Frame label="gutters">
                <AppGrid className="max-w-[600px] pt-[20px]">
                    <AppRow>
                        {[0, 1, 2, 3].map(index => (
                            <AppCol size="6" key={index}>
                                <Box i={index} label="gutter card" h={60} />
                            </AppCol>
                        ))}
                    </AppRow>
                </AppGrid>
                <AppGrid className="p-0 m-0">
                    <AppRow>
                        <AppCol className="p-0">
                            <Box i={4} label="p-0 m-0 grid, p-0 col" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="space-y">
                <div className="space-y-4">
                    <AppGrid>
                        <AppRow>
                            <AppCol>
                                <Box i={5} label="space-y-4 child grid 1" />
                            </AppCol>
                        </AppRow>
                    </AppGrid>
                    <AppGrid>
                        <AppRow>
                            <AppCol>
                                <Box i={0} label="space-y-4 child grid 2" />
                            </AppCol>
                        </AppRow>
                    </AppGrid>
                </div>
            </Frame>
        </Block>

        <Block
            testId="g1-rows"
            title="Row alignment classes, nesting, styles and clicks (synthetic)"
        >
            <Frame label="align">
                <AppGrid>
                    <AppRow
                        className="ion-align-items-center ion-justify-content-between"
                        style={{ height: 80 }}
                    >
                        <AppCol size="3">
                            <Box i={1} label="center / between" />
                        </AppCol>
                        <AppCol size="3">
                            <Box i={2} label="center / between" h={48} />
                        </AppCol>
                    </AppRow>
                    <AppRow className="ion-nowrap">
                        <AppCol size="8">
                            <Box i={3} label="ion-nowrap 8" />
                        </AppCol>
                        <AppCol size="8">
                            <Box i={4} label="ion-nowrap 8" />
                        </AppCol>
                    </AppRow>
                    <AppRow className="flex items-center justify-center flex-col w-full px-4">
                        <AppCol className="flex items-center justify-start w-full max-w-[600px]">
                            <Box i={5} label="Tailwind flex-col row" />
                        </AppCol>
                    </AppRow>
                    <AppRow className="w-full max-w-[600px]">
                        <AppCol className="flex items-center justify-between w-full ion-padding">
                            <Box i={0} label="class= excerpt (ConsentFlowShareDurationModal)" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="nested" style={{ height: 200 }}>
                <AppGrid style={{ height: '100%' }}>
                    <AppRow
                        style={{ height: '100%' }}
                        className="ion-justify-content-center ion-align-items-center"
                    >
                        <AppCol size="8" style={{ backgroundColor: '#e2e8f0' }}>
                            <AppGrid>
                                <AppRow>
                                    <AppCol size="6">
                                        <Box i={1} label="nested 6" />
                                    </AppCol>
                                    <AppCol size="6">
                                        <Box i={2} label="nested 6" />
                                    </AppCol>
                                </AppRow>
                            </AppGrid>
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <ClickRow />
        </Block>

        {/* InteractionsPage.tsx:184-192, MainHeader.tsx:133-169, WalletPage.tsx:268-276 */}
        <Block testId="g1-excerpts" title="Call-site excerpts">
            <Frame label="interactions" style={{ height: 220 }}>
                <AppGrid style={{ height: '100%' }}>
                    <AppRow
                        className="ion-justify-content-center ion-align-items-center"
                        style={{ height: '100%' }}
                    >
                        <AppCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                            <Box i={0} label="Interaction error card" h={120} />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="main-header">
                <AppGrid className="bg-white" style={{ paddingTop: 5 }}>
                    <AppRow>
                        <AppCol size="2" className="flex justify-start items-center">
                            <Box i={1} label="menu" />
                        </AppCol>
                        <AppCol size="10" className="flex justify-end items-center gap-2">
                            <Box i={2} label="actions" />
                            <Box i={3} label="avatar" />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
            <Frame label="wallet">
                <AppRow className="wallet-squares-wrapper max-w-[840px] mx-auto mt-[16px]">
                    <AppCol className="wallet-squares-container grid">
                        <Box i={4} label="wallet squares" h={60} />
                    </AppCol>
                </AppRow>
            </Frame>
            <Frame label="login-bg">
                <AppGrid
                    className="flex items-center justify-center flex-col w-full px-4 pb-14"
                    style={{ backgroundColor: '#1e293b' }}
                >
                    <AppRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                        <Box i={5} label="login form row" />
                    </AppRow>
                </AppGrid>
            </Frame>
        </Block>

        <Block testId="g1-real" title="Real components">
            <Frame label="launchpad-title">
                <div style={{ paddingTop: 60 }}>
                    <LaunchPadHeaderTitle />
                </div>
            </Frame>
            <Frame label="centered-subheader">
                <CenteredSubHeader subheaderType={SubheaderTypeEnum.Skill} />
            </Frame>
            <Frame label="new-boost">
                <AppGrid>
                    <AppRow>
                        <NewBoostButton
                            credentialType={CredentialCategoryEnum.achievement}
                            onClick={() => undefined}
                        />
                        <AppCol size="6" sizeSm={4} sizeMd={4} sizeLg={4}>
                            <Box i={0} label="sibling card" h={280} />
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </Frame>
        </Block>
    </main>
);
