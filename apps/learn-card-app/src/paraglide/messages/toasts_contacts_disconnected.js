/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_DisconnectedInputs */

const en_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnected`)
};

const es_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectado`)
};

const de_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Getrennt`)
};

const ar_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم قطع الاتصال`)
};

const fr_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnecté`)
};

const ko_toasts_contacts_disconnected = /** @type {(inputs: Toasts_Contacts_DisconnectedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 해제됨`)
};

/**
* | output |
* | --- |
* | "Disconnected" |
*
* @param {Toasts_Contacts_DisconnectedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_disconnected = /** @type {((inputs?: Toasts_Contacts_DisconnectedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_DisconnectedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_disconnected(inputs)
	if (locale === "es") return es_toasts_contacts_disconnected(inputs)
	if (locale === "de") return de_toasts_contacts_disconnected(inputs)
	if (locale === "ar") return ar_toasts_contacts_disconnected(inputs)
	if (locale === "fr") return fr_toasts_contacts_disconnected(inputs)
	return ko_toasts_contacts_disconnected(inputs)
});
export { toasts_contacts_disconnected as "toasts.contacts.disconnected" }