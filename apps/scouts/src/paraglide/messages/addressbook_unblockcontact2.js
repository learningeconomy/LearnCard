/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Unblockcontact2Inputs */

const en_addressbook_unblockcontact2 = /** @type {(inputs: Addressbook_Unblockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unblock Contact`)
};

const es_addressbook_unblockcontact2 = /** @type {(inputs: Addressbook_Unblockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desbloquear Contacto`)
};

const fr_addressbook_unblockcontact2 = /** @type {(inputs: Addressbook_Unblockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débloquer le contact`)
};

const ar_addressbook_unblockcontact2 = /** @type {(inputs: Addressbook_Unblockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unblock Contact`)
};

/**
* | output |
* | --- |
* | "Unblock Contact" |
*
* @param {Addressbook_Unblockcontact2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_unblockcontact2 = /** @type {((inputs?: Addressbook_Unblockcontact2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Unblockcontact2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_unblockcontact2(inputs)
	if (locale === "es") return es_addressbook_unblockcontact2(inputs)
	if (locale === "fr") return fr_addressbook_unblockcontact2(inputs)
	return ar_addressbook_unblockcontact2(inputs)
});
export { addressbook_unblockcontact2 as "addressBook.unblockContact" }