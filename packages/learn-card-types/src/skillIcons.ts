import { z } from 'zod';

/**
 * Per-request limits for AI skill icon generation (`ai.generateSkillIcons`).
 *
 * Clients split large skill frameworks into batches that fit within these limits, and the
 * server rejects anything larger. The limits exist because:
 * - `ai.generateSkillIcons` is sent as a GET with every name in the URL, and API Gateway
 *   returns HTTP 431 once the request line passes ~10KB (browsers add headers on top).
 * - Generation takes ~80ms per name, and the server enforces a 25s model timeout.
 */
export const SKILL_ICON_MAX_NAMES_PER_REQUEST = 100;
export const SKILL_ICON_MAX_CHARACTERS_PER_REQUEST = 2500;

export const SkillIconNamesValidator = z
    .array(z.string().nonempty())
    .min(1)
    .max(SKILL_ICON_MAX_NAMES_PER_REQUEST, {
        message: `A maximum of ${SKILL_ICON_MAX_NAMES_PER_REQUEST} skill names can be sent per request`,
    })
    .refine(
        names =>
            names.reduce((total, name) => total + name.length, 0) <=
            SKILL_ICON_MAX_CHARACTERS_PER_REQUEST,
        {
            message: `Skill names may total at most ${SKILL_ICON_MAX_CHARACTERS_PER_REQUEST} characters per request`,
        }
    );

export const GenerateSkillIconsInputValidator = z.object({ names: SkillIconNamesValidator });
export type GenerateSkillIconsInput = z.infer<typeof GenerateSkillIconsInputValidator>;
