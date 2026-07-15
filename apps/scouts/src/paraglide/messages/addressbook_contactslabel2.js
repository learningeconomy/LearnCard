/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Contactslabel2Inputs */

const en_addressbook_contactslabel2 = /** @type {(inputs: Addressbook_Contactslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const es_addressbook_contactslabel2 = /** @type {(inputs: Addressbook_Contactslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contactos`)
};

const fr_addressbook_contactslabel2 = /** @type {(inputs: Addressbook_Contactslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

const ar_addressbook_contactslabel2 = /** @type {(inputs: Addressbook_Contactslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacts`)
};

/**
* | output |
* | --- |
* | "Contacts" |
*
* @param {Addressbook_Contactslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_contactslabel2 = /** @type {((inputs?: Addressbook_Contactslabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Contactslabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_contactslabel2(inputs)
	if (locale === "es") return es_addressbook_contactslabel2(inputs)
	if (locale === "fr") return fr_addressbook_contactslabel2(inputs)
	return ar_addressbook_contactslabel2(inputs)
});
export { addressbook_contactslabel2 as "addressBook.contactsLabel" }