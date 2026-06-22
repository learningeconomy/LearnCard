/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sections_Accomplishment1Inputs */

const en_passport_resumebuilder_sections_accomplishment1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accomplishment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accomplishments`)
};

const es_passport_resumebuilder_sections_accomplishment1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accomplishment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Méritos`)
};

const fr_passport_resumebuilder_sections_accomplishment1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accomplishment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accomplissements`)
};

const ar_passport_resumebuilder_sections_accomplishment1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accomplishment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المنجزات`)
};

/**
* | output |
* | --- |
* | "Accomplishments" |
*
* @param {Passport_Resumebuilder_Sections_Accomplishment1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sections_accomplishment1 = /** @type {((inputs?: Passport_Resumebuilder_Sections_Accomplishment1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sections_Accomplishment1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sections_accomplishment1(inputs)
	if (locale === "es") return es_passport_resumebuilder_sections_accomplishment1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sections_accomplishment1(inputs)
	return ar_passport_resumebuilder_sections_accomplishment1(inputs)
});
export { passport_resumebuilder_sections_accomplishment1 as "passport.resumeBuilder.sections.accomplishment" }