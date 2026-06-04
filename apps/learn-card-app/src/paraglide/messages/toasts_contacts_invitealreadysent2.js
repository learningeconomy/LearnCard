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

const de_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du hast bereits eine Verbindungsanfrage an diesen Benutzer gesendet.`)
};

const ar_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد أرسلت بالفعل طلب اتصال إلى هذا المستخدم.`)
};

const fr_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà envoyé une demande de connexion à cet utilisateur.`)
};

const ko_toasts_contacts_invitealreadysent2 = /** @type {(inputs: Toasts_Contacts_Invitealreadysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 이 사용자에게 연결 요청을 보냈습니다.`)
};

/**
* | output |
* | --- |
* | "You have already sent a connection request to this user." |
*
* @param {Toasts_Contacts_Invitealreadysent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_invitealreadysent2 = /** @type {((inputs?: Toasts_Contacts_Invitealreadysent2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Invitealreadysent2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "es") return es_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "de") return de_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "ar") return ar_toasts_contacts_invitealreadysent2(inputs)
	if (locale === "fr") return fr_toasts_contacts_invitealreadysent2(inputs)
	return ko_toasts_contacts_invitealreadysent2(inputs)
});
export { toasts_contacts_invitealreadysent2 as "toasts.contacts.inviteAlreadySent" }