/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Sharecode2Inputs */

const en_addressbook_sharecode2 = /** @type {(inputs: Addressbook_Sharecode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Code`)
};

const es_addressbook_sharecode2 = /** @type {(inputs: Addressbook_Sharecode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Código`)
};

const fr_addressbook_sharecode2 = /** @type {(inputs: Addressbook_Sharecode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le code`)
};

const ar_addressbook_sharecode2 = /** @type {(inputs: Addressbook_Sharecode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرمز`)
};

/**
* | output |
* | --- |
* | "Share Code" |
*
* @param {Addressbook_Sharecode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_sharecode2 = /** @type {((inputs?: Addressbook_Sharecode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Sharecode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_sharecode2(inputs)
	if (locale === "es") return es_addressbook_sharecode2(inputs)
	if (locale === "fr") return fr_addressbook_sharecode2(inputs)
	return ar_addressbook_sharecode2(inputs)
});
export { addressbook_sharecode2 as "addressBook.shareCode" }