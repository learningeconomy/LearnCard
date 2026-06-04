/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Inviteexpired1Inputs */

const en_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite link has expired!`)
};

const es_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡El enlace de invitación ha expirado!`)
};

const de_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einladungslink ist abgelaufen!`)
};

const ar_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!انتهت صلاحية رابط الدعوة`)
};

const fr_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien d'invitation a expiré !`)
};

const ko_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초대 링크가 만료되었습니다!`)
};

/**
* | output |
* | --- |
* | "Invite link has expired!" |
*
* @param {Contacts_Inviteexpired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_inviteexpired1 = /** @type {((inputs?: Contacts_Inviteexpired1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Inviteexpired1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_inviteexpired1(inputs)
	if (locale === "es") return es_contacts_inviteexpired1(inputs)
	if (locale === "de") return de_contacts_inviteexpired1(inputs)
	if (locale === "ar") return ar_contacts_inviteexpired1(inputs)
	if (locale === "fr") return fr_contacts_inviteexpired1(inputs)
	return ko_contacts_inviteexpired1(inputs)
});
export { contacts_inviteexpired1 as "contacts.inviteExpired" }