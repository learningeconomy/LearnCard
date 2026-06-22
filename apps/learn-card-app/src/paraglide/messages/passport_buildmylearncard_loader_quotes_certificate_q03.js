/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reading your certificate details...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leyendo los detalles de tu certificado...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lecture des détails de votre certificat...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q03 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نقرأ تفاصيل شهادتك...`)
};

/**
* | output |
* | --- |
* | "Reading your certificate details..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q03 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q03Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q03(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q03(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q03(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q03(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q03 as "passport.buildMyLearnCard.loader.quotes.certificate.q0" }