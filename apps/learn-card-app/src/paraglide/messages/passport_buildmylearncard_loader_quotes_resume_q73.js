/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parsing education and work history...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analizando tu historial de educación y trabajo...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyse de votre historique d'études et de travail...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحلل سجل تعليمك وعملك...`)
};

/**
* | output |
* | --- |
* | "Parsing education and work history..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q73 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q73Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q73(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q73(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q73(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q73(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q73 as "passport.buildMyLearnCard.loader.quotes.resume.q7" }