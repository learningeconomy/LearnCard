/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyzing your diploma...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analizando tu diploma...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyse de votre diplôme...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحلل دبلومك...`)
};

/**
* | output |
* | --- |
* | "Analyzing your diploma..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q03 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q03Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q03(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q03(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q03(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q03(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q03 as "passport.buildMyLearnCard.loader.quotes.diploma.q0" }