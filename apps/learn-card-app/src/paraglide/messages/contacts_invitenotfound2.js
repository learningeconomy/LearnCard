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

const fr_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invitation introuvable ou expirée`)
};

const ar_contacts_invitenotfound2 = /** @type {(inputs: Contacts_Invitenotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدعوة غير موجودة أو منتهية الصلاحية`)
};

/**
* | output |
* | --- |
* | "Invite not found or has expired" |
*
* @param {Contacts_Invitenotfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_invitenotfound2 = /** @type {((inputs?: Contacts_Invitenotfound2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Invitenotfound2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_invitenotfound2(inputs)
	if (locale === "es") return es_contacts_invitenotfound2(inputs)
	if (locale === "fr") return fr_contacts_invitenotfound2(inputs)
	return ar_contacts_invitenotfound2(inputs)
});
export { contacts_invitenotfound2 as "contacts.inviteNotFound" }