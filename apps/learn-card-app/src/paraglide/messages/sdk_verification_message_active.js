/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_ActiveInputs */

const en_sdk_verification_message_active = /** @type {(inputs: Sdk_Verification_Message_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_sdk_verification_message_active = /** @type {(inputs: Sdk_Verification_Message_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activo`)
};

const fr_sdk_verification_message_active = /** @type {(inputs: Sdk_Verification_Message_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

const ar_sdk_verification_message_active = /** @type {(inputs: Sdk_Verification_Message_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشط`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Sdk_Verification_Message_ActiveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_active = /** @type {((inputs?: Sdk_Verification_Message_ActiveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_ActiveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_active(inputs)
	if (locale === "es") return es_sdk_verification_message_active(inputs)
	if (locale === "fr") return fr_sdk_verification_message_active(inputs)
	return ar_sdk_verification_message_active(inputs)
});
export { sdk_verification_message_active as "sdk.verification.message.active" }