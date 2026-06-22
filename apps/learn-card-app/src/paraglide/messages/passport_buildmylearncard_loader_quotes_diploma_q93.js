/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Building a portable credential from your diploma...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando una credencial portátil a partir de tu diploma...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création d'un credential portable à partir de votre diplôme...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نبني اعتماداً محمولاً من دبلومك...`)
};

/**
* | output |
* | --- |
* | "Building a portable credential from your diploma..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q93 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q93Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q93(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q93(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q93(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q93(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q93 as "passport.buildMyLearnCard.loader.quotes.diploma.q9" }