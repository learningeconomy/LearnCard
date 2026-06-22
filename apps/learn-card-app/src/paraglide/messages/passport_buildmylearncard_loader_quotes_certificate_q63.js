/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recognizing your certified accomplishments...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reconociendo tus logros certificados...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reconnaissance de vos réalisations certifiées...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نُقدّر إنجازاتك المعتمدة...`)
};

/**
* | output |
* | --- |
* | "Recognizing your certified accomplishments..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q63 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q63Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q63(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q63(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q63(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q63(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q63 as "passport.buildMyLearnCard.loader.quotes.certificate.q6" }