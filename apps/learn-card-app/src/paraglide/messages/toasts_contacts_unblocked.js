/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_UnblockedInputs */

const en_toasts_contacts_unblocked = /** @type {(inputs: Toasts_Contacts_UnblockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User unblocked`)
};

const es_toasts_contacts_unblocked = /** @type {(inputs: Toasts_Contacts_UnblockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuario desbloqueado`)
};

const fr_toasts_contacts_unblocked = /** @type {(inputs: Toasts_Contacts_UnblockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateur débloqué`)
};

const ar_toasts_contacts_unblocked = /** @type {(inputs: Toasts_Contacts_UnblockedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إلغاء حظر المستخدم`)
};

/**
* | output |
* | --- |
* | "User unblocked" |
*
* @param {Toasts_Contacts_UnblockedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_unblocked = /** @type {((inputs?: Toasts_Contacts_UnblockedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_UnblockedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_unblocked(inputs)
	if (locale === "es") return es_toasts_contacts_unblocked(inputs)
	if (locale === "fr") return fr_toasts_contacts_unblocked(inputs)
	return ar_toasts_contacts_unblocked(inputs)
});
export { toasts_contacts_unblocked as "toasts.contacts.unblocked" }