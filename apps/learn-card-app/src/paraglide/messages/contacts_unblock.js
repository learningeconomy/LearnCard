/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_UnblockInputs */

const en_contacts_unblock = /** @type {(inputs: Contacts_UnblockInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unblock`)
};

const es_contacts_unblock = /** @type {(inputs: Contacts_UnblockInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desbloquear`)
};

const fr_contacts_unblock = /** @type {(inputs: Contacts_UnblockInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débloquer`)
};

const ar_contacts_unblock = /** @type {(inputs: Contacts_UnblockInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الحظر`)
};

/**
* | output |
* | --- |
* | "Unblock" |
*
* @param {Contacts_UnblockInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_unblock = /** @type {((inputs?: Contacts_UnblockInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_UnblockInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_unblock(inputs)
	if (locale === "es") return es_contacts_unblock(inputs)
	if (locale === "fr") return fr_contacts_unblock(inputs)
	return ar_contacts_unblock(inputs)
});
export { contacts_unblock as "contacts.unblock" }