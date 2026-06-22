/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Trustedissuer1Inputs */

const en_sdk_verification_trustedissuer1 = /** @type {(inputs: Sdk_Verification_Trustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trusted Issuer`)
};

const es_sdk_verification_trustedissuer1 = /** @type {(inputs: Sdk_Verification_Trustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor de confianza`)
};

const fr_sdk_verification_trustedissuer1 = /** @type {(inputs: Sdk_Verification_Trustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur de confiance`)
};

const ar_sdk_verification_trustedissuer1 = /** @type {(inputs: Sdk_Verification_Trustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهة إصدار موثوقة`)
};

/**
* | output |
* | --- |
* | "Trusted Issuer" |
*
* @param {Sdk_Verification_Trustedissuer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_trustedissuer1 = /** @type {((inputs?: Sdk_Verification_Trustedissuer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Trustedissuer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_trustedissuer1(inputs)
	if (locale === "es") return es_sdk_verification_trustedissuer1(inputs)
	if (locale === "fr") return fr_sdk_verification_trustedissuer1(inputs)
	return ar_sdk_verification_trustedissuer1(inputs)
});
export { sdk_verification_trustedissuer1 as "sdk.verification.trustedIssuer" }