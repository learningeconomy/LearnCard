/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q15 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extracting credential details...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q15 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrayendo detalles de la credencial...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q15 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraction des détails du credential...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q15 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نستخرج تفاصيل الاعتماد...`)
};

/**
* | output |
* | --- |
* | "Extracting credential details..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q15 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q15(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q15(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q15(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q15(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q15 as "passport.buildMyLearnCard.loader.quotes.rawVC.q1" }