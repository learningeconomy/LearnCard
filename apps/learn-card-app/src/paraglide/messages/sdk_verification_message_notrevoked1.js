/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_Notrevoked1Inputs */

const en_sdk_verification_message_notrevoked1 = /** @type {(inputs: Sdk_Verification_Message_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Revoked`)
};

const es_sdk_verification_message_notrevoked1 = /** @type {(inputs: Sdk_Verification_Message_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No revocado`)
};

const fr_sdk_verification_message_notrevoked1 = /** @type {(inputs: Sdk_Verification_Message_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non révoqué`)
};

const ar_sdk_verification_message_notrevoked1 = /** @type {(inputs: Sdk_Verification_Message_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير ملغى`)
};

/**
* | output |
* | --- |
* | "Not Revoked" |
*
* @param {Sdk_Verification_Message_Notrevoked1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_notrevoked1 = /** @type {((inputs?: Sdk_Verification_Message_Notrevoked1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_Notrevoked1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_notrevoked1(inputs)
	if (locale === "es") return es_sdk_verification_message_notrevoked1(inputs)
	if (locale === "fr") return fr_sdk_verification_message_notrevoked1(inputs)
	return ar_sdk_verification_message_notrevoked1(inputs)
});
export { sdk_verification_message_notrevoked1 as "sdk.verification.message.notRevoked" }