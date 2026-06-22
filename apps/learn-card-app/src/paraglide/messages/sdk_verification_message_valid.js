/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_ValidInputs */

const en_sdk_verification_message_valid = /** @type {(inputs: Sdk_Verification_Message_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid`)
};

const es_sdk_verification_message_valid = /** @type {(inputs: Sdk_Verification_Message_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Válido`)
};

const fr_sdk_verification_message_valid = /** @type {(inputs: Sdk_Verification_Message_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valide`)
};

const ar_sdk_verification_message_valid = /** @type {(inputs: Sdk_Verification_Message_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صالح`)
};

/**
* | output |
* | --- |
* | "Valid" |
*
* @param {Sdk_Verification_Message_ValidInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_valid = /** @type {((inputs?: Sdk_Verification_Message_ValidInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_ValidInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_valid(inputs)
	if (locale === "es") return es_sdk_verification_message_valid(inputs)
	if (locale === "fr") return fr_sdk_verification_message_valid(inputs)
	return ar_sdk_verification_message_valid(inputs)
});
export { sdk_verification_message_valid as "sdk.verification.message.valid" }