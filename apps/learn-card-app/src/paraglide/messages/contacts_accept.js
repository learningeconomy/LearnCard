/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_AcceptInputs */

const en_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const de_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annehmen`)
};

const ar_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول`)
};

const fr_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ko_contacts_accept = /** @type {(inputs: Contacts_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Contacts_AcceptInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_accept = /** @type {((inputs?: Contacts_AcceptInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_AcceptInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_accept(inputs)
	if (locale === "es") return es_contacts_accept(inputs)
	if (locale === "de") return de_contacts_accept(inputs)
	if (locale === "ar") return ar_contacts_accept(inputs)
	if (locale === "fr") return fr_contacts_accept(inputs)
	return ko_contacts_accept(inputs)
});
export { contacts_accept as "contacts.accept" }