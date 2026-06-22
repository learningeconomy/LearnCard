/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Resumebuilder_Subtitle1Inputs */

const en_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build your resume with ${i?.brand} credentials.`)
};

const es_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crea tu currículum con credenciales de ${i?.brand}.`)
};

const fr_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créez votre CV avec les titres de ${i?.brand}.`)
};

const ar_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنشئ سيرتك الذاتية باستخدام شهادات ${i?.brand}.`)
};

/**
* | output |
* | --- |
* | "Build your resume with {brand} credentials." |
*
* @param {Passport_Resumebuilder_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_subtitle1 = /** @type {((inputs: Passport_Resumebuilder_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_subtitle1(inputs)
	if (locale === "es") return es_passport_resumebuilder_subtitle1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_subtitle1(inputs)
	return ar_passport_resumebuilder_subtitle1(inputs)
});
export { passport_resumebuilder_subtitle1 as "passport.resumeBuilder.subtitle" }