/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Removecontact1Inputs */

const en_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove Contact`)
};

const es_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar contacto`)
};

const de_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt entfernen`)
};

const ar_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة جهة اتصال`)
};

const fr_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le contact`)
};

const ko_contacts_removecontact1 = /** @type {(inputs: Contacts_Removecontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 삭제`)
};

/**
* | output |
* | --- |
* | "Remove Contact" |
*
* @param {Contacts_Removecontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_removecontact1 = /** @type {((inputs?: Contacts_Removecontact1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Removecontact1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_removecontact1(inputs)
	if (locale === "es") return es_contacts_removecontact1(inputs)
	if (locale === "de") return de_contacts_removecontact1(inputs)
	if (locale === "ar") return ar_contacts_removecontact1(inputs)
	if (locale === "fr") return fr_contacts_removecontact1(inputs)
	return ko_contacts_removecontact1(inputs)
});
export { contacts_removecontact1 as "contacts.removeContact" }