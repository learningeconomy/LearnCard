/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Addcontact1Inputs */

const en_contacts_addcontact1 = /** @type {(inputs: Contacts_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Contact`)
};

const es_contacts_addcontact1 = /** @type {(inputs: Contacts_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar contacto`)
};

const fr_contacts_addcontact1 = /** @type {(inputs: Contacts_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ar_contacts_addcontact1 = /** @type {(inputs: Contacts_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

/**
* | output |
* | --- |
* | "Add Contact" |
*
* @param {Contacts_Addcontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_addcontact1 = /** @type {((inputs?: Contacts_Addcontact1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Addcontact1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_addcontact1(inputs)
	if (locale === "es") return es_contacts_addcontact1(inputs)
	if (locale === "fr") return fr_contacts_addcontact1(inputs)
	return ar_contacts_addcontact1(inputs)
});
export { contacts_addcontact1 as "contacts.addContact" }