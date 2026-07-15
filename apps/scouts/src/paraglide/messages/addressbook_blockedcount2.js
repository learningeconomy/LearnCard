/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Addressbook_Blockedcount2Inputs */

const en_addressbook_blockedcount2 = /** @type {(inputs: Addressbook_Blockedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Blocked`)
};

const es_addressbook_blockedcount2 = /** @type {(inputs: Addressbook_Blockedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Bloqueados`)
};

const fr_addressbook_blockedcount2 = /** @type {(inputs: Addressbook_Blockedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Bloqué`)
};

const ar_addressbook_blockedcount2 = /** @type {(inputs: Addressbook_Blockedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Blocked`)
};

/**
* | output |
* | --- |
* | "{count} Blocked" |
*
* @param {Addressbook_Blockedcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_blockedcount2 = /** @type {((inputs: Addressbook_Blockedcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Blockedcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_blockedcount2(inputs)
	if (locale === "es") return es_addressbook_blockedcount2(inputs)
	if (locale === "fr") return fr_addressbook_blockedcount2(inputs)
	return ar_addressbook_blockedcount2(inputs)
});
export { addressbook_blockedcount2 as "addressBook.blockedCount" }