/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Check_ExpirationInputs */

const en_sdk_verification_check_expiration = /** @type {(inputs: Sdk_Verification_Check_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration`)
};

const es_sdk_verification_check_expiration = /** @type {(inputs: Sdk_Verification_Check_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vencimiento`)
};

const fr_sdk_verification_check_expiration = /** @type {(inputs: Sdk_Verification_Check_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration`)
};

const ar_sdk_verification_check_expiration = /** @type {(inputs: Sdk_Verification_Check_ExpirationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهاء الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expiration" |
*
* @param {Sdk_Verification_Check_ExpirationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_check_expiration = /** @type {((inputs?: Sdk_Verification_Check_ExpirationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Check_ExpirationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_check_expiration(inputs)
	if (locale === "es") return es_sdk_verification_check_expiration(inputs)
	if (locale === "fr") return fr_sdk_verification_check_expiration(inputs)
	return ar_sdk_verification_check_expiration(inputs)
});
export { sdk_verification_check_expiration as "sdk.verification.check.expiration" }