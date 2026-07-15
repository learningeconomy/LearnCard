/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Requestsenttoboost4Inputs */

const en_addressbook_toasts_requestsenttoboost4 = /** @type {(inputs: Addressbook_Toasts_Requestsenttoboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request sent`)
};

const es_addressbook_toasts_requestsenttoboost4 = /** @type {(inputs: Addressbook_Toasts_Requestsenttoboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de conexión enviada`)
};

const fr_addressbook_toasts_requestsenttoboost4 = /** @type {(inputs: Addressbook_Toasts_Requestsenttoboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion envoyée`)
};

const ar_addressbook_toasts_requestsenttoboost4 = /** @type {(inputs: Addressbook_Toasts_Requestsenttoboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request sent`)
};

/**
* | output |
* | --- |
* | "Connection Request sent" |
*
* @param {Addressbook_Toasts_Requestsenttoboost4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_requestsenttoboost4 = /** @type {((inputs?: Addressbook_Toasts_Requestsenttoboost4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Requestsenttoboost4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_requestsenttoboost4(inputs)
	if (locale === "es") return es_addressbook_toasts_requestsenttoboost4(inputs)
	if (locale === "fr") return fr_addressbook_toasts_requestsenttoboost4(inputs)
	return ar_addressbook_toasts_requestsenttoboost4(inputs)
});
export { addressbook_toasts_requestsenttoboost4 as "addressBook.toasts.requestSentToBoost" }