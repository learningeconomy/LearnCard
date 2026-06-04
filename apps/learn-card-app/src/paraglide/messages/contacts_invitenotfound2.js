/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Invitenotfound2Inputs */

const en_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite not found or has expired`)
};

const es_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitación no encontrada o expirada`)
};

const de_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einladung nicht gefunden oder abgelaufen`)
};

const ar_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدعوة غير موجودة أو منتهية الصلاحية`)
};

const fr_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitation introuvable ou expirée`)
};

const ko_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초대를 찾을 수 없거나 만료되었습니다`)
};

/**
* | output |
* | --- |
* | "Invite not found or has expired" |
*
* @param {Contacts_Invitenotfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_invitenotfound2 = /** @type {((inputs?: Contacts_Invitenotfound2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Invitenotfound2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_invitenotfound2(inputs)
	if (locale === "es") return es_contacts_invitenotfound2(inputs)
	if (locale === "de") return de_contacts_invitenotfound2(inputs)
	if (locale === "ar") return ar_contacts_invitenotfound2(inputs)
	if (locale === "fr") return fr_contacts_invitenotfound2(inputs)
	return ko_contacts_invitenotfound2(inputs)
});
export { contacts_invitenotfound2 as "contacts.inviteNotFound" }