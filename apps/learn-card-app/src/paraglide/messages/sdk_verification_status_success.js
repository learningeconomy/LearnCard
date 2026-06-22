/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Status_SuccessInputs */

const en_sdk_verification_status_success = /** @type {(inputs: Sdk_Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Success`)
};

const es_sdk_verification_status_success = /** @type {(inputs: Sdk_Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Éxito`)
};

const fr_sdk_verification_status_success = /** @type {(inputs: Sdk_Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Succès`)
};

const ar_sdk_verification_status_success = /** @type {(inputs: Sdk_Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نجاح`)
};

/**
* | output |
* | --- |
* | "Success" |
*
* @param {Sdk_Verification_Status_SuccessInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_status_success = /** @type {((inputs?: Sdk_Verification_Status_SuccessInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Status_SuccessInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_status_success(inputs)
	if (locale === "es") return es_sdk_verification_status_success(inputs)
	if (locale === "fr") return fr_sdk_verification_status_success(inputs)
	return ar_sdk_verification_status_success(inputs)
});
export { sdk_verification_status_success as "sdk.verification.status.success" }