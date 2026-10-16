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
        IntakeFolderIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
                <g transform="rotate(-9 62 75)"><rect x="23" y="25" width="65" height="101" rx="9" fill="#60A5FA"/>
                <path d="M32 31v86M44 40h30M44 112h25" stroke="#FFFFFF"/><circle cx="57" cy="73" r="22" fill="#FDE047"/>
                <path d="M49 68v1M66 68v1M48 80q9 11 19-1" fill="none"/></g>
                <g transform="rotate(9 134 83)"><path d="M96 49v-9q0-7 7-7h20l10 11h31q9 0 9 9v66q0 8-9 8h-61q-7 0-7-8Z" fill="#FFFFFF"/>
                <path d="M92 59q0-8 8-8h64q9 0 9 8v60q0 8-9 8h-64q-8 0-8-8Z" fill="#FDE047"/>
                <path d="M103 59h49" stroke="#FFFFFF"/><path d="M119 81v2M145 81v2M119 96q13 14 26-1" fill="none"/>
                <circle cx="111" cy="93" r="4" fill="#F9A8D4" stroke="none"/></g>
                <path d="M24 130l-6 10M74 130l8 9M117 129l-6 10M156 131l7 7M20 68l-12-3M180 79l12-8"/>
                <path d="M91 24l3-13M178 44l10-7M13 41l-7-8" stroke="#22D3EE" stroke-width="5"/>
                <path d="M105 17l8-6M181 111l10 5" stroke="#F9A8D4" stroke-width="6"/>
            </g>
        `),
        LearnerPlane: glyph(
            `<path d="M6 23L59 5L39 56L28 36Z" fill="#F9A8D4"/><path d="M28 36L59 5L18 29M28 36L25 51L37 42" fill="#93C5FD"/><path d="M6 50L16 40M5 59L17 55M46 59L51 63" stroke="#22D3EE"/>`
        ),
        LearnerWelcomeIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M27 109q-12-16 0-34M165 110q15-11 10-29" fill="none"/>
                <g transform="rotate(11 146 92)">
                    <rect x="119" y="58" width="52" height="72" rx="8" fill="#F9A8D4"/>
                    <path d="M130 70h28M130 78h18" stroke="#FFFFFF"/>
                    <path d="M134 87h22v8q0 15-11 15t-11-15Z" fill="#FDE047"/>
                    <path d="M134 91h-6v7q0 7 10 7M156 91h6v7q0 7-10 7M145 111v7M138 119h14"/>
                </g>
                <g transform="rotate(-8 80 80)">
                    <rect x="35" y="24" width="89" height="107" rx="12" fill="#C4B5FD"/>
                    <rect x="41" y="29" width="89" height="107" rx="12" fill="#60A5FA"/>
                    <path d="M51 35v93M65 44h45M65 119h39M65 126h22" stroke="#FFFFFF"/>
                    <circle cx="87" cy="80" r="26" fill="#FDE047"/>
                    <path d="M77 74v2M97 73l-4 3 5 2M77 87q10 12 21-1" fill="none"/>
                    <path d="M69 67q4-7 10-9" stroke="#FFFFFF"/>
                    <ellipse cx="72" cy="83" rx="4" ry="2.5" fill="#F9A8D4" stroke="none"/>
                </g>
                <path d="M116 31q15-13 25-5" stroke-dasharray="2 7" fill="none"/>
                <path d="M138 19l47-11-19 31-8-15Z" fill="#22D3EE"/><path d="M158 24l27-16"/>
                <path d="M23 39l-9-8M17 55H5M146 131l9 9M170 128l11 5" stroke="#FACC15" stroke-width="5"/>
                <path d="M25 125q-9-12-14-5t14 20q23-11 17-19t-17 4" fill="#F9A8D4" stroke="none"/>
            </g>
        `),
        LearnerAddIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
                <g transform="rotate(-7 87 84)">
                    <rect x="31" y="31" width="104" height="100" rx="13" fill="#93C5FD"/>
                    <rect x="45" y="44" width="76" height="74" rx="8" fill="#FFFFFF"/>
                    <path d="M55 55h14v14H55ZM96 55h14v14H96ZM55 93h14v14H55Z" fill="#22D3EE"/>
                    <path d="M96 93h7v7h7v7M82 54v9M82 72v8h-8M52 80h8"/>
                    <path d="M76 91q6 8 12 0"/>
                </g>
                <path d="M118 28q10-12 20-6M146 60q-5 15-1 23" stroke-dasharray="2 7" fill="none"/>
                <path d="M131 16l53-7-26 31-5-15Z" fill="#F9A8D4"/><path d="M153 25l31-16"/>
                <circle cx="155" cy="110" r="23" fill="#FDE047"/>
                <path d="M147 106v1M163 106v1M147 117q8 7 16-1"/>
                <path d="M18 45l-9-8M17 64H5M163 64l7-6M176 78l10-2" stroke="#FACC15" stroke-width="5"/>
            </g>
        `),
        SignupCalendarIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="144" cy="91" r="40" fill="#93C5FD"/>
                <path d="M125 57l17 7 6 16 21-4 9 15-14 10-2 19-17 9-10-19-19-8-7-17Z" fill="#34D399" stroke="none"/>
                <path d="M128 88q4-8 8 0M153 88q4-8 8 0M134 103q10 11 18 0" fill="none"/>
                <g transform="rotate(-7 72 85)">
                    <rect x="24" y="45" width="83" height="84" rx="12" fill="#FFFFFF"/>
                    <path d="M25 67h81V57q0-12-12-12H37q-12 0-12 12Z" fill="#93C5FD"/>
                    <path d="M43 37v17M83 37v17"/>
                    <path d="M44 86v2M83 86v2M55 96q11 12 21 0" fill="none"/>
                    <circle cx="41" cy="96" r="4" fill="#F9A8D4" stroke="none"/><circle cx="87" cy="96" r="4" fill="#F9A8D4" stroke="none"/>
                    <path d="M44 114h13M72 114h13" stroke="#93C5FD" stroke-width="6"/>
                </g>
                <path d="M36 39L50 9 71 38Z" fill="#FDE047"/><path d="M44 22l15 9" stroke="#93C5FD"/>
                <path d="M113 26q-10-15-16-5t16 19q23-13 17-20t-17 6" fill="#F9A8D4" stroke="none"/>
                <path d="M12 42l-7-7M84 19l5-9M179 41l9-8" stroke="#FDE047" stroke-width="5"/>
            </g>
        `),
        SignupPrivacyIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M35 34q29-3 47-18 18 15 47 18v41q0 42-47 64-47-22-47-64Z" fill="#93C5FD"/>
                <path d="M46 44q21-2 36-13" stroke="#FFFFFF"/>
                <path d="M58 68q4-9 9 0M92 68q4-9 9 0M69 85q13 14 25 0" fill="none"/>
                <path d="M147 80q-14-25-30-11t30 50q48-33 33-50t-33 11Z" fill="#F9A8D4"/>
                <path d="M134 87v2M158 87v2M140 99q8 8 14 0" fill="none"/>
                <path d="M16 46l-9-7M18 68H6M153 31l3-12M166 42l14-6" stroke="#FDE047" stroke-width="5"/>
            </g>
        `),
        AccessPassportIllustration: wrap(`
            <g fill="none" stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <g transform="rotate(-8 100 76)">
                    <path d="M58 23L132 17Q143 16 145 27L147 123L63 128Q52 128 52 117V34Q52 25 58 23Z" fill="#C4B5FD"/>
                    <rect x="57" y="28" width="91" height="102" rx="10" fill="#60A5FA"/>
                    <path d="M67 34V122"/><path d="M81 43H128" stroke="#FFFFFF"/>
                    <circle cx="105" cy="78" r="25" fill="#FDE047"/>
                    <path d="M94 72V75M115 71L111 75L116 77M95 86Q105 98 116 86"/>
                    <path d="M83 113H117M83 120H106" stroke="#FFFFFF"/>
                    <path d="M137 91L140 99L149 101L142 107L143 116L136 112L128 116L129 107L123 101L132 99Z" fill="#F9A8D4"/>
                </g>
                <path d="M34 53L24 47M30 75H17M36 96L24 102M165 45L176 35M168 64L185 63" stroke="#FDE047" stroke-width="5"/>
            </g>
        `),
        AccessEmailIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M140 42Q143 14 170 29" fill="none" stroke-dasharray="3 7"/>
                <path d="M155 19L190 8L177 36L169 24Z" fill="#22D3EE"/><path d="M169 24L190 8" fill="none"/>
                <g transform="rotate(5 96 87)">
                    <path d="M34 70L96 26L158 70V127H34Z" fill="#F9A8D4"/>
                    <rect x="57" y="38" width="82" height="73" rx="9" fill="#93C5FD"/>
                    <path d="M70 59V66M81 59V66M92 59V66M103 59V66M114 59V66M125 59V66" stroke="#18224E" stroke-width="4"/>
                    <path d="M34 70L96 105L158 70V127H34Z" fill="#F9A8D4"/>
                    <path d="M34 127L80 96M158 127L113 96" fill="none"/>
                </g>
                <path d="M37 34L28 23M27 49L13 46" stroke="#F472B6" stroke-width="5"/>
                <path d="M160 116L166 106L172 116L166 122Z" fill="#FDE047"/>
            </g>
        `),
        AccessRecoveryIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M115 97L69 124L57 112L47 119L37 109L25 115L15 98L91 54" fill="#FDE047"/>
                <circle cx="127" cy="57" r="39" fill="#FDE047"/>
                <path d="M112 50Q116 40 120 50M134 50Q138 40 142 50M117 65Q127 77 138 65" fill="none"/>
                <circle cx="109" cy="61" r="4" fill="#F9A8D4" stroke="none"/><circle cx="145" cy="61" r="4" fill="#F9A8D4" stroke="none"/>
                <path d="M29 92L68 70" stroke="#FFFFFF"/>
                <path d="M72 28L67 16M57 44L44 39M57 62H41" stroke="#FDE047" stroke-width="5"/>
                <path d="M160 106L172 115M169 89L184 92" stroke="#22D3EE" stroke-width="5"/>
                <path d="M175 40Q164 22 174 23Q180 25 180 32Q190 21 193 31Q193 40 176 49Z" fill="#F9A8D4" stroke="none"/>
            </g>
        `),
        BuilderPlane: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 65Q24 43 43 59Q60 75 70 44" stroke-dasharray="3 8"/><path d="M42 28L105 7L80 53L69 34L42 28Z" fill="#22D3EE"/><path d="M69 34L105 7L60 27M69 34L65 49L80 41" fill="#93C5FD"/><path d="M93 62L99 70M106 49L116 52M37 14L30 8" stroke="#F9A8D4"/></svg>`,
        BuilderPinkRays: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#EC4899" stroke-width="4" stroke-linecap="round"><path d="M10 17L17 5M20 24L34 20M8 29L17 34"/></svg>`,
        BuilderYellowRays: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#FACC15" stroke-width="4" stroke-linecap="round"><path d="M6 7L16 17M4 24L15 25M10 38L19 31"/></svg>`,
        BuilderHeart: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15Q4 1 14 7Q20 11 18 20Q30 1 34 11Q40 20 12 34Q15 26 10 15Z"/></svg>`,
        BuilderCardMarks: `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150" fill="none" stroke="#18224E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M26 21L23 11M45 14L48 5M211 13L219 6M228 28L239 24M12 78L20 82M238 88L248 83"/><path d="M22 96L25 108L37 107L28 115L32 127L22 120L13 127L15 115L7 109L18 108Z" fill="#93C5FD"/><path d="M226 111Q218 99 226 101Q232 104 229 110Q243 97 243 109Q243 118 227 130Z" fill="#FDE047"/></svg>`,
        ClaimScanIllustration: glyph(
            `<rect x="7" y="7" width="50" height="50" rx="10" fill="#FFFFFF"/><path d="M15 15H25V25H15ZM39 15H49V25H39ZM15 39H25V49H15Z" fill="#93C5FD"/><path d="M39 39H44V44H49V49M31 14V20M31 26V31H23M49 31H44M14 31H18"/><path d="M27 37Q32 43 37 37"/><path d="M27 31V32M37 31V32"/><path d="M2 9V2H9M55 2H62V9M2 55V62H9M55 62H62V55" stroke="#22D3EE"/>`
        ),
        ClaimSuccessIllustration: glyph(
            `<path d="M5 17Q19 12 32 19Q45 12 59 17V55Q45 50 32 57Q19 50 5 55Z" fill="#93C5FD"/><path d="M32 19V57"/><path d="M12 25H24M12 32H21M12 39H24"/><path d="M37 11L57 16L51 43L33 38Z" fill="#F9A8D4"/><path d="M41 20L51 22L50 28Q46 34 42 28Z" fill="#FDE047"/><path d="M45 32L44 36M40 36L47 38"/><path d="M6 5L9 9M22 2V7M58 5L55 9" stroke="#22D3EE"/>`
        ),
        CategoryQualification: glyph(
            `<path d="M12 6H49Q54 6 54 11V43H12Q6 43 6 38V12Q6 6 12 6Z" fill="#FFFFFF"/><path d="M12 6V35Q6 35 6 40M19 17H42M19 25H37"/><path d="M32 43L28 59L39 53L49 59L46 42" fill="#93C5FD"/><path d="M39 29L44 33L50 34L51 40L55 45L50 50L49 55L43 56L39 60L34 56L28 55L27 50L23 45L27 40L28 34L34 33Z" fill="#FDBA74"/><path d="M33 44L37 48L46 39"/>`
        ),
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
            <path d="M36 75L98 34L166 75V127H36Z" fill="#F9A8D4" stroke="#18224E" stroke-width="4" stroke-linejoin="round"/>
            <g transform="rotate(4 101 67)"><rect x="64" y="28" width="74" height="74" rx="10" fill="#FDE047" stroke="#18224E" stroke-width="4"/><path d="M78 45H122M83 61q4-7 8 0M108 61q4-7 8 0M88 73q12 10 22 0" stroke="#18224E" stroke-width="4" stroke-linecap="round"/><path d="M72 37V81" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g>
            <path d="M36 75L99 109L166 75V127H36Z" fill="#F9A8D4" stroke="#18224E" stroke-width="4" stroke-linejoin="round"/>
            <path d="M36 127L83 95M166 127L118 96" stroke="#18224E" stroke-width="4" stroke-linecap="round"/>
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
        CollectionEmptyIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <g transform="rotate(-8 103 81)">
                    <rect x="68" y="12" width="72" height="91" rx="9" fill="${paper}"/>
                    <path d="M80 30h44M80 41h31" stroke="${dark ? '#8B91A7' : '#C5C8D3'}" stroke-width="5"/>
                    <path d="M55 47h88q9 0 9 9v72q0 9-9 9H62q-12 0-12-12V59q0-12 5-12Z" fill="#93C5FD"/>
                    <path d="M62 57v67M76 67h58" stroke="#FFFFFF"/>
                    <circle cx="106" cy="101" r="24" fill="#22D3EE"/>
                    <ellipse cx="106" cy="101" rx="10" ry="24"/>
                    <path d="M82 101h48M86 88q20 9 40 0M86 114q20-9 40 0" fill="none"/>
                </g>
                <path d="M31 51l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#F9A8D4"/>
                <path d="M171 95l4 8 9 1-6 6 1 9-8-4-8 4 2-9-7-6 10-1Z" fill="#FDE047"/>
                <path d="M24 100l-9 8M37 113l-5 12M167 42l10-10M175 56l14-4" stroke="#22D3EE" stroke-width="5"/>
            </g>
        `),
        CollectionCategoryEmptyIllustration: wrap(`
            <g stroke="#18224E" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M39 43l17-8 50 9 45-8 14 17v64l-56 11-70-13Z" fill="${paper}"/>
                <path d="M30 51q42-9 77 11 34-18 64-11v69q-34-7-64 11-35-19-77-11Z" fill="#FDE047"/>
                <path d="M107 62v69M44 62q28-2 49 9" fill="none"/>
                <path d="M125 51l17-5v36l-8-6-9 11Z" fill="#F9A8D4"/>
                <path d="M21 36l-9-10M17 56L5 52M171 29l9-11M181 45l13-5" stroke="#22D3EE" stroke-width="5"/>
            </g>
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
