/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Connectionrequestsent3Inputs */

const en_addressbook_toasts_connectionrequestsent3 = /** @type {(inputs: Addressbook_Toasts_Connectionrequestsent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request sent`)
};

const es_addressbook_toasts_connectionrequestsent3 = /** @type {(inputs: Addressbook_Toasts_Connectionrequestsent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de conexión enviada`)
};

const fr_addressbook_toasts_connectionrequestsent3 = /** @type {(inputs: Addressbook_Toasts_Connectionrequestsent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion envoyée`)
};

const ar_addressbook_toasts_connectionrequestsent3 = /** @type {(inputs: Addressbook_Toasts_Connectionrequestsent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال طلب الاتصال`)
};

/**
* | output |
* | --- |
* | "Connection Request sent" |
*
* @param {Addressbook_Toasts_Connectionrequestsent3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_connectionrequestsent3 = /** @type {((inputs?: Addressbook_Toasts_Connectionrequestsent3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Connectionrequestsent3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_connectionrequestsent3(inputs)
	if (locale === "es") return es_addressbook_toasts_connectionrequestsent3(inputs)
	if (locale === "fr") return fr_addressbook_toasts_connectionrequestsent3(inputs)
	return ar_addressbook_toasts_connectionrequestsent3(inputs)
});
export { addressbook_toasts_connectionrequestsent3 as "addressBook.toasts.connectionRequestSent" }