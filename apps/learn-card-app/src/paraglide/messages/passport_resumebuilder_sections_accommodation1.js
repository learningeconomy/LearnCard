/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sections_Accommodation1Inputs */

const en_passport_resumebuilder_sections_accommodation1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accommodation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodations`)
};

const es_passport_resumebuilder_sections_accommodation1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accommodation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adaptaciones`)
};

const fr_passport_resumebuilder_sections_accommodation1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accommodation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aménagements`)
};

const ar_passport_resumebuilder_sections_accommodation1 = /** @type {(inputs: Passport_Resumebuilder_Sections_Accommodation1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الترتيبات التيسيرية`)
};

/**
* | output |
* | --- |
* | "Accommodations" |
*
* @param {Passport_Resumebuilder_Sections_Accommodation1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sections_accommodation1 = /** @type {((inputs?: Passport_Resumebuilder_Sections_Accommodation1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sections_Accommodation1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sections_accommodation1(inputs)
	if (locale === "es") return es_passport_resumebuilder_sections_accommodation1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sections_accommodation1(inputs)
	return ar_passport_resumebuilder_sections_accommodation1(inputs)
});
export { passport_resumebuilder_sections_accommodation1 as "passport.resumeBuilder.sections.accommodation" }