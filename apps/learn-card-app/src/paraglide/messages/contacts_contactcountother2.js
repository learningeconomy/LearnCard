/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Contactcountother2Inputs */

const en_contacts_contactcountother2 = /** @type {(inputs: Contacts_Contactcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contacts`)
};

const es_contacts_contactcountother2 = /** @type {(inputs: Contacts_Contactcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contactos`)
};

const fr_contacts_contactcountother2 = /** @type {(inputs: Contacts_Contactcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contacts`)
};

const ar_contacts_contactcountother2 = /** @type {(inputs: Contacts_Contactcountother2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جهات اتصال`)
};

/**
* | output |
* | --- |
* | "{count} Contacts" |
*
* @param {Contacts_Contactcountother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_contactcountother2 = /** @type {((inputs: Contacts_Contactcountother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Contactcountother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_contactcountother2(inputs)
	if (locale === "es") return es_contacts_contactcountother2(inputs)
	if (locale === "fr") return fr_contacts_contactcountother2(inputs)
	return ar_contacts_contactcountother2(inputs)
});
export { contacts_contactcountother2 as "contacts.contactCountOther" }