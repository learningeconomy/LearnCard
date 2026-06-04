/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Requestsent1Inputs */

const en_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request sent`)
};

const es_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud enviada`)
};

const de_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anfrage gesendet`)
};

const ar_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال الطلب`)
};

const fr_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande envoyée`)
};

const ko_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청 전송됨`)
};

/**
* | output |
* | --- |
* | "Request sent" |
*
* @param {Toasts_Contacts_Requestsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_requestsent1 = /** @type {((inputs?: Toasts_Contacts_Requestsent1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Requestsent1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_requestsent1(inputs)
	if (locale === "es") return es_toasts_contacts_requestsent1(inputs)
	if (locale === "de") return de_toasts_contacts_requestsent1(inputs)
	if (locale === "ar") return ar_toasts_contacts_requestsent1(inputs)
	if (locale === "fr") return fr_toasts_contacts_requestsent1(inputs)
	return ko_toasts_contacts_requestsent1(inputs)
});
export { toasts_contacts_requestsent1 as "toasts.contacts.requestSent" }