/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capturing verified skills from your certificate...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capturando habilidades verificadas de tu certificado...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capture des compétences vérifiées de votre certificat...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q93 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نجمع المهارات الموثقة من شهادتك...`)
};

/**
* | output |
* | --- |
* | "Capturing verified skills from your certificate..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q93 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q93Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q93(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q93(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q93(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q93(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q93 as "passport.buildMyLearnCard.loader.quotes.certificate.q9" }