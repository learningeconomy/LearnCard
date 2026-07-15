/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Meritbadge2Inputs */

const en_addressbook_meritbadge2 = /** @type {(inputs: Addressbook_Meritbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badge`)
};

const es_addressbook_meritbadge2 = /** @type {(inputs: Addressbook_Meritbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia de Mérito`)
};

const fr_addressbook_meritbadge2 = /** @type {(inputs: Addressbook_Meritbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge de mérite`)
};

const ar_addressbook_meritbadge2 = /** @type {(inputs: Addressbook_Meritbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة الجدارة`)
};

/**
* | output |
* | --- |
* | "Merit Badge" |
*
* @param {Addressbook_Meritbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_meritbadge2 = /** @type {((inputs?: Addressbook_Meritbadge2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Meritbadge2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_meritbadge2(inputs)
	if (locale === "es") return es_addressbook_meritbadge2(inputs)
	if (locale === "fr") return fr_addressbook_meritbadge2(inputs)
	return ar_addressbook_meritbadge2(inputs)
});
export { addressbook_meritbadge2 as "addressBook.meritBadge" }