/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_RevokedInputs */

const en_sdk_verification_message_revoked = /** @type {(inputs: Sdk_Verification_Message_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoked`)
};

const es_sdk_verification_message_revoked = /** @type {(inputs: Sdk_Verification_Message_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocado`)
};

const fr_sdk_verification_message_revoked = /** @type {(inputs: Sdk_Verification_Message_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoqué`)
};

const ar_sdk_verification_message_revoked = /** @type {(inputs: Sdk_Verification_Message_RevokedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملغى`)
};

/**
* | output |
* | --- |
* | "Revoked" |
*
* @param {Sdk_Verification_Message_RevokedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_revoked = /** @type {((inputs?: Sdk_Verification_Message_RevokedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_RevokedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_revoked(inputs)
	if (locale === "es") return es_sdk_verification_message_revoked(inputs)
	if (locale === "fr") return fr_sdk_verification_message_revoked(inputs)
	return ar_sdk_verification_message_revoked(inputs)
});
export { sdk_verification_message_revoked as "sdk.verification.message.revoked" }