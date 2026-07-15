/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Ordivider2Inputs */

const en_addressbook_ordivider2 = /** @type {(inputs: Addressbook_Ordivider2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or`)
};

const es_addressbook_ordivider2 = /** @type {(inputs: Addressbook_Ordivider2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`o`)
};

const fr_addressbook_ordivider2 = /** @type {(inputs: Addressbook_Ordivider2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ou`)
};

const ar_addressbook_ordivider2 = /** @type {(inputs: Addressbook_Ordivider2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو`)
};

/**
* | output |
* | --- |
* | "or" |
*
* @param {Addressbook_Ordivider2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_ordivider2 = /** @type {((inputs?: Addressbook_Ordivider2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Ordivider2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_ordivider2(inputs)
	if (locale === "es") return es_addressbook_ordivider2(inputs)
	if (locale === "fr") return fr_addressbook_ordivider2(inputs)
	return ar_addressbook_ordivider2(inputs)
});
export { addressbook_ordivider2 as "addressBook.orDivider" }