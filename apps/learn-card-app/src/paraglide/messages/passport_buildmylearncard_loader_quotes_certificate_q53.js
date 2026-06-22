/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating a smart badge for your expertise...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando una insignia inteligente para tu experiencia...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération d'un badge intelligent pour votre expertise...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ننشئ شارة ذكية لخبرتك...`)
};

/**
* | output |
* | --- |
* | "Generating a smart badge for your expertise..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q53 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q53Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q53(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q53(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q53(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q53(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q53 as "passport.buildMyLearnCard.loader.quotes.certificate.q5" }