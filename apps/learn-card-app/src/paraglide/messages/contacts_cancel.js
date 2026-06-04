/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_CancelInputs */

const en_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const de_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abbrechen`)
};

const ar_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

const fr_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ko_contacts_cancel = /** @type {(inputs: Contacts_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Contacts_CancelInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_cancel = /** @type {((inputs?: Contacts_CancelInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_CancelInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_cancel(inputs)
	if (locale === "es") return es_contacts_cancel(inputs)
	if (locale === "de") return de_contacts_cancel(inputs)
	if (locale === "ar") return ar_contacts_cancel(inputs)
	if (locale === "fr") return fr_contacts_cancel(inputs)
	return ko_contacts_cancel(inputs)
});
export { contacts_cancel as "contacts.cancel" }