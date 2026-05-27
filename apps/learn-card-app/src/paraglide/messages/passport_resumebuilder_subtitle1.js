/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Resumebuilder_Subtitle1Inputs */

const en_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build your resume with ${i?.brand} credentials.`)
};

const es_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Crea tu currículum con las credenciales de ${i?.brand}.`)
};

const de_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erstelle deinen Lebenslauf mit ${i?.brand}-Nachweisen.`)
};

const ar_passport_resumebuilder_subtitle1 = /** @type {(inputs: Passport_Resumebuilder_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنشئ سيرتك الذاتية باستخدام بيانات اعتماد ${i?.brand}.`)
};

/**
* | output |
* | --- |
* | "Build your resume with {brand} credentials." |
*
* @param {Passport_Resumebuilder_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_subtitle1 = /** @type {((inputs: Passport_Resumebuilder_Subtitle1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Subtitle1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_subtitle1(inputs)
	if (locale === "es") return es_passport_resumebuilder_subtitle1(inputs)
	if (locale === "de") return de_passport_resumebuilder_subtitle1(inputs)
	return ar_passport_resumebuilder_subtitle1(inputs)
});
export { passport_resumebuilder_subtitle1 as "passport.resumeBuilder.subtitle" }