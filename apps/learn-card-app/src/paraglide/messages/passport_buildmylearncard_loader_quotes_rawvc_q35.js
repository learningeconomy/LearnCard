/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q35 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Converting JSON into a verifiable credential...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q35 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Convirtiendo JSON en una credencial verificable...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q35 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conversion du JSON en un credential vérifiable...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q35 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحوّل الـ JSON إلى اعتماد قابل للتحقق...`)
};

/**
* | output |
* | --- |
* | "Converting JSON into a verifiable credential..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q35 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q35(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q35(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q35(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q35(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q35 as "passport.buildMyLearnCard.loader.quotes.rawVC.q3" }