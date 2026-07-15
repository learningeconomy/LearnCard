/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Noblockedusers3Inputs */

const en_addressbook_noblockedusers3 = /** @type {(inputs: Addressbook_Noblockedusers3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No blocked users yet.`)
};

const es_addressbook_noblockedusers3 = /** @type {(inputs: Addressbook_Noblockedusers3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin usuarios bloqueados.`)
};

const fr_addressbook_noblockedusers3 = /** @type {(inputs: Addressbook_Noblockedusers3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun utilisateur bloqué pour l'instant.`)
};

const ar_addressbook_noblockedusers3 = /** @type {(inputs: Addressbook_Noblockedusers3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مستخدمون محظورون بعد.`)
};

/**
* | output |
* | --- |
* | "No blocked users yet." |
*
* @param {Addressbook_Noblockedusers3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_noblockedusers3 = /** @type {((inputs?: Addressbook_Noblockedusers3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Noblockedusers3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_noblockedusers3(inputs)
	if (locale === "es") return es_addressbook_noblockedusers3(inputs)
	if (locale === "fr") return fr_addressbook_noblockedusers3(inputs)
	return ar_addressbook_noblockedusers3(inputs)
});
export { addressbook_noblockedusers3 as "addressBook.noBlockedUsers" }