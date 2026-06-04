/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ContactInputs */

const en_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const es_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacto`)
};

const de_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt`)
};

const ar_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهة اتصال`)
};

const fr_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const ko_contacts_contact = /** @type {(inputs: Contacts_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처`)
};

/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Contacts_ContactInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_contact = /** @type {((inputs?: Contacts_ContactInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ContactInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_contact(inputs)
	if (locale === "es") return es_contacts_contact(inputs)
	if (locale === "de") return de_contacts_contact(inputs)
	if (locale === "ar") return ar_contacts_contact(inputs)
	if (locale === "fr") return fr_contacts_contact(inputs)
	return ko_contacts_contact(inputs)
});
export { contacts_contact as "contacts.contact" }