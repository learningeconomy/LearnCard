/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Status_ErrorInputs */

const en_sdk_verification_status_error = /** @type {(inputs: Sdk_Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error`)
};

const es_sdk_verification_status_error = /** @type {(inputs: Sdk_Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error`)
};

const fr_sdk_verification_status_error = /** @type {(inputs: Sdk_Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur`)
};

const ar_sdk_verification_status_error = /** @type {(inputs: Sdk_Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ`)
};

/**
* | output |
* | --- |
* | "Error" |
*
* @param {Sdk_Verification_Status_ErrorInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_status_error = /** @type {((inputs?: Sdk_Verification_Status_ErrorInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Status_ErrorInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_status_error(inputs)
	if (locale === "es") return es_sdk_verification_status_error(inputs)
	if (locale === "fr") return fr_sdk_verification_status_error(inputs)
	return ar_sdk_verification_status_error(inputs)
});
export { sdk_verification_status_error as "sdk.verification.status.error" }