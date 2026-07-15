/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Troopstatusleader3Inputs */

const en_addressbook_troopstatusleader3 = /** @type {(inputs: Addressbook_Troopstatusleader3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leader`)
};

const es_addressbook_troopstatusleader3 = /** @type {(inputs: Addressbook_Troopstatusleader3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Líder`)
};

const fr_addressbook_troopstatusleader3 = /** @type {(inputs: Addressbook_Troopstatusleader3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Responsable`)
};

const ar_addressbook_troopstatusleader3 = /** @type {(inputs: Addressbook_Troopstatusleader3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائد`)
};

/**
* | output |
* | --- |
* | "Leader" |
*
* @param {Addressbook_Troopstatusleader3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_troopstatusleader3 = /** @type {((inputs?: Addressbook_Troopstatusleader3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Troopstatusleader3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_troopstatusleader3(inputs)
	if (locale === "es") return es_addressbook_troopstatusleader3(inputs)
	if (locale === "fr") return fr_addressbook_troopstatusleader3(inputs)
	return ar_addressbook_troopstatusleader3(inputs)
});
export { addressbook_troopstatusleader3 as "addressBook.troopStatusLeader" }