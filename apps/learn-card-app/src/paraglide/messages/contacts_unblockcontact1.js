/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Unblockcontact1Inputs */

const en_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unblock Contact`)
};

const es_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desbloquear contacto`)
};

const de_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt entblocken`)
};

const ar_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء حظر جهة الاتصال`)
};

const fr_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débloquer le contact`)
};

const ko_contacts_unblockcontact1 = /** @type {(inputs: Contacts_Unblockcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 차단 해제`)
};

/**
* | output |
* | --- |
* | "Unblock Contact" |
*
* @param {Contacts_Unblockcontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_unblockcontact1 = /** @type {((inputs?: Contacts_Unblockcontact1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Unblockcontact1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_unblockcontact1(inputs)
	if (locale === "es") return es_contacts_unblockcontact1(inputs)
	if (locale === "de") return de_contacts_unblockcontact1(inputs)
	if (locale === "ar") return ar_contacts_unblockcontact1(inputs)
	if (locale === "fr") return fr_contacts_unblockcontact1(inputs)
	return ko_contacts_unblockcontact1(inputs)
});
export { contacts_unblockcontact1 as "contacts.unblockContact" }