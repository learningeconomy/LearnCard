/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Messages_Doesnotexpire2Inputs */

const en_verification_messages_doesnotexpire2 = /** @type {(inputs: Verification_Messages_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Does Not Expire`)
};

const es_verification_messages_doesnotexpire2 = /** @type {(inputs: Verification_Messages_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No expira`)
};

const fr_verification_messages_doesnotexpire2 = /** @type {(inputs: Verification_Messages_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N'expire pas`)
};

const ar_verification_messages_doesnotexpire2 = /** @type {(inputs: Verification_Messages_Doesnotexpire2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا ينتهي`)
};

/**
* | output |
* | --- |
* | "Does Not Expire" |
*
* @param {Verification_Messages_Doesnotexpire2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_messages_doesnotexpire2 = /** @type {((inputs?: Verification_Messages_Doesnotexpire2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Messages_Doesnotexpire2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_messages_doesnotexpire2(inputs)
	if (locale === "es") return es_verification_messages_doesnotexpire2(inputs)
	if (locale === "fr") return fr_verification_messages_doesnotexpire2(inputs)
	return ar_verification_messages_doesnotexpire2(inputs)
});
export { verification_messages_doesnotexpire2 as "verification.messages.doesNotExpire" }