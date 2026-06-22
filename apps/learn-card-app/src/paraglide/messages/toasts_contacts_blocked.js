/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_BlockedInputs */

const en_toasts_contacts_blocked = /** @type {(inputs: Toasts_Contacts_BlockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User blocked`)
};

const es_toasts_contacts_blocked = /** @type {(inputs: Toasts_Contacts_BlockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuario bloqueado`)
};

const fr_toasts_contacts_blocked = /** @type {(inputs: Toasts_Contacts_BlockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateur bloqué`)
};

const ar_toasts_contacts_blocked = /** @type {(inputs: Toasts_Contacts_BlockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حظر المستخدم`)
};

/**
* | output |
* | --- |
* | "User blocked" |
*
* @param {Toasts_Contacts_BlockedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_blocked = /** @type {((inputs?: Toasts_Contacts_BlockedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_BlockedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_blocked(inputs)
	if (locale === "es") return es_toasts_contacts_blocked(inputs)
	if (locale === "fr") return fr_toasts_contacts_blocked(inputs)
	return ar_toasts_contacts_blocked(inputs)
});
export { toasts_contacts_blocked as "toasts.contacts.blocked" }