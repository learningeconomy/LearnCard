/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Messages_ValidInputs */

const en_verification_messages_valid = /** @type {(inputs: Verification_Messages_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valid`)
};

const es_verification_messages_valid = /** @type {(inputs: Verification_Messages_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Válido`)
};

const fr_verification_messages_valid = /** @type {(inputs: Verification_Messages_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valide`)
};

const ar_verification_messages_valid = /** @type {(inputs: Verification_Messages_ValidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صالح`)
};

/**
* | output |
* | --- |
* | "Valid" |
*
* @param {Verification_Messages_ValidInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_messages_valid = /** @type {((inputs?: Verification_Messages_ValidInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Messages_ValidInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_messages_valid(inputs)
	if (locale === "es") return es_verification_messages_valid(inputs)
	if (locale === "fr") return fr_verification_messages_valid(inputs)
	return ar_verification_messages_valid(inputs)
});
export { verification_messages_valid as "verification.messages.valid" }