/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Chooseboosttype3Inputs */

const en_addressbook_chooseboosttype3 = /** @type {(inputs: Addressbook_Chooseboosttype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose Boost Type:`)
};

const es_addressbook_chooseboosttype3 = /** @type {(inputs: Addressbook_Chooseboosttype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elegir Tipo de Boost:`)
};

const fr_addressbook_chooseboosttype3 = /** @type {(inputs: Addressbook_Chooseboosttype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisir le type de Boost :`)
};

const ar_addressbook_chooseboosttype3 = /** @type {(inputs: Addressbook_Chooseboosttype3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose Boost Type:`)
};

/**
* | output |
* | --- |
* | "Choose Boost Type:" |
*
* @param {Addressbook_Chooseboosttype3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_chooseboosttype3 = /** @type {((inputs?: Addressbook_Chooseboosttype3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Chooseboosttype3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_chooseboosttype3(inputs)
	if (locale === "es") return es_addressbook_chooseboosttype3(inputs)
	if (locale === "fr") return fr_addressbook_chooseboosttype3(inputs)
	return ar_addressbook_chooseboosttype3(inputs)
});
export { addressbook_chooseboosttype3 as "addressBook.chooseBoostType" }