/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Troopstatusnationaladmin4Inputs */

const en_addressbook_troopstatusnationaladmin4 = /** @type {(inputs: Addressbook_Troopstatusnationaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin`)
};

const es_addressbook_troopstatusnationaladmin4 = /** @type {(inputs: Addressbook_Troopstatusnationaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Nacional`)
};

const fr_addressbook_troopstatusnationaladmin4 = /** @type {(inputs: Addressbook_Troopstatusnationaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur national`)
};

const ar_addressbook_troopstatusnationaladmin4 = /** @type {(inputs: Addressbook_Troopstatusnationaladmin4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسؤول وطني`)
};

/**
* | output |
* | --- |
* | "National Admin" |
*
* @param {Addressbook_Troopstatusnationaladmin4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_troopstatusnationaladmin4 = /** @type {((inputs?: Addressbook_Troopstatusnationaladmin4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Troopstatusnationaladmin4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_troopstatusnationaladmin4(inputs)
	if (locale === "es") return es_addressbook_troopstatusnationaladmin4(inputs)
	if (locale === "fr") return fr_addressbook_troopstatusnationaladmin4(inputs)
	return ar_addressbook_troopstatusnationaladmin4(inputs)
});
export { addressbook_troopstatusnationaladmin4 as "addressBook.troopStatusNationalAdmin" }