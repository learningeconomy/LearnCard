/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_ExpiredInputs */

const en_sdk_verification_message_expired = /** @type {(inputs: Sdk_Verification_Message_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_sdk_verification_message_expired = /** @type {(inputs: Sdk_Verification_Message_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vencido`)
};

const fr_sdk_verification_message_expired = /** @type {(inputs: Sdk_Verification_Message_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_sdk_verification_message_expired = /** @type {(inputs: Sdk_Verification_Message_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهي الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Sdk_Verification_Message_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_expired = /** @type {((inputs?: Sdk_Verification_Message_ExpiredInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_ExpiredInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_expired(inputs)
	if (locale === "es") return es_sdk_verification_message_expired(inputs)
	if (locale === "fr") return fr_sdk_verification_message_expired(inputs)
	return ar_sdk_verification_message_expired(inputs)
});
export { sdk_verification_message_expired as "sdk.verification.message.expired" }