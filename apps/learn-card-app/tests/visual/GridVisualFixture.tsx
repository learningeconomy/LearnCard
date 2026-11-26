import React, { useState } from 'react';
import { IonApp, IonCol, IonGrid, IonRow } from '@ionic/react';
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
        <IonGrid>
            <IonRow role="button" onClick={() => setClicks(c => c + 1)} data-testid="click-row">
                <IonCol>
                    <Box label={`role=button row, clicks: ${clicks}`} />
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

export const GridVisualFixture: React.FC = () => (
    <main className="flex flex-col gap-6 p-4">
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="g1-sizes" title="Column sizes (synthetic)">
            <Frame label="equal">
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <Box i={0} label="auto-equal" />
                        </IonCol>
                        <IonCol>
                            <Box i={1} label="auto-equal" />
                        </IonCol>
                        <IonCol>
                            <Box i={2} label="auto-equal" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol size="12">
                            <Box i={3} label="12" />
                        </IonCol>
                        <IonCol size="6">
                            <Box i={4} label="6" />
                        </IonCol>
                        <IonCol size="6">
                            <Box i={5} label="6" />
                        </IonCol>
                        <IonCol size="9">
                            <Box i={0} label="9" />
                        </IonCol>
                        <IonCol size="3">
                            <Box i={1} label="3" />
                        </IonCol>
                        <IonCol size="2">
                            <Box i={2} label="2" />
                        </IonCol>
                        <IonCol size="10">
                            <Box i={3} label="10" />
                        </IonCol>
                        <IonCol size="11">
                            <Box i={4} label="11" />
                        </IonCol>
                        <IonCol>
                            <Box i={5} label="rest" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol size="auto">
                            <Box i={0} label="auto: shrink to content" />
                        </IonCol>
                        <IonCol>
                            <Box i={1} label="grow" />
                        </IonCol>
                        <IonCol size="auto">
                            <Box i={2} label="auto" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
        </Block>

        <Block testId="g1-responsive" title="Breakpoint sizes, offset, push, pull (synthetic)">
            <Frame label="responsive">
                <IonGrid>
                    <IonRow>
                        <IonCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                            <Box i={0} label="xs12 sm10 md8 lg6" />
                        </IonCol>
                        <IonCol size="6" size-sm={4} size-md={4} size-lg={3}>
                            <Box i={1} label="6 / size-sm 4 / size-md 4 / size-lg 3 (kebab)" />
                        </IonCol>
                        <IonCol size="6" size-sm="4" size-md="4" size-lg="3">
                            <Box i={2} label="kebab strings" />
                        </IonCol>
                        <IonCol size="12" sizeMd="auto" sizeXl="4">
                            <Box i={3} label="12 / md auto / xl 4" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol size="4" offset="2">
                            <Box i={4} label="4 offset 2" />
                        </IonCol>
                        <IonCol size="4" offsetMd="4" offsetXl="0">
                            <Box i={5} label="4 offset-md 4 offset-xl 0" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol size="9" push="3">
                            <Box i={0} label="9 push 3" />
                        </IonCol>
                        <IonCol size="3" pull="9" pullLg="0">
                            <Box i={1} label="3 pull 9 pull-lg 0" />
                        </IonCol>
                        <IonCol size="6" pushSm="6" sizeSm="3">
                            <Box i={2} label="6 / sm 3 push-sm 6" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
        </Block>

        <Block
            testId="g1-grid-props"
            title="Grid fixed, custom properties and padding classes (synthetic)"
        >
            <Frame label="fixed">
                <IonGrid fixed>
                    <IonRow>
                        <IonCol>
                            <Box i={0} label="fixed grid" />
                        </IonCol>
                        <IonCol>
                            <Box i={1} label="fixed grid" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="fixed-vars">
                <IonGrid
                    fixed
                    style={
                        {
                            '--ion-grid-width-md': '600px',
                            '--ion-grid-width': '300px',
                        } as React.CSSProperties
                    }
                >
                    <IonRow>
                        <IonCol>
                            <Box i={2} label="--ion-grid-width 300 / md 600" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="padding-vars">
                <IonGrid
                    style={
                        {
                            '--ion-grid-padding': '12px',
                            '--ion-grid-padding-md': '24px',
                            '--ion-grid-column-padding': '9px',
                            '--ion-grid-column-padding-lg': '2px',
                        } as React.CSSProperties
                    }
                >
                    <IonRow>
                        <IonCol>
                            <Box i={3} label="grid 12/md24, col 9/lg2" />
                        </IonCol>
                        <IonCol>
                            <Box i={4} label="grid 12/md24, col 9/lg2" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="columns-var">
                <IonGrid style={{ '--ion-grid-columns': '6' } as React.CSSProperties}>
                    <IonRow>
                        <IonCol size="2">
                            <Box i={5} label="2 of 6" />
                        </IonCol>
                        <IonCol size="4">
                            <Box i={0} label="4 of 6" />
                        </IonCol>
                        <IonCol size="3" offset="3">
                            <Box i={1} label="3 offset 3 of 6" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="no-padding">
                <IonGrid className="ion-no-padding">
                    <IonRow>
                        <IonCol>
                            <Box i={2} label="ion-no-padding grid" />
                        </IonCol>
                        <IonCol className="ion-padding">
                            <Box i={3} label="ion-padding col" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            {/* tests/visual/main.tsx credential-gutters / explicit-grid-spacing */}
            <Frame label="gutters">
                <IonGrid className="max-w-[600px] pt-[20px]">
                    <IonRow>
                        {[0, 1, 2, 3].map(index => (
                            <IonCol size="6" key={index}>
                                <Box i={index} label="gutter card" h={60} />
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
                <IonGrid className="p-0 m-0">
                    <IonRow>
                        <IonCol className="p-0">
                            <Box i={4} label="p-0 m-0 grid, p-0 col" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="space-y">
                <div className="space-y-4">
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <Box i={5} label="space-y-4 child grid 1" />
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <Box i={0} label="space-y-4 child grid 2" />
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </div>
            </Frame>
        </Block>

        <Block
            testId="g1-rows"
            title="Row alignment classes, nesting, styles and clicks (synthetic)"
        >
            <Frame label="align">
                <IonGrid>
                    <IonRow
                        className="ion-align-items-center ion-justify-content-between"
                        style={{ height: 80 }}
                    >
                        <IonCol size="3">
                            <Box i={1} label="center / between" />
                        </IonCol>
                        <IonCol size="3">
                            <Box i={2} label="center / between" h={48} />
                        </IonCol>
                    </IonRow>
                    <IonRow className="ion-nowrap">
                        <IonCol size="8">
                            <Box i={3} label="ion-nowrap 8" />
                        </IonCol>
                        <IonCol size="8">
                            <Box i={4} label="ion-nowrap 8" />
                        </IonCol>
                    </IonRow>
                    <IonRow className="flex items-center justify-center flex-col w-full px-4">
                        <IonCol className="flex items-center justify-start w-full max-w-[600px]">
                            <Box i={5} label="Tailwind flex-col row" />
                        </IonCol>
                    </IonRow>
                    <IonRow className="w-full max-w-[600px]">
                        <IonCol className="flex items-center justify-between w-full ion-padding">
                            <Box i={0} label="class= excerpt (ConsentFlowShareDurationModal)" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="nested" style={{ height: 200 }}>
                <IonGrid style={{ height: '100%' }}>
                    <IonRow
                        style={{ height: '100%' }}
                        className="ion-justify-content-center ion-align-items-center"
                    >
                        <IonCol size="8" style={{ backgroundColor: '#e2e8f0' }}>
                            <IonGrid>
                                <IonRow>
                                    <IonCol size="6">
                                        <Box i={1} label="nested 6" />
                                    </IonCol>
                                    <IonCol size="6">
                                        <Box i={2} label="nested 6" />
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <ClickRow />
        </Block>

        {/* InteractionsPage.tsx:184-192, MainHeader.tsx:133-169, WalletPage.tsx:268-276 */}
        <Block testId="g1-excerpts" title="Call-site excerpts">
            <Frame label="interactions" style={{ height: 220 }}>
                <IonGrid style={{ height: '100%' }}>
                    <IonRow
                        className="ion-justify-content-center ion-align-items-center"
                        style={{ height: '100%' }}
                    >
                        <IonCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                            <Box i={0} label="Interaction error card" h={120} />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="main-header">
                <IonGrid className="bg-white" style={{ paddingTop: 5 }}>
                    <IonRow>
                        <IonCol size="2" className="flex justify-start items-center">
                            <Box i={1} label="menu" />
                        </IonCol>
                        <IonCol size="10" className="flex justify-end items-center gap-2">
                            <Box i={2} label="actions" />
                            <Box i={3} label="avatar" />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
            <Frame label="wallet">
                <IonRow className="wallet-squares-wrapper max-w-[840px] mx-auto mt-[16px]">
                    <IonCol className="wallet-squares-container grid">
                        <Box i={4} label="wallet squares" h={60} />
                    </IonCol>
                </IonRow>
            </Frame>
            <Frame label="login-bg">
                <IonGrid
                    className="flex items-center justify-center flex-col w-full px-4 pb-14"
                    style={{ backgroundColor: '#1e293b' }}
                >
                    <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                        <Box i={5} label="login form row" />
                    </IonRow>
                </IonGrid>
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
                <IonGrid>
                    <IonRow>
                        <NewBoostButton
                            credentialType={CredentialCategoryEnum.achievement}
                            onClick={() => undefined}
                        />
                        <IonCol size="6" size-sm={4} size-md={4} size-lg={4}>
                            <Box i={0} label="sibling card" h={280} />
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </Frame>
        </Block>
    </main>
);
