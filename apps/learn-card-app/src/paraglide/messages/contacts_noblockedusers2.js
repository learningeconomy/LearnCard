/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Noblockedusers2Inputs */

const en_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No blocked users yet`)
};

const es_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay usuarios bloqueados`)
};

const fr_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun utilisateur bloqué`)
};

const ar_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مستخدمون محظورون بعد`)
};

/**
* | output |
* | --- |
* | "No blocked users yet" |
*
* @param {Contacts_Noblockedusers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_noblockedusers2 = /** @type {((inputs?: Contacts_Noblockedusers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Noblockedusers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_noblockedusers2(inputs)
	if (locale === "es") return es_contacts_noblockedusers2(inputs)
	if (locale === "fr") return fr_contacts_noblockedusers2(inputs)
	return ar_contacts_noblockedusers2(inputs)
});
export { contacts_noblockedusers2 as "contacts.noBlockedUsers" }