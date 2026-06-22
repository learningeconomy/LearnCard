/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Generatingpdf2Inputs */

const en_passport_resumebuilder_generatingpdf2 = /** @type {(inputs: Passport_Resumebuilder_Generatingpdf2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating PDF…`)
};

const es_passport_resumebuilder_generatingpdf2 = /** @type {(inputs: Passport_Resumebuilder_Generatingpdf2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando PDF…`)
};

const fr_passport_resumebuilder_generatingpdf2 = /** @type {(inputs: Passport_Resumebuilder_Generatingpdf2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération du PDF…`)
};

const ar_passport_resumebuilder_generatingpdf2 = /** @type {(inputs: Passport_Resumebuilder_Generatingpdf2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء ملف PDF…`)
};

/**
* | output |
* | --- |
* | "Generating PDF…" |
*
* @param {Passport_Resumebuilder_Generatingpdf2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_generatingpdf2 = /** @type {((inputs?: Passport_Resumebuilder_Generatingpdf2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Generatingpdf2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_generatingpdf2(inputs)
	if (locale === "es") return es_passport_resumebuilder_generatingpdf2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_generatingpdf2(inputs)
	return ar_passport_resumebuilder_generatingpdf2(inputs)
});
export { passport_resumebuilder_generatingpdf2 as "passport.resumeBuilder.generatingPdf" }