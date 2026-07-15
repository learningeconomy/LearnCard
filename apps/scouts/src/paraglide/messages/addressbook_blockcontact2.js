/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Blockcontact2Inputs */

const en_addressbook_blockcontact2 = /** @type {(inputs: Addressbook_Blockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Block Contact`)
};

const es_addressbook_blockcontact2 = /** @type {(inputs: Addressbook_Blockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear Contacto`)
};

const fr_addressbook_blockcontact2 = /** @type {(inputs: Addressbook_Blockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquer le contact`)
};

const ar_addressbook_blockcontact2 = /** @type {(inputs: Addressbook_Blockcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حظر جهة الاتصال`)
};

/**
* | output |
* | --- |
* | "Block Contact" |
*
* @param {Addressbook_Blockcontact2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_blockcontact2 = /** @type {((inputs?: Addressbook_Blockcontact2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Blockcontact2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_blockcontact2(inputs)
	if (locale === "es") return es_addressbook_blockcontact2(inputs)
	if (locale === "fr") return fr_addressbook_blockcontact2(inputs)
	return ar_addressbook_blockcontact2(inputs)
});
export { addressbook_blockcontact2 as "addressBook.blockContact" }