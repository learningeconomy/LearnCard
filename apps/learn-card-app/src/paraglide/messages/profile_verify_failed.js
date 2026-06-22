/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_FailedInputs */

const en_profile_verify_failed = /** @type {(inputs: Profile_Verify_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Failed`)
};

const es_profile_verify_failed = /** @type {(inputs: Profile_Verify_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificación fallida`)
};

const fr_profile_verify_failed = /** @type {(inputs: Profile_Verify_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la vérification`)
};

const ar_profile_verify_failed = /** @type {(inputs: Profile_Verify_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل التحقق`)
};

/**
* | output |
* | --- |
* | "Verification Failed" |
*
* @param {Profile_Verify_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_verify_failed = /** @type {((inputs?: Profile_Verify_FailedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_FailedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_failed(inputs)
	if (locale === "es") return es_profile_verify_failed(inputs)
	if (locale === "fr") return fr_profile_verify_failed(inputs)
	return ar_profile_verify_failed(inputs)
});
export { profile_verify_failed as "profile.verify.failed" }