/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_ContactsInputs */

const en_scanner_contacts = /** @type {(inputs: Scanner_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_scanner_contacts = /** @type {(inputs: Scanner_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_scanner_contacts = /** @type {(inputs: Scanner_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_scanner_contacts = /** @type {(inputs: Scanner_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Scanner_ContactsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_contacts = /** @type {((inputs?: Scanner_ContactsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_ContactsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_contacts(inputs)
	if (locale === "es") return es_scanner_contacts(inputs)
	if (locale === "fr") return fr_scanner_contacts(inputs)
	return ar_scanner_contacts(inputs)
});
export { scanner_contacts as "scanner.contacts" }