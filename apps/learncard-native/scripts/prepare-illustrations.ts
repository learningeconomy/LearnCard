import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Editable SVG artwork drawn from the approved concept. Xcode preserves vector data.
const assets = resolve(import.meta.dir, '../ios/Sources/Assets.xcassets');
const drawings = (dark: boolean): Record<string, string> => {
    const ink = dark ? '#EFF0F5' : '#18224E';
    const paper = dark ? '#202732' : '#FFFFFF';
    const wrap = (content: string): string =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150" fill="none">${content}</svg>`;
    return {
        LearnCardPaintedMark: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
            <defs>
                <linearGradient id="mint" x2="1" y2="1"><stop stop-color="#78F5DD"/><stop offset="1" stop-color="#36DCC5"/></linearGradient>
                <linearGradient id="green" x2="1" y2="1"><stop stop-color="#4EDFB3"/><stop offset="1" stop-color="#26C99D"/></linearGradient>
                <linearGradient id="cyan" x2="1" y2="1"><stop stop-color="#5CDBF3"/><stop offset="1" stop-color="#16C7E7"/></linearGradient>
                <linearGradient id="lime" x2="1" y2="1"><stop stop-color="#CDF885"/><stop offset="1" stop-color="#ACED59"/></linearGradient>
                <linearGradient id="blue" x2="1" y2="1"><stop stop-color="#9BCDFC"/><stop offset="1" stop-color="#6AABF3"/></linearGradient>
                <linearGradient id="yellow" x2="1" y2="1"><stop stop-color="#FFEA72"/><stop offset="1" stop-color="#F8D636"/></linearGradient>
                <linearGradient id="pink" x2="1" y2="1"><stop stop-color="#FFB6D9"/><stop offset="1" stop-color="#FA8BC6"/></linearGradient>
                <linearGradient id="violet" x2="1" y2="1"><stop stop-color="#C7A5F8"/><stop offset="1" stop-color="#A479EB"/></linearGradient>
            </defs>
            <path d="M5 3Q11 2 19 3Q22 3 21 7L21 18Q21 22 17 22L5 22Q2 21 3 17L3 7Q2 4 5 3Z" fill="url(#mint)"/>
            <path d="M27 3L39 3Q43 3 42 7L42 18Q43 22 38 22L27 21Q23 22 24 17L24 7Q23 3 27 3Z" fill="url(#green)"/>
            <path d="M48 3L59 3Q63 3 62 8L62 18Q62 22 58 22L47 22Q44 21 44 17L45 7Q44 3 48 3Z" fill="url(#cyan)"/>
            <path d="M6 25L18 24Q22 24 21 29L21 39Q20 43 17 42L5 42Q2 42 3 38L3 29Q2 25 6 25Z" fill="url(#lime)"/>
            <path d="M27 25L39 24Q42 25 42 28L42 39Q42 42 38 42L27 42Q24 42 24 38L24 28Q24 25 27 25Z" fill="#FFFFFF"/>
            <path d="M48 25L59 25Q63 24 62 29L62 39Q62 43 58 42L47 42Q44 42 45 38L44 29Q44 25 48 25Z" fill="url(#blue)"/>
            <path d="M6 45L17 45Q21 44 21 49L21 59Q21 63 17 62L5 62Q2 62 3 58L3 49Q2 45 6 45Z" fill="url(#yellow)"/>
            <path d="M27 45L39 44Q43 45 42 49L42 59Q42 63 38 62L27 62Q24 62 24 58L24 49Q23 45 27 45Z" fill="url(#pink)"/>
            <path d="M48 45L59 45Q62 44 62 49L62 59Q63 63 58 62L47 62Q44 62 44 58L45 49Q44 45 48 45Z" fill="url(#violet)"/>
            <path d="M29 27L33 27L33 36L38 36L38 39L29 39Z" fill="#18224E"/>
        </svg>`,
        ConnectionsIllustration: wrap(`
            <path d="M24 128v-16c0-24 18-38 39-38s39 14 39 38v16" fill="#C4B5FD" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <ellipse cx="63" cy="57" rx="24" ry="29" fill="#5EEAD4" stroke="${ink}" stroke-width="3"/>
            <path d="M109 128v-16c0-23 15-36 34-36s34 13 34 36v16" fill="#93C5FD" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <ellipse cx="143" cy="58" rx="22" ry="27" fill="#F9A8D4" stroke="${ink}" stroke-width="3"/>
            <path d="M53 40c-5 3-8 8-8 14M136 42c-4 3-7 7-7 12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
            <rect x="96" y="17" width="13" height="13" rx="3" transform="rotate(15 102 23)" fill="#FDE047"/>
            <path d="M97 103l7 7 12-15" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        `),
        AccountAvatar: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#FDE047" stroke="${ink}" stroke-width="2"/>
            <path d="M11 18c1-4 4-7 8-8" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/>
            <circle cx="17" cy="21" r="2" fill="#18224E"/>
            <path d="M27 22q3-4 6-1M16 29c4 7 13 7 17-1" stroke="#18224E" stroke-width="2.3" stroke-linecap="round"/>
            <ellipse cx="12" cy="27" rx="3" ry="2" fill="#F9A8D4"/>
            <ellipse cx="36" cy="27" rx="3" ry="2" fill="#F9A8D4"/>
        </svg>`,
        InboxIllustration: wrap(`
            <path d="M38 75l59-44 66 41v53H38V75Z" fill="#93C5FD" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <g transform="rotate(-10 101 71)">
                <rect x="66" y="32" width="72" height="79" rx="10" fill="${paper}" stroke="${ink}" stroke-width="3"/>
                <rect x="78" y="45" width="22" height="25" rx="4" fill="#FDE047"/>
                <path d="M110 49h16M110 57h12M78 82h47M78 91h31" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
            </g>
            <path d="M38 75l61 32 64-35v53H38V75Z" fill="#93C5FD" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M38 125l53-37M163 125l-48-37" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
            <rect x="36" y="36" width="12" height="12" rx="3" transform="rotate(-25 42 42)" fill="#F9A8D4"/>
            <rect x="150" y="26" width="11" height="11" rx="3" transform="rotate(20 155 31)" fill="#F9A8D4"/>
            <path d="M170 51l8-6M27 61l-7-4" stroke="#22D3EE" stroke-width="4" stroke-linecap="round"/>
        `),
        SearchEmptyIllustration: wrap(`
            <g transform="rotate(-10 88 81)">
                <rect x="31" y="41" width="111" height="84" rx="12" fill="${paper}" stroke="${ink}" stroke-width="3"/>
                <rect x="46" y="56" width="26" height="19" rx="4" fill="${dark ? '#52597A' : '#C5C8D3'}"/>
                <path d="M47 91h37M47 103h26" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
            </g>
            <circle cx="131" cy="89" r="32" fill="#22D3EE" fill-opacity="0.85" stroke="${ink}" stroke-width="3"/>
            <path d="M108 87c2-10 8-17 17-19" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
            <path d="M153 113l7-7 24 23c4 4 4 8 1 11s-7 3-11-1l-21-26Z" fill="#F9A8D4" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <rect x="146" y="17" width="18" height="23" rx="4" transform="rotate(24 155 28)" fill="#FDE047"/>
            <rect x="168" y="44" width="16" height="19" rx="3" transform="rotate(-25 176 53)" fill="#F9A8D4"/>
        `),
    };
};
for (const name of Object.keys(drawings(false))) {
    const directory = resolve(assets, `${name}.imageset`);
    await mkdir(directory, { recursive: true });
    const images = [];
    for (const dark of [false, true]) {
        const filename = `${name}${dark ? '-dark' : ''}.svg`;
        await writeFile(resolve(directory, filename), drawings(dark)[name]);
        images.push({
            filename,
            idiom: 'universal',
            ...(dark ? { appearances: [{ appearance: 'luminosity', value: 'dark' }] } : {}),
        });
    }
    await writeFile(
        resolve(directory, 'Contents.json'),
        JSON.stringify(
            {
                images,
                info: { author: 'xcode', version: 1 },
                properties: {
                    'preserves-vector-representation': true,
                    'template-rendering-intent': 'original',
                },
            },
            null,
            4
        ) + '\n'
    );
}
console.log(
    'Prepared editable SVG painted mark, smiley avatar and Inbox/search/connection artwork.'
);
