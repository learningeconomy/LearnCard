/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs */

const en_passport_resumebuilder_emptysection_descriptionsuffix3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`to your ${i?.brand} passport to automatically populate this section.`)
};

const es_passport_resumebuilder_emptysection_descriptionsuffix3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`a tu pasaporte de ${i?.brand} para completar automáticamente esta sección.`)
};

const fr_passport_resumebuilder_emptysection_descriptionsuffix3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`à votre passeport ${i?.brand} pour remplir automatiquement cette section.`)
};

const ar_passport_resumebuilder_emptysection_descriptionsuffix3 = /** @type {(inputs: Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إلى جواز ${i?.brand} لتعبئة هذا القسم تلقائيًا.`)
};

/**
* | output |
* | --- |
* | "to your {brand} passport to automatically populate this section." |
*
* @param {Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptysection_descriptionsuffix3 = /** @type {((inputs: Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptysection_Descriptionsuffix3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptysection_descriptionsuffix3(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptysection_descriptionsuffix3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptysection_descriptionsuffix3(inputs)
	return ar_passport_resumebuilder_emptysection_descriptionsuffix3(inputs)
});
export { passport_resumebuilder_emptysection_descriptionsuffix3 as "passport.resumeBuilder.emptySection.descriptionSuffix" }