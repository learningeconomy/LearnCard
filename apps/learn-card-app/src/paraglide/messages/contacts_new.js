/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_NewInputs */

const en_contacts_new = /** @type {(inputs: Contacts_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New`)
};

const es_contacts_new = /** @type {(inputs: Contacts_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo`)
};

const fr_contacts_new = /** @type {(inputs: Contacts_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau`)
};

const ar_contacts_new = /** @type {(inputs: Contacts_NewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جديد`)
};

/**
* | output |
* | --- |
* | "New" |
*
* @param {Contacts_NewInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_new = /** @type {((inputs?: Contacts_NewInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_NewInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_new(inputs)
	if (locale === "es") return es_contacts_new(inputs)
	if (locale === "fr") return fr_contacts_new(inputs)
	return ar_contacts_new(inputs)
});
export { contacts_new as "contacts.new" }