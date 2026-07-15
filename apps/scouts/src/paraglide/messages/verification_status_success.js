/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Status_SuccessInputs */

const en_verification_status_success = /** @type {(inputs: Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Success`)
};

const es_verification_status_success = /** @type {(inputs: Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correcto`)
};

const fr_verification_status_success = /** @type {(inputs: Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réussi`)
};

const ar_verification_status_success = /** @type {(inputs: Verification_Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ناجح`)
};

/**
* | output |
* | --- |
* | "Success" |
*
* @param {Verification_Status_SuccessInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_status_success = /** @type {((inputs?: Verification_Status_SuccessInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Status_SuccessInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_status_success(inputs)
	if (locale === "es") return es_verification_status_success(inputs)
	if (locale === "fr") return fr_verification_status_success(inputs)
	return ar_verification_status_success(inputs)
});
export { verification_status_success as "verification.status.success" }