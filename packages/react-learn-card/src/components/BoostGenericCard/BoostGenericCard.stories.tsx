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
                #app-router button:focus-visible {
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
    const focusedStyle = getComputedStyle(card);

    await expect(card).toHaveFocus();
    await expect(focusedStyle.outlineStyle).toBe('solid');
    await expect(focusedStyle.outlineWidth).toBe('3px');
    await expect(focusedStyle.outlineOffset).toBe('-3px');
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
