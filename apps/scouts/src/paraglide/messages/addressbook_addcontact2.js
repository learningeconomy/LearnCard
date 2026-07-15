/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Addcontact2Inputs */

const en_addressbook_addcontact2 = /** @type {(inputs: Addressbook_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Contact`)
};

const es_addressbook_addcontact2 = /** @type {(inputs: Addressbook_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Contacto`)
};

const fr_addressbook_addcontact2 = /** @type {(inputs: Addressbook_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ar_addressbook_addcontact2 = /** @type {(inputs: Addressbook_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

/**
* | output |
* | --- |
* | "Add Contact" |
*
* @param {Addressbook_Addcontact2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_addcontact2 = /** @type {((inputs?: Addressbook_Addcontact2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Addcontact2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_addcontact2(inputs)
	if (locale === "es") return es_addressbook_addcontact2(inputs)
	if (locale === "fr") return fr_addressbook_addcontact2(inputs)
	return ar_addressbook_addcontact2(inputs)
});
export { addressbook_addcontact2 as "addressBook.addContact" }