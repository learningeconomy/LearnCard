/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Removefailed1Inputs */

const en_toasts_contacts_removefailed1 = /** @type {(inputs: Toasts_Contacts_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove contact`)
};

const es_toasts_contacts_removefailed1 = /** @type {(inputs: Toasts_Contacts_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar contacto`)
};

const fr_toasts_contacts_removefailed1 = /** @type {(inputs: Toasts_Contacts_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression du contact`)
};

const ar_toasts_contacts_removefailed1 = /** @type {(inputs: Toasts_Contacts_Removefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إزالة جهة الاتصال`)
};

/**
* | output |
* | --- |
* | "Failed to remove contact" |
*
* @param {Toasts_Contacts_Removefailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_removefailed1 = /** @type {((inputs?: Toasts_Contacts_Removefailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Removefailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_removefailed1(inputs)
	if (locale === "es") return es_toasts_contacts_removefailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_removefailed1(inputs)
	return ar_toasts_contacts_removefailed1(inputs)
});
export { toasts_contacts_removefailed1 as "toasts.contacts.removeFailed" }