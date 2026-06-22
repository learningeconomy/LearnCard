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

const fr_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible d'envoyer la demande de connexion.`)
};

const ar_toasts_contacts_connectionsendfailed2 = /** @type {(inputs: Toasts_Contacts_Connectionsendfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر إرسال طلب الاتصال.`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to send connection request." |
*
* @param {Toasts_Contacts_Connectionsendfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_connectionsendfailed2 = /** @type {((inputs?: Toasts_Contacts_Connectionsendfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Connectionsendfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "es") return es_toasts_contacts_connectionsendfailed2(inputs)
	if (locale === "fr") return fr_toasts_contacts_connectionsendfailed2(inputs)
	return ar_toasts_contacts_connectionsendfailed2(inputs)
});
export { toasts_contacts_connectionsendfailed2 as "toasts.contacts.connectionSendFailed" }