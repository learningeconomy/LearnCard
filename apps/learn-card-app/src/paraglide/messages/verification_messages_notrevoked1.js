/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Messages_Notrevoked1Inputs */

const en_verification_messages_notrevoked1 = /** @type {(inputs: Verification_Messages_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Revoked`)
};

const es_verification_messages_notrevoked1 = /** @type {(inputs: Verification_Messages_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No revocado`)
};

const fr_verification_messages_notrevoked1 = /** @type {(inputs: Verification_Messages_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non révoqué`)
};

const ar_verification_messages_notrevoked1 = /** @type {(inputs: Verification_Messages_Notrevoked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير ملغى`)
};

/**
* | output |
* | --- |
* | "Not Revoked" |
*
* @param {Verification_Messages_Notrevoked1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_messages_notrevoked1 = /** @type {((inputs?: Verification_Messages_Notrevoked1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Messages_Notrevoked1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_messages_notrevoked1(inputs)
	if (locale === "es") return es_verification_messages_notrevoked1(inputs)
	if (locale === "fr") return fr_verification_messages_notrevoked1(inputs)
	return ar_verification_messages_notrevoked1(inputs)
});
export { verification_messages_notrevoked1 as "verification.messages.notRevoked" }