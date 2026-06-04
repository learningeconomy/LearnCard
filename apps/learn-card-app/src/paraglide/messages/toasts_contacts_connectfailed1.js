/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Connectfailed1Inputs */

const en_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to connect!`)
};

const es_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Ocurrió un error, no se pudo conectar!`)
};

const de_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ein Fehler ist aufgetreten, Verbindung fehlgeschlagen!`)
};

const ar_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر الاتصال!`)
};

const fr_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible de se connecter !`)
};

const ko_toasts_contacts_connectfailed1 = /** @type {(inputs: Toasts_Contacts_Connectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`오류가 발생하여 연결할 수 없습니다!`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to connect!" |
*
* @param {Toasts_Contacts_Connectfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_connectfailed1 = /** @type {((inputs?: Toasts_Contacts_Connectfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Connectfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_connectfailed1(inputs)
	if (locale === "es") return es_toasts_contacts_connectfailed1(inputs)
	if (locale === "de") return de_toasts_contacts_connectfailed1(inputs)
	if (locale === "ar") return ar_toasts_contacts_connectfailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_connectfailed1(inputs)
	return ko_toasts_contacts_connectfailed1(inputs)
});
export { toasts_contacts_connectfailed1 as "toasts.contacts.connectFailed" }