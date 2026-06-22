/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Status_ErrorInputs */

const en_verification_status_error = /** @type {(inputs: Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error`)
};

const es_verification_status_error = /** @type {(inputs: Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error`)
};

const fr_verification_status_error = /** @type {(inputs: Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur`)
};

const ar_verification_status_error = /** @type {(inputs: Verification_Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ`)
};

/**
* | output |
* | --- |
* | "Error" |
*
* @param {Verification_Status_ErrorInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_status_error = /** @type {((inputs?: Verification_Status_ErrorInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Status_ErrorInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_status_error(inputs)
	if (locale === "es") return es_verification_status_error(inputs)
	if (locale === "fr") return fr_verification_status_error(inputs)
	return ar_verification_status_error(inputs)
});
export { verification_status_error as "verification.status.error" }