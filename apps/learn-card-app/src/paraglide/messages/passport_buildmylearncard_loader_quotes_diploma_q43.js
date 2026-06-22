/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recording your academic milestone...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registrando tu hito académico...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement de votre étape académique...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسجّل محطتك الأكاديمية...`)
};

/**
* | output |
* | --- |
* | "Recording your academic milestone..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q43 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q43(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q43(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q43(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q43(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q43 as "passport.buildMyLearnCard.loader.quotes.diploma.q4" }