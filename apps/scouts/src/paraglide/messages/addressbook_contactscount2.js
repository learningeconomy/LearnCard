/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Addressbook_Contactscount2Inputs */

const en_addressbook_contactscount2 = /** @type {(inputs: Addressbook_Contactscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contacts`)
};

const es_addressbook_contactscount2 = /** @type {(inputs: Addressbook_Contactscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contactos`)
};

const fr_addressbook_contactscount2 = /** @type {(inputs: Addressbook_Contactscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Contacts`)
};

const ar_addressbook_contactscount2 = /** @type {(inputs: Addressbook_Contactscount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جهة اتصال`)
};

/**
* | output |
* | --- |
* | "{count} Contacts" |
*
* @param {Addressbook_Contactscount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_contactscount2 = /** @type {((inputs: Addressbook_Contactscount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Contactscount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_contactscount2(inputs)
	if (locale === "es") return es_addressbook_contactscount2(inputs)
	if (locale === "fr") return fr_addressbook_contactscount2(inputs)
	return ar_addressbook_contactscount2(inputs)
});
export { addressbook_contactscount2 as "addressBook.contactsCount" }