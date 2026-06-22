/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Alreadyconnected1Inputs */

const en_toasts_contacts_alreadyconnected1 = /** @type {(inputs: Toasts_Contacts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You are already connected with this user.`)
};

const es_toasts_contacts_alreadyconnected1 = /** @type {(inputs: Toasts_Contacts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya estás conectado con este usuario.`)
};

const fr_toasts_contacts_alreadyconnected1 = /** @type {(inputs: Toasts_Contacts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes déjà connecté avec cet utilisateur.`)
};

const ar_toasts_contacts_alreadyconnected1 = /** @type {(inputs: Toasts_Contacts_Alreadyconnected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت متصل بالفعل بهذا المستخدم.`)
};

/**
* | output |
* | --- |
* | "You are already connected with this user." |
*
* @param {Toasts_Contacts_Alreadyconnected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_alreadyconnected1 = /** @type {((inputs?: Toasts_Contacts_Alreadyconnected1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Alreadyconnected1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_alreadyconnected1(inputs)
	if (locale === "es") return es_toasts_contacts_alreadyconnected1(inputs)
	if (locale === "fr") return fr_toasts_contacts_alreadyconnected1(inputs)
	return ar_toasts_contacts_alreadyconnected1(inputs)
});
export { toasts_contacts_alreadyconnected1 as "toasts.contacts.alreadyConnected" }