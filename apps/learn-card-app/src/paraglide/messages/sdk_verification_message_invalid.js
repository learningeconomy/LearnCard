/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_InvalidInputs */

const en_sdk_verification_message_invalid = /** @type {(inputs: Sdk_Verification_Message_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid`)
};

const es_sdk_verification_message_invalid = /** @type {(inputs: Sdk_Verification_Message_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No válido`)
};

const fr_sdk_verification_message_invalid = /** @type {(inputs: Sdk_Verification_Message_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalide`)
};

const ar_sdk_verification_message_invalid = /** @type {(inputs: Sdk_Verification_Message_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid" |
*
* @param {Sdk_Verification_Message_InvalidInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_invalid = /** @type {((inputs?: Sdk_Verification_Message_InvalidInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_InvalidInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_invalid(inputs)
	if (locale === "es") return es_sdk_verification_message_invalid(inputs)
	if (locale === "fr") return fr_sdk_verification_message_invalid(inputs)
	return ar_sdk_verification_message_invalid(inputs)
});
export { sdk_verification_message_invalid as "sdk.verification.message.invalid" }