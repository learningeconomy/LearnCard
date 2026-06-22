/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Untrustedissuer1Inputs */

const en_sdk_verification_untrustedissuer1 = /** @type {(inputs: Sdk_Verification_Untrustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untrusted Issuer`)
};

const es_sdk_verification_untrustedissuer1 = /** @type {(inputs: Sdk_Verification_Untrustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor no confiable`)
};

const fr_sdk_verification_untrustedissuer1 = /** @type {(inputs: Sdk_Verification_Untrustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur non fiable`)
};

const ar_sdk_verification_untrustedissuer1 = /** @type {(inputs: Sdk_Verification_Untrustedissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهة إصدار غير موثوقة`)
};

/**
* | output |
* | --- |
* | "Untrusted Issuer" |
*
* @param {Sdk_Verification_Untrustedissuer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_untrustedissuer1 = /** @type {((inputs?: Sdk_Verification_Untrustedissuer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Untrustedissuer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_untrustedissuer1(inputs)
	if (locale === "es") return es_sdk_verification_untrustedissuer1(inputs)
	if (locale === "fr") return fr_sdk_verification_untrustedissuer1(inputs)
	return ar_sdk_verification_untrustedissuer1(inputs)
});
export { sdk_verification_untrustedissuer1 as "sdk.verification.untrustedIssuer" }