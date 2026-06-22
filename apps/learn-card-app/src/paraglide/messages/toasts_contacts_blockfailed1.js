/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Blockfailed1Inputs */

const en_toasts_contacts_blockfailed1 = /** @type {(inputs: Toasts_Contacts_Blockfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to block user`)
};

const es_toasts_contacts_blockfailed1 = /** @type {(inputs: Toasts_Contacts_Blockfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo bloquear al usuario`)
};

const fr_toasts_contacts_blockfailed1 = /** @type {(inputs: Toasts_Contacts_Blockfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible de bloquer l'utilisateur`)
};

const ar_toasts_contacts_blockfailed1 = /** @type {(inputs: Toasts_Contacts_Blockfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر حظر المستخدم`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to block user" |
*
* @param {Toasts_Contacts_Blockfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_blockfailed1 = /** @type {((inputs?: Toasts_Contacts_Blockfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Blockfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_blockfailed1(inputs)
	if (locale === "es") return es_toasts_contacts_blockfailed1(inputs)
	if (locale === "fr") return fr_toasts_contacts_blockfailed1(inputs)
	return ar_toasts_contacts_blockfailed1(inputs)
});
export { toasts_contacts_blockfailed1 as "toasts.contacts.blockFailed" }