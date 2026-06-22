/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs */

const en_passport_resumebuilder_emptysection_accommodation_action2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Assistance`)
};

const es_passport_resumebuilder_emptysection_accommodation_action2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir adaptación`)
};

const fr_passport_resumebuilder_emptysection_accommodation_action2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un aménagement`)
};

const ar_passport_resumebuilder_emptysection_accommodation_action2 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة ترتيب تيسيري`)
};

/**
* | output |
* | --- |
* | "Add Assistance" |
*
* @param {Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_accommodation_action2 = /** @type {((inputs?: Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Accommodation_Action2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_accommodation_action2(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_accommodation_action2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_accommodation_action2(inputs)
	return ar_passport_resumebuilder_emptysection_accommodation_action2(inputs)
});
export { passport_resumebuilder_emptysection_accommodation_action2 as "passport.resumeBuilder.emptySection.accommodation.action" }