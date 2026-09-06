// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const modalMocks = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    IonInput: ({
        onIonInput,
        onIonFocus,
        onIonBlur,
        maxlength,
        debounce: _debounce,
        autocapitalize,
        value,
        ...props
    }: {
        onIonInput?: (event: { detail: { value: string } }) => void;
        onIonFocus?: () => void;
        onIonBlur?: () => void;
        maxlength?: number;
        debounce?: number;
        autocapitalize?: string;
        value?: string | number | null;
    } & React.InputHTMLAttributes<HTMLInputElement>) => (
        <input
            {...props}
            value={value ?? ''}
            maxLength={maxlength}
            autoCapitalize={autocapitalize}
            onChange={event => onIonInput?.({ detail: { value: event.target.value } })}
            onFocus={onIonFocus}
            onBlur={onIonBlur}
        />
    ),
    IonTextarea: ({
        onIonInput,
        onIonFocus,
        onIonBlur,
        maxlength,
        debounce: _debounce,
        autoGrow: _autoGrow,
        autocapitalize,
        value,
        ...props
    }: {
        onIonInput?: (event: { detail: { value: string } }) => void;
        onIonFocus?: () => void;
        onIonBlur?: () => void;
        maxlength?: number;
        debounce?: number;
        autoGrow?: boolean;
        autocapitalize?: string;
        value?: string | null;
    } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
        <textarea
            {...props}
            value={value ?? ''}
            maxLength={maxlength}
            autoCapitalize={autocapitalize}
            onChange={event => onIonInput?.({ detail: { value: event.target.value } })}
            onFocus={onIonFocus}
            onBlur={onIonBlur}
        />
    ),
}));

vi.mock('../modals/useModal', () => ({
    default: () => modalMocks,
}));
vi.mock('learn-card-base/svgs/ChevronDown', () => ({
    default: () => <span aria-hidden="true" />,
}));

import Checkbox from './Checkbox';
import { RadioButton } from '../RadioButton';
import RadioGroup from './RadioGroup';
import SearchInput from './SearchInput';
import SelectInput from './SelectInput';
import TextArea from './TextArea';
import TextInput from './TextInput';
import Toggle from './Toggle';

