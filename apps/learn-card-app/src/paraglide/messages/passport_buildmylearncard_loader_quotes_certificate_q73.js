/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs */

const en_passport_buildmylearncard_loader_quotes_certificate_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking for expiration or renewal status...`)
};

const es_passport_buildmylearncard_loader_quotes_certificate_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comprobando el estado de vencimiento o renovación...`)
};

const fr_passport_buildmylearncard_loader_quotes_certificate_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification du statut d'expiration ou de renouvellement...`)
};

const ar_passport_buildmylearncard_loader_quotes_certificate_q73 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نتحقق من حالة الانتهاء أو التجديد...`)
};

/**
* | output |
* | --- |
* | "Checking for expiration or renewal status..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_certificate_q73 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Certificate_Q73Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_certificate_q73(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_certificate_q73(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_certificate_q73(inputs)
	return ar_passport_buildmylearncard_loader_quotes_certificate_q73(inputs)
});
export { passport_buildmylearncard_loader_quotes_certificate_q73 as "passport.buildMyLearnCard.loader.quotes.certificate.q7" }