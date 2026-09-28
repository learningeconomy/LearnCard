import React from 'react';
import { Decorator, Meta, Story } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import BoostGenericCard from './BoostGenericCard';
import { BoostGenericCardProps, WalletCategoryTypes } from '../../types';
import { AllFieldsCredential } from '../../helpers/test.helpers';

export default {
    title: 'Boost Generic Card',
    component: BoostGenericCard,
    argTypes: {},
} as Meta<typeof BoostGenericCard>;

const Template: Story<BoostGenericCardProps> = args => <BoostGenericCard {...args} />;

const withConsumerFocusReset: Decorator = StoryComponent => (
    <>
        <style>
            {`
                :where(#app-router, #modal-mid-root) :where(button):focus-visible {
                    outline: none;
                    outline-offset: 2px;
                }
            `}
        </style>
        <div id="app-router">
            <StoryComponent />
        </div>
    </>
);

export const BoostGenericCardTest = Template.bind({});
BoostGenericCardTest.args = {
    title: 'Title Title Title',
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    bgImgSrc: 'https://picsum.photos/200',
    dateDisplay: 'May 21, 2022',
    issuerName: 'Beau Bobby Bruce',
    innerOnClick: () => console.log('innerOnClick'),
    optionsTriggerOnClick: () => console.log('//options trigger click'),
};

export const KeyboardFocus = Template.bind({});
KeyboardFocus.args = BoostGenericCardTest.args;
KeyboardFocus.decorators = [withConsumerFocusReset];
KeyboardFocus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();

    const card = canvas.getByRole('button', { name: /Title Title Title/ });
    const cardFrame = card.closest<HTMLElement>('.boost-generic-card-wrapper');

    await expect(card).toHaveFocus();
    await expect(cardFrame).not.toBeNull();

    const focusedStyle = getComputedStyle(card);
    const frameStyle = getComputedStyle(cardFrame!);

    await expect(focusedStyle.outlineStyle).toBe('none');
    await expect(focusedStyle.boxShadow).toBe('none');
    await expect(frameStyle.boxShadow).toContain('rgb(255, 255, 255) 0px 0px 0px 2px');
    await expect(frameStyle.boxShadow).toContain('rgb(64, 203, 166) 0px 0px 0px 4px');
};

export const InSkillsModal = Template.bind({});
InSkillsModal.args = {
    title: 'Title Title Title',
    type: WalletCategoryTypes.skills,
    thumbImgSrc: '',
    bgImgSrc: 'https://picsum.photos/200',
    dateDisplay: 'May 21, 2022',
    issuerName: 'Beau Bobby Bruce',
    innerOnClick: () => console.log('innerOnClick'),
    optionsTriggerOnClick: () => console.log('//options trigger click'),
    isInSkillsModal: true,
    credential: AllFieldsCredential,
};
