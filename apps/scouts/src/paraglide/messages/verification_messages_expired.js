/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Verification_Messages_ExpiredInputs */

const en_verification_messages_expired = /** @type {(inputs: Verification_Messages_ExpiredInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalid • Expired ${i?.date}`)
};

const es_verification_messages_expired = /** @type {(inputs: Verification_Messages_ExpiredInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Inválido • Vencido ${i?.date}`)
};

const fr_verification_messages_expired = /** @type {(inputs: Verification_Messages_ExpiredInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalide • Expiré ${i?.date}`)
};

const ar_verification_messages_expired = /** @type {(inputs: Verification_Messages_ExpiredInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`غير صالح • منتهٍ ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Invalid • Expired {date}" |
*
* @param {Verification_Messages_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_messages_expired = /** @type {((inputs: Verification_Messages_ExpiredInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Messages_ExpiredInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_messages_expired(inputs)
	if (locale === "es") return es_verification_messages_expired(inputs)
	if (locale === "fr") return fr_verification_messages_expired(inputs)
	return ar_verification_messages_expired(inputs)
});
export { verification_messages_expired as "verification.messages.expired" }