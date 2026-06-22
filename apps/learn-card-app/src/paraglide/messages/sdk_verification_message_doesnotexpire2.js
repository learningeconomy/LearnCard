/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_Doesnotexpire2Inputs */

const en_sdk_verification_message_doesnotexpire2 = /** @type {(inputs: Sdk_Verification_Message_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Does Not Expire`)
};

const es_sdk_verification_message_doesnotexpire2 = /** @type {(inputs: Sdk_Verification_Message_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No vence`)
};

const fr_sdk_verification_message_doesnotexpire2 = /** @type {(inputs: Sdk_Verification_Message_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N’expire pas`)
};

const ar_sdk_verification_message_doesnotexpire2 = /** @type {(inputs: Sdk_Verification_Message_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تنتهي صلاحيته`)
};

/**
* | output |
* | --- |
* | "Does Not Expire" |
*
* @param {Sdk_Verification_Message_Doesnotexpire2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_doesnotexpire2 = /** @type {((inputs?: Sdk_Verification_Message_Doesnotexpire2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_Doesnotexpire2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_doesnotexpire2(inputs)
	if (locale === "es") return es_sdk_verification_message_doesnotexpire2(inputs)
	if (locale === "fr") return fr_sdk_verification_message_doesnotexpire2(inputs)
	return ar_sdk_verification_message_doesnotexpire2(inputs)
});
export { sdk_verification_message_doesnotexpire2 as "sdk.verification.message.doesNotExpire" }