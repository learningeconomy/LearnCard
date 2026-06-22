/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_TitleInputs */

const en_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_contacts_title = /** @type {(inputs: Contacts_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Contacts_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_title = /** @type {((inputs?: Contacts_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_title(inputs)
	if (locale === "es") return es_contacts_title(inputs)
	if (locale === "fr") return fr_contacts_title(inputs)
	return ar_contacts_title(inputs)
});
export { contacts_title as "contacts.title" }