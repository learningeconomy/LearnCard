import { createElement, Fragment } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { IonInput, IonList, setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '../../src/tailwind.css';

const mode = new URLSearchParams(location.search).get('mode') === 'ios' ? 'ios' : 'md';
setupIonicReact({ mode, swipeBackEnabled: false });

// Use real hydrated Ionic components and the utilities used by AI Sessions,
// Learner Insights, and app lists. Vite must emit CSS as an external stylesheet:
// its dev-server style tags can accidentally hide the missing-anchor regression.
const root = createRoot(document.getElementById('root')!);
flushSync(() => {
    root.render(
        createElement(
            Fragment,
            null,
            ...[44, 48].map(padding =>
                createElement(IonInput, {
                    key: padding,
                    className: `pl-[${padding}px]! py-[4px]!`,
                    placeholder: 'Search',
                })
            ),
            createElement(IonList, { className: 'bg-grayscale-100 py-4 m-4' })
        )
    );
});
const inputs = Array.from(document.querySelectorAll('ion-input'));
const list = document.querySelector('ion-list')!;

const measure = async (): Promise<void> => {
    await Promise.all(inputs.map(input => input.getInputElement()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const listStyle = getComputedStyle(list);
    const result = {
        mode: inputs[0].classList.contains(mode) ? mode : 'unhydrated',
        inputPadding: inputs.map(input => getComputedStyle(input).paddingLeft),
        listBackground: listStyle.backgroundColor,
        listPadding: listStyle.paddingTop,
        listMargin: listStyle.marginTop,
    };
    const output = document.createElement('pre');
    output.id = 'appearance';
    output.textContent = JSON.stringify(result);
    document.body.appendChild(output);
};

void measure();
