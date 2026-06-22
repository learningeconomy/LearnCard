/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sections_Socialbadge2Inputs */

const en_passport_resumebuilder_sections_socialbadge2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Socialbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges & Certifications`)
};

const es_passport_resumebuilder_sections_socialbadge2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Socialbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias y certificaciones`)
};

const fr_passport_resumebuilder_sections_socialbadge2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Socialbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges et certifications`)
};

const ar_passport_resumebuilder_sections_socialbadge2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Socialbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات والشهادات`)
};

/**
* | output |
* | --- |
* | "Badges & Certifications" |
*
* @param {Passport_Resumebuilder_Sections_Socialbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sections_socialbadge2 = /** @type {((inputs?: Passport_Resumebuilder_Sections_Socialbadge2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sections_Socialbadge2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sections_socialbadge2(inputs)
	if (locale === "es") return es_passport_resumebuilder_sections_socialbadge2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sections_socialbadge2(inputs)
	return ar_passport_resumebuilder_sections_socialbadge2(inputs)
});
export { passport_resumebuilder_sections_socialbadge2 as "passport.resumeBuilder.sections.socialBadge" }