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

const de_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine blockierten Benutzer`)
};

const ar_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مستخدمون محظورون بعد`)
};

const fr_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun utilisateur bloqué`)
};

const ko_contacts_noblockedusers2 = /** @type {(inputs: Contacts_Noblockedusers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`차단된 사용자가 없습니다`)
};

/**
* | output |
* | --- |
* | "No blocked users yet" |
*
* @param {Contacts_Noblockedusers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_noblockedusers2 = /** @type {((inputs?: Contacts_Noblockedusers2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Noblockedusers2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_noblockedusers2(inputs)
	if (locale === "es") return es_contacts_noblockedusers2(inputs)
	if (locale === "de") return de_contacts_noblockedusers2(inputs)
	if (locale === "ar") return ar_contacts_noblockedusers2(inputs)
	if (locale === "fr") return fr_contacts_noblockedusers2(inputs)
	return ko_contacts_noblockedusers2(inputs)
});
export { contacts_noblockedusers2 as "contacts.noBlockedUsers" }