/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Allcontacts2Inputs */

const en_addressbook_allcontacts2 = /** @type {(inputs: Addressbook_Allcontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Contacts`)
};

const es_addressbook_allcontacts2 = /** @type {(inputs: Addressbook_Allcontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los Contactos`)
};

const fr_addressbook_allcontacts2 = /** @type {(inputs: Addressbook_Allcontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les contacts`)
};

const ar_addressbook_allcontacts2 = /** @type {(inputs: Addressbook_Allcontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Contacts`)
};

/**
* | output |
* | --- |
* | "All Contacts" |
*
* @param {Addressbook_Allcontacts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_allcontacts2 = /** @type {((inputs?: Addressbook_Allcontacts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Allcontacts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_allcontacts2(inputs)
	if (locale === "es") return es_addressbook_allcontacts2(inputs)
	if (locale === "fr") return fr_addressbook_allcontacts2(inputs)
	return ar_addressbook_allcontacts2(inputs)
});
export { addressbook_allcontacts2 as "addressBook.allContacts" }