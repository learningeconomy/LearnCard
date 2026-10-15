import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Editable SVG artwork drawn from the approved concept. Xcode preserves vector data.
const assets = resolve(import.meta.dir, '../ios/Sources/Assets.xcassets');
const drawings = (dark: boolean): Record<string, string> => {
    const ink = dark ? '#EFF0F5' : '#18224E';
    const paper = dark ? '#202732' : '#FFFFFF';
    const wrap = (content: string): string =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150" fill="none">${content}</svg>`;
    // Category drawings sit on opaque Colorful circles in both appearances.
    const glyph = (content: string): string =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#18224E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
    return {
        CategoryBadge: glyph(
            `<path d="M19 37L15 58L30 49L44 58L42 35" fill="#F9A8D4"/><path d="M32 5L39 10L48 11L51 20L57 27L51 35L48 44L39 45L32 51L24 45L15 44L12 35L6 27L12 20L15 11L24 10Z" fill="#FFFFFF"/><path d="M19 26Q24 18 32 26Q40 18 45 26Q46 33 32 41Q18 33 19 26Z" fill="#22D3EE"/>`
        ),
        CategoryAchievement: glyph(
            `<path d="M18 13H7V22Q7 35 24 36M46 13H57V22Q57 35 40 36" fill="#FFFFFF"/><path d="M17 7H47V23Q47 41 32 42Q17 41 17 23Z" fill="#FDE047"/><path d="M29 42V51H35V42M20 58V51H44V58Z" fill="#FDE047"/><path d="M32 14L35 21L42 22L37 28L38 35L32 31L26 35L27 28L22 22L29 21Z" fill="#F9A8D4"/><path d="M23 12V21" stroke="#FFFFFF"/>`
        ),
        CategoryStudies: glyph(
            `<path d="M32 20Q22 10 12 23Q5 37 17 53Q23 61 32 55Q42 61 48 53Q60 36 52 23Q43 12 32 20Z" fill="#FFFFFF"/><path d="M32 19Q29 10 23 7M32 17Q31 4 46 5Q46 17 32 17Z" fill="#34D399"/><path d="M18 28Q13 33 17 42" stroke="#22D3EE"/>`
        ),
        CategoryPortfolio: glyph(
            `<path d="M7 12Q20 9 32 21Q44 9 57 12V47Q43 45 32 57Q21 45 7 47Z" fill="#FFFFFF"/><path d="M32 21Q35 8 48 5V37Q37 39 32 57Z" fill="#34D399"/><path d="M32 21V57M12 18Q22 19 27 26"/>`
        ),
        CategoryAssistance: glyph(
            `<circle cx="32" cy="32" r="26" fill="#FFFFFF"/><path d="M13 14L23 23M41 41L51 50M14 51L23 41M41 23L50 14" stroke="#F9A8D4" stroke-width="15"/><circle cx="32" cy="32" r="12" fill="#C4B5FD"/><circle cx="32" cy="32" r="26"/>`
        ),
        CategoryExperience: glyph(
            `<path d="M5 53L22 24L32 38L43 18L59 53Z" fill="#FFFFFF"/><path d="M16 34L22 24L29 34L23 39Z" fill="#93C5FD"/><path d="M37 29L43 18L50 31L44 36Z" fill="#93C5FD"/><path d="M43 18V5L57 10L43 15" fill="#FDE047"/><path d="M10 53H55"/>`
        ),
        CategoryID: glyph(
            `<rect x="5" y="10" width="54" height="44" rx="8" fill="#FFFFFF"/><circle cx="21" cy="26" r="7" fill="#F9A8D4"/><path d="M11 45V41Q11 32 21 32Q31 32 31 41V45Z" fill="#F9A8D4"/><path d="M39 24H51M39 32H51M39 40H47"/>`
        ),
        CategoryFamily: glyph(
            `<path d="M32 20L13 44H51Z"/><circle cx="32" cy="18" r="13" fill="#FDE047"/><circle cx="14" cy="45" r="13" fill="#93C5FD"/><circle cx="50" cy="45" r="13" fill="#F9A8D4"/><path d="M27 16h1M36 16h1M27 22Q32 27 37 22M9 43h1M18 43h1M9 49Q14 54 19 49M45 43h1M54 43h1M45 49Q50 54 55 49" stroke-width="2.4"/>`
        ),
        CategorySkill: glyph(
            `<path d="M32 6L39 23L57 25L43 37L47 56L32 46L17 56L21 37L7 25L25 23Z" fill="#FDE047"/><path d="M46 9L50 4M55 16L60 14M5 43L1 45" stroke="#FFFFFF"/>`
        ),
        CategoryTopic: glyph(
            `<path d="M25 26H54Q59 26 59 31V49Q59 54 54 54H46L39 60V54H25Q20 54 20 49V31Q20 26 25 26Z" fill="#F9A8D4"/><path d="M9 5H40Q45 5 45 10V31Q45 36 40 36H22L12 44V36H9Q4 36 4 31V10Q4 5 9 5Z" fill="#FFFFFF"/><path d="M13 16H35M13 24H28"/>`
        ),
        CategoryPathway: glyph(
            `<path d="M11 56H37Q49 56 49 45Q49 35 31 35Q13 35 13 24Q13 13 32 13" stroke="#FFFFFF" stroke-width="12"/><path d="M11 56H37Q49 56 49 45Q49 35 31 35Q13 35 13 24Q13 13 32 13" stroke-dasharray="3 6"/><path d="M35 26V4L56 11L35 18" fill="#F9A8D4"/><circle cx="10" cy="56" r="4" fill="#FDE047"/>`
        ),
        CategoryInsight: glyph(
            `<path d="M21 43Q21 36 16 30Q6 9 28 5Q49 2 51 21Q52 31 43 38V43Z" fill="#FDE047"/><path d="M24 44H41V51H24ZM28 52V58H37V52" fill="#FFFFFF"/><path d="M32 41V28M25 22L32 29L39 22"/><path d="M6 9L2 5M55 9L60 4M5 36L1 38M55 35L61 37" stroke="#FFFFFF"/>`
        ),
        AppPlaceholder: glyph(
            `<rect x="6" y="8" width="52" height="48" rx="9" fill="#FFFFFF"/><path d="M7 21H57"/><path d="M14 15H15M22 15H23" stroke="#F9A8D4" stroke-width="4"/><path d="M20 30L29 27L35 35L26 39Z" fill="#FDE047"/><circle cx="42" cy="40" r="8" fill="#34D399"/>`
        ),
        DrawnCollection: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12V9Q5 6 8 6H17L21 11H32Q35 11 35 14V32Q35 35 32 35H8Q5 35 5 32Z" fill="#FDE047"/><path d="M10 17V29" stroke="#FFFFFF"/><path d="M27 6L29 2M34 9L38 7" stroke="#22D3EE"/></svg>`,
        DrawnPencil: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 25L25 6Q29 2 33 6L35 8Q38 11 34 15L15 34L4 37Z" fill="#22D3EE"/><path d="M25 6L34 15M8 25L15 32M7 26L4 37L15 34Z" fill="#FDE047"/><path d="M25 6L28 3Q30 2 33 5L36 8Q38 11 34 15Z" fill="#F9A8D4"/><path d="M12 24L24 12" stroke="#FFFFFF"/></svg>`,
        HomeInboxIllustration: wrap(`
            <path d="M36 75L98 34L166 75V127H36Z" fill="#F9A8D4" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
            <g transform="rotate(4 101 67)"><rect x="64" y="28" width="74" height="74" rx="10" fill="#FDE047" stroke="${ink}" stroke-width="4"/><path d="M78 45H122M78 58H122M78 71H105" stroke="#18224E" stroke-width="4" stroke-linecap="round"/><path d="M72 37V81" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g>
            <path d="M36 75L99 109L166 75V127H36Z" fill="#F9A8D4" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
            <path d="M36 127L83 95M166 127L118 96" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
            <path d="M42 40L32 28M101 15L99 4M161 43L171 29" stroke="#22D3EE" stroke-width="6" stroke-linecap="round"/>
        `),
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
        DrawnFamily: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 26Q16 16 23 26M20 26Q27 16 33 26"/><circle cx="13" cy="12" r="6"/><circle cx="28" cy="12" r="6"/><path d="M8 35V29Q8 23 14 23H16Q22 23 22 29V35ZM23 35V29Q23 23 29 23H30Q36 23 36 29V35Z"/></svg>`,
        DrawnSharing: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20L29 9M12 20L29 32"/><circle cx="9" cy="20" r="5" fill="#F9A8D4"/><circle cx="31" cy="8" r="5" fill="#FDE047"/><circle cx="31" cy="33" r="5" fill="#93C5FD"/></svg>`,
        DrawnSecurity: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4L34 10V22Q32 32 20 38Q8 32 6 22V10Z" fill="#FFFFFF"/><path d="M13 20L18 25L27 15"/></svg>`,
        DrawnLanguage: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="16"/><ellipse cx="20" cy="20" rx="7" ry="16"/><path d="M5 15H35M5 25H35M20 4V36"/></svg>`,
        DrawnBell: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 29L11 23V15Q11 5 20 5Q29 5 29 15L30 23L34 29Z" fill="#FFFFFF"/><path d="M16 34Q20 39 24 34M20 3V5"/></svg>`,
        DrawnHelp: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="16" fill="#FFFFFF"/><path d="M15 15Q15 8 22 11Q29 15 21 20L20 24"/><circle cx="20" cy="30" r="1.4" fill="#18224E" stroke="none"/></svg>`,
        DrawnSignOut: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6H9Q6 6 6 10V31Q6 35 10 35H18M18 20H36M29 13L36 20L29 27"/></svg>`,
        DrawnForget: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10H34M16 10V5H25V10M10 10L12 35H29L31 10M17 16V29M24 16V29"/></svg>`,
        DrawnExternal: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 8H8Q5 8 5 12V32Q5 36 9 36H30Q34 36 34 32V22M23 5H37V19M36 6L18 24"/></svg>`,
        DrawnCredential: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H25L34 13V34Q34 37 31 37H9Q6 37 6 34V7Q6 4 9 4Z" fill="#FFFFFF"/><path d="M25 4V13H34M13 25H27M13 31H23"/><circle cx="15" cy="15" r="3"/></svg>`,
        DrawnAdd: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="16" fill="#FFFFFF"/><path d="M20 11V29M11 20H29"/></svg>`,
        DrawnKey: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#18224E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 24L10 36L4 30L9 25L13 26L14 21L17 19"/><circle cx="26" cy="14" r="11" fill="#FFFFFF"/><circle cx="27" cy="13" r="4"/></svg>`,
        PrivacyIllustration: wrap(`
            <path d="M30 35L87 20V126L30 111Z" fill="#93C5FD" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M87 20H100V126H87" stroke="${ink}" stroke-width="3"/>
            <circle cx="68" cy="80" r="4" fill="${ink}"/>
            <rect x="115" y="81" width="45" height="41" rx="7" fill="#FDE047" stroke="${ink}" stroke-width="3"/>
            <path d="M124 80V68C124 49 151 49 151 68V80M138 97V107" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
            <path d="M126 30L130 21M156 42L166 37M18 64L9 60" stroke="#F9A8D4" stroke-width="6" stroke-linecap="round"/>
        `),
        FamilyConstellation: wrap(`
            <path d="M99 38L48 104H150Z" stroke="#18224E" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="99" cy="39" r="31" fill="#FDE047" stroke="#18224E" stroke-width="3"/>
            <circle cx="48" cy="105" r="30" fill="#93C5FD" stroke="#18224E" stroke-width="3"/>
            <circle cx="150" cy="105" r="30" fill="#F9A8D4" stroke="#18224E" stroke-width="3"/>
            <g fill="#18224E"><circle cx="89" cy="34" r="3"/><circle cx="109" cy="34" r="3"/><circle cx="38" cy="100" r="3"/><circle cx="58" cy="100" r="3"/><circle cx="140" cy="100" r="3"/><circle cx="160" cy="100" r="3"/></g>
            <path d="M89 45Q99 58 110 45M38 111Q48 123 59 111M140 111Q150 123 161 111" stroke="#18224E" stroke-width="3" stroke-linecap="round"/>
            <path d="M81 26L87 21M29 92L35 87M131 92L137 87" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
            <path d="M149 28L155 20M170 48L181 46" stroke="#22D3EE" stroke-width="5" stroke-linecap="round"/>
        `),
        FamilyInviteIllustration: wrap(`
            <circle cx="61" cy="49" r="30" fill="#FDE047" stroke="${ink}" stroke-width="3"/>
            <circle cx="139" cy="49" r="30" fill="#93C5FD" stroke="${ink}" stroke-width="3"/>
            <g fill="#18224E"><circle cx="51" cy="44" r="3"/><circle cx="71" cy="44" r="3"/><circle cx="129" cy="44" r="3"/><circle cx="149" cy="44" r="3"/></g>
            <path d="M51 55Q61 67 72 55M129 55Q139 67 150 55" stroke="#18224E" stroke-width="3" stroke-linecap="round"/>
            <path d="M68 89H132V137H68ZM68 89L100 112L132 89" fill="${paper}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
            <path d="M24 90L15 85M170 91L181 85" stroke="#22D3EE" stroke-width="5" stroke-linecap="round"/>
        `),
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
