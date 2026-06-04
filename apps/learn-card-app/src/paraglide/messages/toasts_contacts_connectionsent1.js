/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Connectionsent1Inputs */

const en_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection request sent!`)
};

const es_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Solicitud de conexión enviada!`)
};

const de_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungsanfrage gesendet!`)
};

const ar_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال طلب الاتصال!`)
};

const fr_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion envoyée !`)
};

const ko_toasts_contacts_connectionsent1 = /** @type {(inputs: Toasts_Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청이 전송되었습니다!`)
};

/**
* | output |
* | --- |
* | "Connection request sent!" |
*
* @param {Toasts_Contacts_Connectionsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_connectionsent1 = /** @type {((inputs?: Toasts_Contacts_Connectionsent1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Connectionsent1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_connectionsent1(inputs)
	if (locale === "es") return es_toasts_contacts_connectionsent1(inputs)
	if (locale === "de") return de_toasts_contacts_connectionsent1(inputs)
	if (locale === "ar") return ar_toasts_contacts_connectionsent1(inputs)
	if (locale === "fr") return fr_toasts_contacts_connectionsent1(inputs)
	return ko_toasts_contacts_connectionsent1(inputs)
});
export { toasts_contacts_connectionsent1 as "toasts.contacts.connectionSent" }