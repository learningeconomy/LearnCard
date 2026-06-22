/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Selfissued1Inputs */

const en_sdk_verification_selfissued1 = /** @type {(inputs: Sdk_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self Issued`)
};

const es_sdk_verification_selfissued1 = /** @type {(inputs: Sdk_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoemitido`)
};

const fr_sdk_verification_selfissued1 = /** @type {(inputs: Sdk_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-émis`)
};

const ar_sdk_verification_selfissued1 = /** @type {(inputs: Sdk_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صادر ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self Issued" |
*
* @param {Sdk_Verification_Selfissued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_selfissued1 = /** @type {((inputs?: Sdk_Verification_Selfissued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Selfissued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_selfissued1(inputs)
	if (locale === "es") return es_sdk_verification_selfissued1(inputs)
	if (locale === "fr") return fr_sdk_verification_selfissued1(inputs)
	return ar_sdk_verification_selfissued1(inputs)
});
export { sdk_verification_selfissued1 as "sdk.verification.selfIssued" }