/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Verification_Messages_ExpiresInputs */

const en_verification_messages_expires = /** @type {(inputs: Verification_Messages_ExpiresInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Valid • Expires ${i?.date}`)
};

const es_verification_messages_expires = /** @type {(inputs: Verification_Messages_ExpiresInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Válido • Vence ${i?.date}`)
};

const fr_verification_messages_expires = /** @type {(inputs: Verification_Messages_ExpiresInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Valide • Expire ${i?.date}`)
};

const ar_verification_messages_expires = /** @type {(inputs: Verification_Messages_ExpiresInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`صالح • ينتهي ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Valid • Expires {date}" |
*
* @param {Verification_Messages_ExpiresInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_messages_expires = /** @type {((inputs: Verification_Messages_ExpiresInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Messages_ExpiresInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_messages_expires(inputs)
	if (locale === "es") return es_verification_messages_expires(inputs)
	if (locale === "fr") return fr_verification_messages_expires(inputs)
	return ar_verification_messages_expires(inputs)
});
export { verification_messages_expires as "verification.messages.expires" }