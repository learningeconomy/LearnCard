/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Troopstatusglobaladmin4Inputs */

const en_addressbook_troopstatusglobaladmin4 = /** @type {(inputs: Addressbook_Troopstatusglobaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Admin`)
};

const es_addressbook_troopstatusglobaladmin4 = /** @type {(inputs: Addressbook_Troopstatusglobaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Global`)
};

const fr_addressbook_troopstatusglobaladmin4 = /** @type {(inputs: Addressbook_Troopstatusglobaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur mondial`)
};

const ar_addressbook_troopstatusglobaladmin4 = /** @type {(inputs: Addressbook_Troopstatusglobaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول عام`)
};

/**
* | output |
* | --- |
* | "Global Admin" |
*
* @param {Addressbook_Troopstatusglobaladmin4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_troopstatusglobaladmin4 = /** @type {((inputs?: Addressbook_Troopstatusglobaladmin4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Troopstatusglobaladmin4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_troopstatusglobaladmin4(inputs)
	if (locale === "es") return es_addressbook_troopstatusglobaladmin4(inputs)
	if (locale === "fr") return fr_addressbook_troopstatusglobaladmin4(inputs)
	return ar_addressbook_troopstatusglobaladmin4(inputs)
});
export { addressbook_troopstatusglobaladmin4 as "addressBook.troopStatusGlobalAdmin" }