/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Addcontactdesc2Inputs */

const en_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add contact`)
};

const es_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar contacto`)
};

const de_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt hinzufügen`)
};

const ar_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

const fr_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ko_contacts_addcontactdesc2 = /** @type {(inputs: Contacts_Addcontactdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 추가`)
};

/**
* | output |
* | --- |
* | "Add contact" |
*
* @param {Contacts_Addcontactdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_addcontactdesc2 = /** @type {((inputs?: Contacts_Addcontactdesc2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Addcontactdesc2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_addcontactdesc2(inputs)
	if (locale === "es") return es_contacts_addcontactdesc2(inputs)
	if (locale === "de") return de_contacts_addcontactdesc2(inputs)
	if (locale === "ar") return ar_contacts_addcontactdesc2(inputs)
	if (locale === "fr") return fr_contacts_addcontactdesc2(inputs)
	return ko_contacts_addcontactdesc2(inputs)
});
export { contacts_addcontactdesc2 as "contacts.addContactDesc" }