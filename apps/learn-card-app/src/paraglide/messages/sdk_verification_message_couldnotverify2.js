/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Message_Couldnotverify2Inputs */

const en_sdk_verification_message_couldnotverify2 = /** @type {(inputs: Sdk_Verification_Message_Couldnotverify2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Credential could not be verified.`)
};

const es_sdk_verification_message_couldnotverify2 = /** @type {(inputs: Sdk_Verification_Message_Couldnotverify2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo verificar la credencial Boost.`)
};

const fr_sdk_verification_message_couldnotverify2 = /** @type {(inputs: Sdk_Verification_Message_Couldnotverify2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le justificatif Boost n’a pas pu être vérifié.`)
};

const ar_sdk_verification_message_couldnotverify2 = /** @type {(inputs: Sdk_Verification_Message_Couldnotverify2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر التحقق من بيان اعتماد Boost.`)
};

/**
* | output |
* | --- |
* | "Boost Credential could not be verified." |
*
* @param {Sdk_Verification_Message_Couldnotverify2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_message_couldnotverify2 = /** @type {((inputs?: Sdk_Verification_Message_Couldnotverify2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Message_Couldnotverify2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_message_couldnotverify2(inputs)
	if (locale === "es") return es_sdk_verification_message_couldnotverify2(inputs)
	if (locale === "fr") return fr_sdk_verification_message_couldnotverify2(inputs)
	return ar_sdk_verification_message_couldnotverify2(inputs)
});
export { sdk_verification_message_couldnotverify2 as "sdk.verification.message.couldNotVerify" }