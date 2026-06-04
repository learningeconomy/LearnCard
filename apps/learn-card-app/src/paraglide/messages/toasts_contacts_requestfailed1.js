/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Requestfailed1Inputs */

const en_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send request`)
};

const es_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al enviar solicitud`)
};

const de_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anfrage konnte nicht gesendet werden`)
};

const ar_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إرسال الطلب`)
};

const fr_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi de la demande`)
};

const ko_toasts_contacts_requestfailed1 = /** @type {(inputs: Toasts_Contacts_Requestfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청 전송 실패`)
};

/**
* | output |
* | --- |
* | "Failed to send request" |
*
* @param {Toasts_Contacts_Requestfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_requestfailed1 = /** @type {((inputs?: Toasts_Contacts_Requestfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Requestfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_requestfailed1(inputs)
	if (locale === "es") return es_toasts_contacts_requestfailed1(inputs)
	if (locale === "de") return de_toasts_contacts_requestfailed1(inputs)
	if (locale === "ar") return ar_toasts_contacts_requestfailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_requestfailed1(inputs)
	return ko_toasts_contacts_requestfailed1(inputs)
});
export { toasts_contacts_requestfailed1 as "toasts.contacts.requestFailed" }