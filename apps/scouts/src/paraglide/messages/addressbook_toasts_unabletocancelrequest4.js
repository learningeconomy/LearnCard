/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletocancelrequest4Inputs */

const en_addressbook_toasts_unabletocancelrequest4 = /** @type {(inputs: Addressbook_Toasts_Unabletocancelrequest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to cancel request`)
};

const es_addressbook_toasts_unabletocancelrequest4 = /** @type {(inputs: Addressbook_Toasts_Unabletocancelrequest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo cancelar la solicitud.`)
};

const fr_addressbook_toasts_unabletocancelrequest4 = /** @type {(inputs: Addressbook_Toasts_Unabletocancelrequest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue, impossible d'annuler la demande`)
};

const ar_addressbook_toasts_unabletocancelrequest4 = /** @type {(inputs: Addressbook_Toasts_Unabletocancelrequest4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر إلغاء الطلب`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to cancel request" |
*
* @param {Addressbook_Toasts_Unabletocancelrequest4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletocancelrequest4 = /** @type {((inputs?: Addressbook_Toasts_Unabletocancelrequest4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletocancelrequest4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletocancelrequest4(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletocancelrequest4(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletocancelrequest4(inputs)
	return ar_addressbook_toasts_unabletocancelrequest4(inputs)
});
export { addressbook_toasts_unabletocancelrequest4 as "addressBook.toasts.unableToCancelRequest" }