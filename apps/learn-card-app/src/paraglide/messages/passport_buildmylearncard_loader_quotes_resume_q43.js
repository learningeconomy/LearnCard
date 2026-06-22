/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turning experience into verifiable skills...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Convirtiendo tu experiencia en habilidades verificables...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transformation de votre expérience en compétences vérifiables...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q43 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحوّل خبرتك إلى مهارات قابلة للتحقق...`)
};

/**
* | output |
* | --- |
* | "Turning experience into verifiable skills..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q43 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q43(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q43(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q43(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q43(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q43 as "passport.buildMyLearnCard.loader.quotes.resume.q4" }