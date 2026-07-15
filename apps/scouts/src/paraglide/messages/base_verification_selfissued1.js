/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Base_Verification_Selfissued1Inputs */

const en_base_verification_selfissued1 = /** @type {(inputs: Base_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self Issued`)
};

const es_base_verification_selfissued1 = /** @type {(inputs: Base_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoemitido`)
};

const fr_base_verification_selfissued1 = /** @type {(inputs: Base_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-émis`)
};

const ar_base_verification_selfissued1 = /** @type {(inputs: Base_Verification_Selfissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صادر ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self Issued" |
*
* @param {Base_Verification_Selfissued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const base_verification_selfissued1 = /** @type {((inputs?: Base_Verification_Selfissued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Base_Verification_Selfissued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_base_verification_selfissued1(inputs)
	if (locale === "es") return es_base_verification_selfissued1(inputs)
	if (locale === "fr") return fr_base_verification_selfissued1(inputs)
	return ar_base_verification_selfissued1(inputs)
});
export { base_verification_selfissued1 as "base.verification.selfIssued" }