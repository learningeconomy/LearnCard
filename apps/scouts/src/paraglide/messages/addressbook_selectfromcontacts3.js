/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Selectfromcontacts3Inputs */

const en_addressbook_selectfromcontacts3 = /** @type {(inputs: Addressbook_Selectfromcontacts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select from Contacts`)
};

const es_addressbook_selectfromcontacts3 = /** @type {(inputs: Addressbook_Selectfromcontacts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar de Contactos`)
};

const fr_addressbook_selectfromcontacts3 = /** @type {(inputs: Addressbook_Selectfromcontacts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner parmi les contacts`)
};

const ar_addressbook_selectfromcontacts3 = /** @type {(inputs: Addressbook_Selectfromcontacts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select from Contacts`)
};

/**
* | output |
* | --- |
* | "Select from Contacts" |
*
* @param {Addressbook_Selectfromcontacts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_selectfromcontacts3 = /** @type {((inputs?: Addressbook_Selectfromcontacts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Selectfromcontacts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_selectfromcontacts3(inputs)
	if (locale === "es") return es_addressbook_selectfromcontacts3(inputs)
	if (locale === "fr") return fr_addressbook_selectfromcontacts3(inputs)
	return ar_addressbook_selectfromcontacts3(inputs)
});
export { addressbook_selectfromcontacts3 as "addressBook.selectFromContacts" }