/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_RemovedInputs */

const en_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact removed`)
};

const es_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacto eliminado`)
};

const de_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt entfernt`)
};

const ar_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إزالة جهة الاتصال`)
};

const fr_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact supprimé`)
};

const ko_toasts_contacts_removed = /** @type {(inputs: Toasts_Contacts_RemovedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 제거됨`)
};

/**
* | output |
* | --- |
* | "Contact removed" |
*
* @param {Toasts_Contacts_RemovedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_removed = /** @type {((inputs?: Toasts_Contacts_RemovedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_RemovedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_removed(inputs)
	if (locale === "es") return es_toasts_contacts_removed(inputs)
	if (locale === "de") return de_toasts_contacts_removed(inputs)
	if (locale === "ar") return ar_toasts_contacts_removed(inputs)
	if (locale === "fr") return fr_toasts_contacts_removed(inputs)
	return ko_toasts_contacts_removed(inputs)
});
export { toasts_contacts_removed as "toasts.contacts.removed" }