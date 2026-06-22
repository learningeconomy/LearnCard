/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Giving your resume the credential treatment...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dándole a tu currículum el tratamiento de credenciales...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application du traitement credential à votre CV...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نمنح سيرتك الذاتية معاملة الشهادات...`)
};

/**
* | output |
* | --- |
* | "Giving your resume the credential treatment..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q53 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q53Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q53(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q53(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q53(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q53(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q53 as "passport.buildMyLearnCard.loader.quotes.resume.q5" }