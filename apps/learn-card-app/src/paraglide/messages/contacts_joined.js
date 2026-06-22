/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_JoinedInputs */

const en_contacts_joined = /** @type {(inputs: Contacts_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joined`)
};

const es_contacts_joined = /** @type {(inputs: Contacts_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unido`)
};

const fr_contacts_joined = /** @type {(inputs: Contacts_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoint`)
};

const ar_contacts_joined = /** @type {(inputs: Contacts_JoinedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منضم`)
};

/**
* | output |
* | --- |
* | "Joined" |
*
* @param {Contacts_JoinedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_joined = /** @type {((inputs?: Contacts_JoinedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_JoinedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_joined(inputs)
	if (locale === "es") return es_contacts_joined(inputs)
	if (locale === "fr") return fr_contacts_joined(inputs)
	return ar_contacts_joined(inputs)
});
export { contacts_joined as "contacts.joined" }