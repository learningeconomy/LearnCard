/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Acceptfailed1Inputs */

const en_toasts_contacts_acceptfailed1 = /** @type {(inputs: Toasts_Contacts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to accept request`)
};

const es_toasts_contacts_acceptfailed1 = /** @type {(inputs: Toasts_Contacts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo aceptar la solicitud`)
};

const fr_toasts_contacts_acceptfailed1 = /** @type {(inputs: Toasts_Contacts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible d'accepter la demande`)
};

const ar_toasts_contacts_acceptfailed1 = /** @type {(inputs: Toasts_Contacts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر قبول الطلب`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to accept request" |
*
* @param {Toasts_Contacts_Acceptfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_acceptfailed1 = /** @type {((inputs?: Toasts_Contacts_Acceptfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Acceptfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_acceptfailed1(inputs)
	if (locale === "es") return es_toasts_contacts_acceptfailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_acceptfailed1(inputs)
	return ar_toasts_contacts_acceptfailed1(inputs)
});
export { toasts_contacts_acceptfailed1 as "toasts.contacts.acceptFailed" }