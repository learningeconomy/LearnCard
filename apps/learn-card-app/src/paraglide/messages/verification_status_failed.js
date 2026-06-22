/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Status_FailedInputs */

const en_verification_status_failed = /** @type {(inputs: Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed`)
};

const es_verification_status_failed = /** @type {(inputs: Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fallido`)
};

const fr_verification_status_failed = /** @type {(inputs: Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec`)
};

const ar_verification_status_failed = /** @type {(inputs: Verification_Status_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فاشل`)
};

/**
* | output |
* | --- |
* | "Failed" |
*
* @param {Verification_Status_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_status_failed = /** @type {((inputs?: Verification_Status_FailedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Status_FailedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_status_failed(inputs)
	if (locale === "es") return es_verification_status_failed(inputs)
	if (locale === "fr") return fr_verification_status_failed(inputs)
	return ar_verification_status_failed(inputs)
});
export { verification_status_failed as "verification.status.failed" }