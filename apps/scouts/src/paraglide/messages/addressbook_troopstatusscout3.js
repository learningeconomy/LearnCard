/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Troopstatusscout3Inputs */

const en_addressbook_troopstatusscout3 = /** @type {(inputs: Addressbook_Troopstatusscout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const es_addressbook_troopstatusscout3 = /** @type {(inputs: Addressbook_Troopstatusscout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const fr_addressbook_troopstatusscout3 = /** @type {(inputs: Addressbook_Troopstatusscout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const ar_addressbook_troopstatusscout3 = /** @type {(inputs: Addressbook_Troopstatusscout3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كشاف`)
};

/**
* | output |
* | --- |
* | "Scout" |
*
* @param {Addressbook_Troopstatusscout3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_troopstatusscout3 = /** @type {((inputs?: Addressbook_Troopstatusscout3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Troopstatusscout3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_troopstatusscout3(inputs)
	if (locale === "es") return es_addressbook_troopstatusscout3(inputs)
	if (locale === "fr") return fr_addressbook_troopstatusscout3(inputs)
	return ar_addressbook_troopstatusscout3(inputs)
});
export { addressbook_troopstatusscout3 as "addressBook.troopStatusScout" }