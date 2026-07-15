/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Removecontact2Inputs */

const en_addressbook_removecontact2 = /** @type {(inputs: Addressbook_Removecontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Contact`)
};

const es_addressbook_removecontact2 = /** @type {(inputs: Addressbook_Removecontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Contacto`)
};

const fr_addressbook_removecontact2 = /** @type {(inputs: Addressbook_Removecontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le contact`)
};

const ar_addressbook_removecontact2 = /** @type {(inputs: Addressbook_Removecontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة جهة الاتصال`)
};

/**
* | output |
* | --- |
* | "Remove Contact" |
*
* @param {Addressbook_Removecontact2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_removecontact2 = /** @type {((inputs?: Addressbook_Removecontact2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Removecontact2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_removecontact2(inputs)
	if (locale === "es") return es_addressbook_removecontact2(inputs)
	if (locale === "fr") return fr_addressbook_removecontact2(inputs)
	return ar_addressbook_removecontact2(inputs)
});
export { addressbook_removecontact2 as "addressBook.removeContact" }