describe('shared form input accessibility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('associates text input labels and errors with the control', () => {
        render(<TextInput value="" onChange={vi.fn()} label="Email" error="Enter a valid email" />);

        const input = screen.getByRole('textbox', { name: 'Email' });
        const error = screen.getByText('Enter a valid email');

        expect(input.getAttribute('aria-label')).toBe('Email');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(input.getAttribute('aria-describedby')).toBe(error.id);
    });

    it('applies visual class overrides to the field instead of the label wrapper', () => {
        render(
            <>
                <TextInput
                    value=""
                    onChange={vi.fn()}
                    aria-label="Email"
                    className="custom-input-surface"
                />
                <TextArea
                    value=""
                    onChange={vi.fn()}
                    aria-label="Summary"
                    className="custom-textarea-surface"
                />
            </>
        );

        const input = screen.getByRole('textbox', { name: 'Email' });
        const textarea = screen.getByRole('textbox', { name: 'Summary' });

        expect(input.parentElement?.classList.contains('custom-input-surface')).toBe(true);
        expect(input.parentElement?.parentElement?.classList.contains('custom-input-surface')).toBe(
            false
        );
        expect(textarea.parentElement?.classList.contains('custom-textarea-surface')).toBe(true);
        expect(
            textarea.parentElement?.parentElement?.classList.contains('custom-textarea-surface')
        ).toBe(false);
    });

    it('names search and textarea controls and keeps errors discoverable', () => {
        const onChange = vi.fn();
        render(
            <>
                <SearchInput value="query" onChange={onChange} placeholder="Search skills" />
                <TextArea
                    value=""
                    onChange={vi.fn()}
                    aria-label="Work summary"
                    error="Add a summary"
                />
            </>
        );

        expect(screen.getByRole('searchbox', { name: 'Search skills' })).toBeTruthy();
        expect(screen.getByRole('textbox', { name: 'Work summary' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
        expect(onChange).toHaveBeenCalledWith('');
    });

    it('exposes native keyboard controls with announced state', () => {
        const onToggle = vi.fn();
        const onCheck = vi.fn();
        render(
            <>
                <Toggle checked onChange={onToggle} aria-label="Enable analytics" />
                <Checkbox checked={false} onChange={onCheck} label="Current job" />
            </>
        );

        const toggle = screen.getByRole('switch', { name: 'Enable analytics' });
        const checkbox = screen.getByRole('checkbox', { name: 'Current job' });

        expect(toggle.tagName).toBe('BUTTON');
        expect(toggle.getAttribute('aria-checked')).toBe('true');
        expect(checkbox.tagName).toBe('BUTTON');
        expect(checkbox.getAttribute('aria-checked')).toBe('false');

        fireEvent.click(toggle);
        fireEvent.click(checkbox);
        expect(onToggle).toHaveBeenCalledWith(false);
        expect(onCheck).toHaveBeenCalledWith(true);
    });

    it('implements radio roles, roving focus, and arrow-key selection', () => {
        const onChange = vi.fn();
        render(
            <RadioGroup
                aria-label="Salary type"
                value="year"
                onChange={onChange}
                options={[
                    { value: 'year', label: 'Per year' },
                    { value: 'hour', label: 'Per hour' },
                ]}
            />
        );

        const group = screen.getByRole('radiogroup', { name: 'Salary type' });
        const yearly = screen.getByRole('radio', { name: 'Per year' });
        const hourly = screen.getByRole('radio', { name: 'Per hour' });

        expect(group).toBeTruthy();
        expect(yearly.getAttribute('aria-checked')).toBe('true');
        expect(yearly.getAttribute('tabindex')).toBe('0');
        expect(hourly.getAttribute('tabindex')).toBe('-1');

        yearly.focus();
        fireEvent.keyDown(yearly, { key: 'ArrowRight' });
        expect(onChange).toHaveBeenCalledWith('hour');
        expect(document.activeElement).toBe(hourly);
    });

    it('supports roving focus for standalone radio buttons in a named group', () => {
        const selectFirst = vi.fn();
        const selectSecond = vi.fn();

        render(
            <div role="radiogroup" aria-label="Share duration">
                <RadioButton aria-label="Live syncing" checked tabIndex={0} onClick={selectFirst} />
                <RadioButton
                    aria-label="One time"
                    checked={false}
                    tabIndex={-1}
                    onClick={selectSecond}
                />
            </div>
        );

        const first = screen.getByRole('radio', { name: 'Live syncing' });
        const second = screen.getByRole('radio', { name: 'One time' });

        first.focus();
        fireEvent.keyDown(first, { key: 'ArrowRight' });

        expect(selectSecond).toHaveBeenCalledWith(true);
        expect(document.activeElement).toBe(second);
    });

    it('does not toggle a standalone radio when navigation keeps focus on the same option', () => {
        const onClick = vi.fn();

        render(
            <div role="radiogroup" aria-label="Only option">
                <RadioButton aria-label="Only option" checked tabIndex={0} onClick={onClick} />
            </div>
        );

        const radio = screen.getByRole('radio', { name: 'Only option' });
        radio.focus();

        expect(fireEvent.keyDown(radio, { key: 'ArrowRight' })).toBe(false);
        fireEvent.keyDown(radio, { key: 'Home' });
        fireEvent.keyDown(radio, { key: 'End' });

        expect(onClick).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(radio);
    });

    it('announces select state and exposes keyboard-operable options', () => {
        const onChange = vi.fn();
        render(
            <SelectInput
                value="one"
                onChange={onChange}
                aria-label="Experience"
                options={[
                    { value: 'one', displayText: 'One year' },
                    { value: 'two', displayText: 'Two years' },
                ]}
            />
        );

        const trigger = screen.getByRole('button', { name: 'Experience' });
        expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.hasAttribute('aria-controls')).toBe(false);

        fireEvent.click(trigger);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        const modalContent = modalMocks.newModal.mock.calls[0][0] as React.ReactElement;
        render(modalContent);

        expect(screen.getByRole('listbox', { name: 'Experience options' })).toBeTruthy();
        fireEvent.click(screen.getByRole('option', { name: 'Two years' }));
        expect(onChange).toHaveBeenCalledWith('two');
        expect(modalMocks.closeModal).toHaveBeenCalledOnce();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
});
