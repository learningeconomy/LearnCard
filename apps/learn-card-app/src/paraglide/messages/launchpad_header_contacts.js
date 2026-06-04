/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Header_ContactsInputs */

const en_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const de_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakte`)
};

const ar_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

const fr_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ko_launchpad_header_contacts = /** @type {(inputs: Launchpad_Header_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Launchpad_Header_ContactsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_header_contacts = /** @type {((inputs?: Launchpad_Header_ContactsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Header_ContactsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_header_contacts(inputs)
	if (locale === "es") return es_launchpad_header_contacts(inputs)
	if (locale === "de") return de_launchpad_header_contacts(inputs)
	if (locale === "ar") return ar_launchpad_header_contacts(inputs)
	if (locale === "fr") return fr_launchpad_header_contacts(inputs)
	return ko_launchpad_header_contacts(inputs)
});
export { launchpad_header_contacts as "launchpad.header.contacts" }