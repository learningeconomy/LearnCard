/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extracting certified skills and knowledge...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrayendo habilidades y conocimientos certificados...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraction des compétences et connaissances certifiées...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نستخرج المهارات والمعارف المعتمدة...`)
};

/**
* | output |
* | --- |
* | "Extracting certified skills and knowledge..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q13 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q13(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q13(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q13(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q13(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q13 as "passport.buildMyLearnCard.loader.quotes.certificate.q1" }