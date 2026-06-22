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

const fr_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien d'invitation a expiré !`)
};

const ar_contacts_inviteexpired1 = /** @type {(inputs: Contacts_Inviteexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!انتهت صلاحية رابط الدعوة`)
};

/**
* | output |
* | --- |
* | "Invite link has expired!" |
*
* @param {Contacts_Inviteexpired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_inviteexpired1 = /** @type {((inputs?: Contacts_Inviteexpired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Inviteexpired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_inviteexpired1(inputs)
	if (locale === "es") return es_contacts_inviteexpired1(inputs)
	if (locale === "fr") return fr_contacts_inviteexpired1(inputs)
	return ar_contacts_inviteexpired1(inputs)
});
export { contacts_inviteexpired1 as "contacts.inviteExpired" }