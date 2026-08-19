/** @vitest-environment jsdom */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import FormatQuestionTitle from './FormatQuestionTitle';

describe('FormatQuestionTitle', () => {
    it('bolds the emphasized phrase', () => {
        render(
            <FormatQuestionTitle
                title="What would you like to learn about?"
                phraseToEmphasize="learn"
            />
        );

        expect(screen.getByText('learn').tagName).toBe('SPAN');
    });

    it('renders the title unstyled when the phrase is absent', () => {
        // LC-1901: a translated title paired with an untranslated emphasis phrase
        // lands here — it must degrade to plain text, never throw.
        render(
            <FormatQuestionTitle
                title="¿Sobre qué te gustaría aprender?"
                phraseToEmphasize="learn"
            />
        );

        expect(screen.getByText('¿Sobre qué te gustaría aprender?')).toBeTruthy();
    });

    // The phrase carries a user-supplied topic title, so metacharacters reach the
    // RegExp constructor. Unescaped, "C++" throws SyntaxError and blanks the render.
    it.each([
        ['Choose a Learning Pathway for C++!', 'Learning Pathway for C++!'],
        ['Choose a Learning Pathway for Math (Algebra!', 'Learning Pathway for Math (Algebra!'],
        ['Choose a Learning Pathway for a[b!', 'Learning Pathway for a[b!'],
    ])('does not throw on a topic title with regex metacharacters: %s', (title, phrase) => {
        expect(() =>
            render(<FormatQuestionTitle title={title} phraseToEmphasize={phrase} />)
        ).not.toThrow();
        expect(screen.getByText(phrase).tagName).toBe('SPAN');
    });
});
