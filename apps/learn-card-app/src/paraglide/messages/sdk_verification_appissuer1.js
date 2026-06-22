/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Appissuer1Inputs */

const en_sdk_verification_appissuer1 = /** @type {(inputs: Sdk_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trusted App`)
};

const es_sdk_verification_appissuer1 = /** @type {(inputs: Sdk_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App de confianza`)
};

const fr_sdk_verification_appissuer1 = /** @type {(inputs: Sdk_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application de confiance`)
};

const ar_sdk_verification_appissuer1 = /** @type {(inputs: Sdk_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيق موثوق`)
};

/**
* | output |
* | --- |
* | "Trusted App" |
*
* @param {Sdk_Verification_Appissuer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_appissuer1 = /** @type {((inputs?: Sdk_Verification_Appissuer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Appissuer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_appissuer1(inputs)
	if (locale === "es") return es_sdk_verification_appissuer1(inputs)
	if (locale === "fr") return fr_sdk_verification_appissuer1(inputs)
	return ar_sdk_verification_appissuer1(inputs)
});
export { sdk_verification_appissuer1 as "sdk.verification.appIssuer" }