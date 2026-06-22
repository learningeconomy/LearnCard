/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Status_FailedInputs */

const en_sdk_verification_status_failed = /** @type {(inputs: Sdk_Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed`)
};

const es_sdk_verification_status_failed = /** @type {(inputs: Sdk_Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Falló`)
};

const fr_sdk_verification_status_failed = /** @type {(inputs: Sdk_Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec`)
};

const ar_sdk_verification_status_failed = /** @type {(inputs: Sdk_Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل`)
};

/**
* | output |
* | --- |
* | "Failed" |
*
* @param {Sdk_Verification_Status_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_status_failed = /** @type {((inputs?: Sdk_Verification_Status_FailedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Status_FailedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_status_failed(inputs)
	if (locale === "es") return es_sdk_verification_status_failed(inputs)
	if (locale === "fr") return fr_sdk_verification_status_failed(inputs)
	return ar_sdk_verification_status_failed(inputs)
});
export { sdk_verification_status_failed as "sdk.verification.status.failed" }