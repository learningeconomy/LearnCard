/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Base_Verification_Appissuer1Inputs */

const en_base_verification_appissuer1 = /** @type {(inputs: Base_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Issuer`)
};

const es_base_verification_appissuer1 = /** @type {(inputs: Base_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor de la app`)
};

const fr_base_verification_appissuer1 = /** @type {(inputs: Base_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur de l'application`)
};

const ar_base_verification_appissuer1 = /** @type {(inputs: Base_Verification_Appissuer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهة إصدار التطبيق`)
};

/**
* | output |
* | --- |
* | "App Issuer" |
*
* @param {Base_Verification_Appissuer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const base_verification_appissuer1 = /** @type {((inputs?: Base_Verification_Appissuer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Base_Verification_Appissuer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_base_verification_appissuer1(inputs)
	if (locale === "es") return es_base_verification_appissuer1(inputs)
	if (locale === "fr") return fr_base_verification_appissuer1(inputs)
	return ar_base_verification_appissuer1(inputs)
});
export { base_verification_appissuer1 as "base.verification.appIssuer" }