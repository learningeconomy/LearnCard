/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_ContactsInputs */

const en_sidemenu_links_contacts = /** @type {(inputs: Sidemenu_Links_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_sidemenu_links_contacts = /** @type {(inputs: Sidemenu_Links_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const de_sidemenu_links_contacts = /** @type {(inputs: Sidemenu_Links_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakte`)
};

const ar_sidemenu_links_contacts = /** @type {(inputs: Sidemenu_Links_ContactsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Sidemenu_Links_ContactsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_contacts = /** @type {((inputs?: Sidemenu_Links_ContactsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_ContactsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_contacts(inputs)
	if (locale === "es") return es_sidemenu_links_contacts(inputs)
	if (locale === "de") return de_sidemenu_links_contacts(inputs)
	return ar_sidemenu_links_contacts(inputs)
});
export { sidemenu_links_contacts as "sidemenu.links.contacts" }