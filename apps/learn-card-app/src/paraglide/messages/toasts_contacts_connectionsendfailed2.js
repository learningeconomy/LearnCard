/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Connectionsendfailed2Inputs */

const en_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to send connection request.`)
};

const es_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo enviar la solicitud de conexión.`)
};

const de_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ein Fehler ist aufgetreten, Verbindungsanfrage konnte nicht gesendet werden.`)
};

const ar_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر إرسال طلب الاتصال.`)
};

const fr_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible d'envoyer la demande de connexion.`)
};

const ko_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`오류가 발생하여 연결 요청을 보낼 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to send connection request." |
*
* @param {Toasts_Contacts_Connectionsendfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_connectionsendfailed2 = /** @type {((inputs?: Toasts_Contacts_Connectionsendfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Connectionsendfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "es") return es_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "de") return de_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "ar") return ar_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "fr") return fr_toasts_contacts_connectionsendfailed2(inputs)
	return ko_toasts_contacts_connectionsendfailed2(inputs)
});
export { toasts_contacts_connectionsendfailed2 as "toasts.contacts.connectionSendFailed" }