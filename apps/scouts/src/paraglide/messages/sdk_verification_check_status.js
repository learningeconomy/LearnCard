/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Check_StatusInputs */

const en_sdk_verification_check_status = /** @type {(inputs: Sdk_Verification_Check_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_sdk_verification_check_status = /** @type {(inputs: Sdk_Verification_Check_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const fr_sdk_verification_check_status = /** @type {(inputs: Sdk_Verification_Check_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ar_sdk_verification_check_status = /** @type {(inputs: Sdk_Verification_Check_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Sdk_Verification_Check_StatusInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_check_status = /** @type {((inputs?: Sdk_Verification_Check_StatusInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Check_StatusInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_check_status(inputs)
	if (locale === "es") return es_sdk_verification_check_status(inputs)
	if (locale === "fr") return fr_sdk_verification_check_status(inputs)
	return ar_sdk_verification_check_status(inputs)
});
export { sdk_verification_check_status as "sdk.verification.check.status" }