/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Boostlabel2Inputs */

const en_addressbook_boostlabel2 = /** @type {(inputs: Addressbook_Boostlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const es_addressbook_boostlabel2 = /** @type {(inputs: Addressbook_Boostlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const fr_addressbook_boostlabel2 = /** @type {(inputs: Addressbook_Boostlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const ar_addressbook_boostlabel2 = /** @type {(inputs: Addressbook_Boostlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

/**
* | output |
* | --- |
* | "Boost" |
*
* @param {Addressbook_Boostlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_boostlabel2 = /** @type {((inputs?: Addressbook_Boostlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Boostlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_boostlabel2(inputs)
	if (locale === "es") return es_addressbook_boostlabel2(inputs)
	if (locale === "fr") return fr_addressbook_boostlabel2(inputs)
	return ar_addressbook_boostlabel2(inputs)
});
export { addressbook_boostlabel2 as "addressBook.boostLabel" }