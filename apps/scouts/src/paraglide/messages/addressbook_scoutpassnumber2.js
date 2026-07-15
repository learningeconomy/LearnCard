/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Scoutpassnumber2Inputs */

const en_addressbook_scoutpassnumber2 = /** @type {(inputs: Addressbook_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass Number (DID)`)
};

const es_addressbook_scoutpassnumber2 = /** @type {(inputs: Addressbook_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de ScoutPass (DID)`)
};

const fr_addressbook_scoutpassnumber2 = /** @type {(inputs: Addressbook_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro ScoutPass (DID)`)
};

const ar_addressbook_scoutpassnumber2 = /** @type {(inputs: Addressbook_Scoutpassnumber2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم ScoutPass (DID)`)
};

/**
* | output |
* | --- |
* | "ScoutPass Number (DID)" |
*
* @param {Addressbook_Scoutpassnumber2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_scoutpassnumber2 = /** @type {((inputs?: Addressbook_Scoutpassnumber2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Scoutpassnumber2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_scoutpassnumber2(inputs)
	if (locale === "es") return es_addressbook_scoutpassnumber2(inputs)
	if (locale === "fr") return fr_addressbook_scoutpassnumber2(inputs)
	return ar_addressbook_scoutpassnumber2(inputs)
});
export { addressbook_scoutpassnumber2 as "addressBook.scoutpassNumber" }