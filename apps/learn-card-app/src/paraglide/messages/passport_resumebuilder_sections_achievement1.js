/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sections_Achievement1Inputs */

const en_passport_resumebuilder_sections_achievement1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_passport_resumebuilder_sections_achievement1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_passport_resumebuilder_sections_achievement1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_passport_resumebuilder_sections_achievement1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Achievement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Passport_Resumebuilder_Sections_Achievement1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sections_achievement1 = /** @type {((inputs?: Passport_Resumebuilder_Sections_Achievement1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sections_Achievement1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sections_achievement1(inputs)
	if (locale === "es") return es_passport_resumebuilder_sections_achievement1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sections_achievement1(inputs)
	return ar_passport_resumebuilder_sections_achievement1(inputs)
});
export { passport_resumebuilder_sections_achievement1 as "passport.resumeBuilder.sections.achievement" }