import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { compile } from 'sass';

const scannerStyles = compile(resolve(__dirname, '../../src/assets/sass/qr-code-scanner.scss')).css;

test('only scanner controls remain visible, focusable, and accessible during a scan', async ({
    page,
}) => {
    await page.setContent(`
        <style>
            .explicitly-visible { visibility: visible; }
            .qr-code-scanner-overlay { position: fixed; inset: 0; }
        </style>
        <div id="root">
            <ion-app>
                <div id="app-router"><button id="route">Background route</button></div>
                <button id="widget" class="explicitly-visible">Background widget</button>
                <div class="qr-code-scanner-overlay">
                    <h1>Scan QR Code</h1>
                    <button id="close">Close scanner</button>
                </div>
            </ion-app>
        </div>
        <div id="modal-mid-root">
            <button id="modal" class="explicitly-visible">Background modal</button>
        </div>
    `);
    await page.addStyleTag({ content: scannerStyles });
    await page.evaluate(() => document.body.classList.add('scanner-active'));

    // Include late portals and descendants that explicitly override visibility.
    await page.evaluate(() => {
        const button = document.createElement('button');
        button.id = 'late';
        button.className = 'explicitly-visible';
        button.textContent = 'Late background portal';
        document.body.append(button);
    });

    const close = page.getByRole('button', { name: 'Close scanner' });
    await close.focus();
    for (const id of ['route', 'widget', 'modal', 'late']) {
        await expect(page.locator(`#${id}`)).toBeHidden();
        await page.locator(`#${id}`).evaluate((element: HTMLElement) => element.focus());
        await expect(close).toBeFocused();
    }

    for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(key);
        expect(await page.evaluate(() => document.activeElement?.id ?? '')).not.toMatch(
            /^(route|widget|modal|late)$/
        );
    }

    // Inspect Chromium's actual accessibility tree: a snapshot rooted at the
    // hidden body can omit its explicitly visible scanner descendants.
    const accessibility = await page.context().newCDPSession(page);
    const { nodes } = await accessibility.send('Accessibility.getFullAXTree');
    const snapshot = nodes
        .filter(node => !node.ignored)
        .map(node => node.name?.value)
        .join('\n');
    expect(snapshot).toContain('Close scanner');
    expect(snapshot).toContain('Scan QR Code');
    expect(snapshot).not.toContain('Background');
    expect(snapshot).not.toContain('Late background portal');

    await page.evaluate(() => document.body.classList.remove('scanner-active'));
    await page.locator('#widget').focus();
    await expect(page.locator('#widget')).toBeFocused();
    const restored = await accessibility.send('Accessibility.getFullAXTree');
    expect(
        restored.nodes.some(node => !node.ignored && node.name?.value === 'Background widget')
    ).toBe(true);
});
