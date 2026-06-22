/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Contactscount1Inputs */

const en_contacts_contactscount1 = /** @type {(inputs: Contacts_Contactscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contacts`)
};

const es_contacts_contactscount1 = /** @type {(inputs: Contacts_Contactscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contactos`)
};

const fr_contacts_contactscount1 = /** @type {(inputs: Contacts_Contactscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contacts`)
};

const ar_contacts_contactscount1 = /** @type {(inputs: Contacts_Contactscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جهات اتصال`)
};

/**
* | output |
* | --- |
* | "{count} Contacts" |
*
* @param {Contacts_Contactscount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_contactscount1 = /** @type {((inputs: Contacts_Contactscount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Contactscount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_contactscount1(inputs)
	if (locale === "es") return es_contacts_contactscount1(inputs)
	if (locale === "fr") return fr_contacts_contactscount1(inputs)
	return ar_contacts_contactscount1(inputs)
});
export { contacts_contactscount1 as "contacts.contactsCount" }