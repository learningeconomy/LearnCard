/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Loading1Inputs */

const en_addressbook_loading1 = /** @type {(inputs: Addressbook_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_addressbook_loading1 = /** @type {(inputs: Addressbook_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_addressbook_loading1 = /** @type {(inputs: Addressbook_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement en cours...`)
};

const ar_addressbook_loading1 = /** @type {(inputs: Addressbook_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Addressbook_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_loading1 = /** @type {((inputs?: Addressbook_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_loading1(inputs)
	if (locale === "es") return es_addressbook_loading1(inputs)
	if (locale === "fr") return fr_addressbook_loading1(inputs)
	return ar_addressbook_loading1(inputs)
});
export { addressbook_loading1 as "addressBook.loading" }