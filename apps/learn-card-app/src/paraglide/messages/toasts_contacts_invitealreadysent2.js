/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Invitealreadysent2Inputs */

const en_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have already sent a connection request to this user.`)
};

const es_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya has enviado una solicitud de conexión a este usuario.`)
};

const fr_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà envoyé une demande de connexion à cet utilisateur.`)
};

const ar_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد أرسلت بالفعل طلب اتصال إلى هذا المستخدم.`)
};

/**
* | output |
* | --- |
* | "You have already sent a connection request to this user." |
*
* @param {Toasts_Contacts_Invitealreadysent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_invitealreadysent2 = /** @type {((inputs?: Toasts_Contacts_Invitealreadysent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Invitealreadysent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "es") return es_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "fr") return fr_toasts_contacts_invitealreadysent2(inputs)
	return ar_toasts_contacts_invitealreadysent2(inputs)
});
export { toasts_contacts_invitealreadysent2 as "toasts.contacts.inviteAlreadySent" }