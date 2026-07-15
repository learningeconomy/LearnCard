/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmblockuser3Inputs */

const en_addressbook_confirmblockuser3 = /** @type {(inputs: Addressbook_Confirmblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to block this user?`)
};

const es_addressbook_confirmblockuser3 = /** @type {(inputs: Addressbook_Confirmblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres bloquear a este usuario?`)
};

const fr_addressbook_confirmblockuser3 = /** @type {(inputs: Addressbook_Confirmblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir bloquer cet utilisateur ?`)
};

const ar_addressbook_confirmblockuser3 = /** @type {(inputs: Addressbook_Confirmblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to block this user?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to block this user?" |
*
* @param {Addressbook_Confirmblockuser3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmblockuser3 = /** @type {((inputs?: Addressbook_Confirmblockuser3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmblockuser3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmblockuser3(inputs)
	if (locale === "es") return es_addressbook_confirmblockuser3(inputs)
	if (locale === "fr") return fr_addressbook_confirmblockuser3(inputs)
	return ar_addressbook_confirmblockuser3(inputs)
});
export { addressbook_confirmblockuser3 as "addressBook.confirmBlockUser" }