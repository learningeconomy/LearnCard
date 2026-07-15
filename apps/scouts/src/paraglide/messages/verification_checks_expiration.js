/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Checks_ExpirationInputs */

const en_verification_checks_expiration = /** @type {(inputs: Verification_Checks_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration`)
};

const es_verification_checks_expiration = /** @type {(inputs: Verification_Checks_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vencimiento`)
};

const fr_verification_checks_expiration = /** @type {(inputs: Verification_Checks_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration`)
};

const ar_verification_checks_expiration = /** @type {(inputs: Verification_Checks_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانتهاء`)
};

/**
* | output |
* | --- |
* | "Expiration" |
*
* @param {Verification_Checks_ExpirationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_checks_expiration = /** @type {((inputs?: Verification_Checks_ExpirationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Checks_ExpirationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_checks_expiration(inputs)
	if (locale === "es") return es_verification_checks_expiration(inputs)
	if (locale === "fr") return fr_verification_checks_expiration(inputs)
	return ar_verification_checks_expiration(inputs)
});
export { verification_checks_expiration as "verification.checks.expiration" }