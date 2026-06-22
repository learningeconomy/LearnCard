/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Building your learning and work timeline...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construyendo tu línea de tiempo de aprendizaje y trabajo...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construction de votre chronologie d'apprentissage et de travail...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نبني خطك الزمني للتعلم والعمل...`)
};

/**
* | output |
* | --- |
* | "Building your learning and work timeline..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q63 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q63Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q63(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q63(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q63(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q63(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q63 as "passport.buildMyLearnCard.loader.quotes.resume.q6" }