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

const fr_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande envoyée`)
};

const ar_toasts_contacts_requestsent1 = /** @type {(inputs: Toasts_Contacts_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال الطلب`)
};

/**
* | output |
* | --- |
* | "Request sent" |
*
* @param {Toasts_Contacts_Requestsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_requestsent1 = /** @type {((inputs?: Toasts_Contacts_Requestsent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Requestsent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_requestsent1(inputs)
	if (locale === "es") return es_toasts_contacts_requestsent1(inputs)
	if (locale === "fr") return fr_toasts_contacts_requestsent1(inputs)
	return ar_toasts_contacts_requestsent1(inputs)
});
export { toasts_contacts_requestsent1 as "toasts.contacts.requestSent" }