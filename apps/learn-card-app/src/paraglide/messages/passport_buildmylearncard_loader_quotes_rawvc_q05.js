/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q05 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parsing your raw JSON credential...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q05 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analizando tu credencial JSON sin procesar...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q05 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyse de votre credential JSON brut...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q05 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحلل شهادة الـ JSON الخام...`)
};

/**
* | output |
* | --- |
* | "Parsing your raw JSON credential..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q05 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q05Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q05(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q05(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q05(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q05(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q05 as "passport.buildMyLearnCard.loader.quotes.rawVC.q0" }