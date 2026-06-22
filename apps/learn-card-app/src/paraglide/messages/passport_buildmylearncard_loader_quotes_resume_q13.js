/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extracting your work history — one line at a time.`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrayendo tu historial laboral, una línea a la vez.`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraction de votre historique professionnel, une ligne à la fois.`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نستخرج سجل عملك، سطراً بسطر.`)
};

/**
* | output |
* | --- |
* | "Extracting your work history — one line at a time." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q13 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q13(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q13(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q13(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q13(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q13 as "passport.buildMyLearnCard.loader.quotes.resume.q1" }