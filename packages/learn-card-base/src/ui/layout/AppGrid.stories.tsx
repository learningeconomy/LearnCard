import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppCol } from './AppCol';
import { AppGrid } from './AppGrid';
import { AppRow } from './AppRow';

/**
 * Synthetic AppGrid / AppRow / AppCol layouts covering the props the app uses. Resize the preview to
 * see the breakpoint sizes (sm 576px, md 768px, lg 992px, xl 1200px). Colors are inline.
 */
const COLORS = ['#c7d2fe', '#bbf7d0', '#fde68a', '#fecaca', '#bae6fd', '#e9d5ff'];

const Cell: React.FC<{ i: number; children: React.ReactNode }> = ({ i, children }) => (
    <div style={{ background: COLORS[i % COLORS.length], minHeight: 32, fontSize: 12 }}>
        {children}
    </div>
);

const Layouts: React.FC = () => (
    <AppGrid>
        <AppRow>
            <AppCol>
                <Cell i={0}>auto</Cell>
            </AppCol>
            <AppCol>
                <Cell i={1}>auto</Cell>
            </AppCol>
            <AppCol>
                <Cell i={2}>auto</Cell>
            </AppCol>
        </AppRow>
        <AppRow>
            <AppCol size="9">
                <Cell i={3}>size 9</Cell>
            </AppCol>
            <AppCol size="3">
                <Cell i={4}>size 3</Cell>
            </AppCol>
            <AppCol size="auto">
                <Cell i={5}>size auto</Cell>
            </AppCol>
            <AppCol>
                <Cell i={0}>rest</Cell>
            </AppCol>
        </AppRow>
        <AppRow>
            <AppCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                <Cell i={1}>xs 12 / sm 10 / md 8 / lg 6</Cell>
            </AppCol>
            <AppCol size="6" sizeSm={4} sizeMd={4} sizeLg={3}>
                <Cell i={2}>6 / sm 4 / md 4 / lg 3</Cell>
            </AppCol>
        </AppRow>
        <AppRow>
            <AppCol size="4" offset="2">
                <Cell i={3}>4 offset 2</Cell>
            </AppCol>
            <AppCol size="3" push="3">
                <Cell i={4}>3 push 3</Cell>
            </AppCol>
        </AppRow>
    </AppGrid>
);

const CustomProperties: React.FC = () => (
    <AppGrid
        fixed
        style={
            {
                '--app-grid-padding': '16px',
                '--ion-grid-column-padding': '8px',
                '--app-grid-columns': '6',
            } as React.CSSProperties
        }
    >
        <AppRow>
            <AppCol size="2">
                <Cell i={0}>2 of 6</Cell>
            </AppCol>
            <AppCol size="4">
                <Cell i={1}>4 of 6</Cell>
            </AppCol>
        </AppRow>
    </AppGrid>
);

const meta: Meta<typeof AppGrid> = {
    title: 'Layout/AppGrid',
    component: AppGrid,
};

export default meta;

type Story = StoryObj<typeof AppGrid>;

export const ResponsiveColumns: Story = { render: () => <Layouts /> };

export const FixedWithCustomProperties: Story = { render: () => <CustomProperties /> };
