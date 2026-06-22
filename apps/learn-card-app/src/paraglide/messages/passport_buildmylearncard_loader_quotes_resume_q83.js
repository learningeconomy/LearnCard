/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q83 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying your resume for smart records...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q83 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando tu currículum para registros inteligentes...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q83 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de votre CV pour des enregistrements intelligents...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q83 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نتحقق من سيرتك الذاتية لسجلات ذكية...`)
};

/**
* | output |
* | --- |
* | "Verifying your resume for smart records..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q83 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q83Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q83(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q83(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q83(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q83(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q83 as "passport.buildMyLearnCard.loader.quotes.resume.q8" }