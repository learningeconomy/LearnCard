/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Disconnectfailed1Inputs */

const en_toasts_contacts_disconnectfailed1 = /** @type {(inputs: Toasts_Contacts_Disconnectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to disconnect`)
};

const es_toasts_contacts_disconnectfailed1 = /** @type {(inputs: Toasts_Contacts_Disconnectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al desconectar`)
};

const fr_toasts_contacts_disconnectfailed1 = /** @type {(inputs: Toasts_Contacts_Disconnectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la déconnexion`)
};

const ar_toasts_contacts_disconnectfailed1 = /** @type {(inputs: Toasts_Contacts_Disconnectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل قطع الاتصال`)
};

/**
* | output |
* | --- |
* | "Failed to disconnect" |
*
* @param {Toasts_Contacts_Disconnectfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_disconnectfailed1 = /** @type {((inputs?: Toasts_Contacts_Disconnectfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Disconnectfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_disconnectfailed1(inputs)
	if (locale === "es") return es_toasts_contacts_disconnectfailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_disconnectfailed1(inputs)
	return ar_toasts_contacts_disconnectfailed1(inputs)
});
export { toasts_contacts_disconnectfailed1 as "toasts.contacts.disconnectFailed" }