/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs */

const en_passport_resumebuilder_emptysection_accommodation_emphasis2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Assistances`)
};

const es_passport_resumebuilder_emptysection_accommodation_emphasis2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade adaptaciones`)
};

const fr_passport_resumebuilder_emptysection_accommodation_emphasis2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des aménagements`)
};

const ar_passport_resumebuilder_emptysection_accommodation_emphasis2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف ترتيبات تيسيرية`)
};

/**
* | output |
* | --- |
* | "Add Assistances" |
*
* @param {Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_accommodation_emphasis2 = /** @type {((inputs?: Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Accommodation_Emphasis2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_accommodation_emphasis2(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_accommodation_emphasis2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_accommodation_emphasis2(inputs)
	return ar_passport_resumebuilder_emptysection_accommodation_emphasis2(inputs)
});
export { passport_resumebuilder_emptysection_accommodation_emphasis2 as "passport.resumeBuilder.emptySection.accommodation.emphasis" }