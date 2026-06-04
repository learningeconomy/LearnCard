/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmblock1Inputs */

const en_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to block this user?`)
};

const es_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres bloquear a este usuario?`)
};

const de_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du diesen Benutzer wirklich blockieren?`)
};

const ar_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد حظر هذا المستخدم؟`)
};

const fr_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment bloquer cet utilisateur ?`)
};

const ko_contacts_confirmblock1 = /** @type {(inputs: Contacts_Confirmblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 사용자를 차단하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to block this user?" |
*
* @param {Contacts_Confirmblock1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmblock1 = /** @type {((inputs?: Contacts_Confirmblock1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmblock1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmblock1(inputs)
	if (locale === "es") return es_contacts_confirmblock1(inputs)
	if (locale === "de") return de_contacts_confirmblock1(inputs)
	if (locale === "ar") return ar_contacts_confirmblock1(inputs)
	if (locale === "fr") return fr_contacts_confirmblock1(inputs)
	return ko_contacts_confirmblock1(inputs)
});
export { contacts_confirmblock1 as "contacts.confirmBlock" }